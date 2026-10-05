/// <reference types="jest" />

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerStorage } from '@nestjs/throttler';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';
import { createHash, randomUUID } from 'node:crypto';
import type { Server } from 'node:http';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  CUSTOMER_COOKIES,
  CustomerAuthConfig,
} from '../src/modules/customer-auth/customer-auth.config';
import { createTestApp } from './support/create-test-app';

const input = {
  email: 'customer@example.test',
  name: 'Ada Lovelace',
  password: '  Correct password 123!  ',
  phone: '0400000000',
};
type IdentityBody = {
  user: {
    id: string;
    email: string;
    name: string | null;
    phone: string | null;
  };
};

function cookies(response: request.Response): string[] {
  const value: unknown = response.headers['set-cookie'];
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === 'string')
    : [];
}
function cookie(response: request.Response, name: string): string {
  const value = cookies(response).find((entry) => entry.startsWith(`${name}=`));
  if (!value) throw new Error(`Missing cookie ${name}`);
  return value.split(';')[0];
}
function token(response: request.Response, name: string): string {
  return cookie(response, name).slice(name.length + 1);
}
function mutation(server: Server, path: string, body: object = {}) {
  return request(server)
    .post(`/api/customer/auth/${path}`)
    .set('Origin', 'http://localhost:3000')
    .set('X-Orderly-Client', 'customer-web')
    .send(body);
}

describe('Customer authentication API', () => {
  let app: INestApplication;
  let server: Server;
  let prisma: PrismaService;
  let jwt: JwtService;
  let config: CustomerAuthConfig;

  beforeAll(async () => {
    // Functional cases are independent of rate counters; a separate real-guard suite tests limits.
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ThrottlerStorage)
      .useValue({
        increment: () =>
          Promise.resolve({
            totalHits: 1,
            timeToExpire: 60,
            isBlocked: false,
            timeToBlockExpire: 0,
          }),
      })
      .compile();
    app = module.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
    server = app.getHttpServer() as Server;
    prisma = app.get(PrismaService);
    jwt = app.get(JwtService);
    config = app.get(CustomerAuthConfig);
  });
  afterAll(async () => {
    await app.close();
  });
  beforeEach(async () => {
    await prisma.customerSession.deleteMany();
    await prisma.customerUser.deleteMany();
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  async function register() {
    return mutation(server, 'register', input).expect(201);
  }

  it('registers a normalized identity, preserves password whitespace and persists only hashes', async () => {
    const response = await mutation(server, 'register', {
      ...input,
      email: '  CUSTOMER@EXAMPLE.TEST  ',
      name: '  Ada Lovelace  ',
    }).expect(201);
    const body = response.body as IdentityBody;
    expect(Object.keys(body)).toEqual(['user']);
    expect(Object.keys(body.user).sort()).toEqual([
      'email',
      'id',
      'name',
      'phone',
    ]);
    expect(body.user).toMatchObject({
      email: input.email,
      name: input.name,
      phone: input.phone,
    });
    const user = await prisma.customerUser.findUniqueOrThrow({
      where: { id: body.user.id },
    });
    expect(user.passwordHash).not.toBe(input.password);
    expect(await bcrypt.compare(input.password, user.passwordHash!)).toBe(true);
    expect(
      await bcrypt.compare(input.password.trim(), user.passwordHash!),
    ).toBe(false);
    expect(user.googleSubject).toBeNull();
    const session = await prisma.customerSession.findFirstOrThrow();
    const refresh = token(response, CUSTOMER_COOKIES.refresh);
    expect(session.refreshTokenHash).toBe(
      createHash('sha256').update(refresh).digest('hex'),
    );
    expect(session.refreshTokenHash).toHaveLength(64);
    expect(JSON.stringify(response.body)).not.toMatch(
      /password|token|session|googleSubject|isActive/i,
    );
    for (const name of Object.values(CUSTOMER_COOKIES)) {
      const attributes = cookies(response).find((entry) =>
        entry.startsWith(`${name}=`),
      )!;
      expect(attributes).toContain('HttpOnly');
      expect(attributes).toContain('SameSite=Lax');
      expect(attributes).toContain('Path=/api');
      expect(attributes).not.toContain('Domain=');
    }
    expect(
      cookies(response).find((entry) =>
        entry.startsWith(`${CUSTOMER_COOKIES.refresh}=`),
      ),
    ).toContain('Max-Age=');
    expect(
      cookies(response).find((entry) =>
        entry.startsWith(`${CUSTOMER_COOKIES.access}=`),
      ),
    ).not.toContain('Max-Age=');
    expect(
      session.expiresAt.getTime() - session.createdAt.getTime(),
    ).toBeLessThanOrEqual(7 * 86400000);
    await request(server)
      .get('/api/customer/auth/me')
      .set('Cookie', cookie(response, CUSTOMER_COOKIES.access))
      .expect(200, { user: body.user });
  });

  it.each([
    { name: '' },
    { name: '   ' },
    { name: null },
    { email: 'invalid' },
    { password: 'short' },
    { password: 'a'.repeat(73) },
    { password: '😀'.repeat(19) },
    { phone: 'a'.repeat(41) },
    { customerUserId: randomUUID() },
  ])('rejects invalid registration %j without persistence', async (patch) => {
    await mutation(server, 'register', { ...input, ...patch }).expect(400);
    expect(await prisma.customerUser.count()).toBe(0);
    expect(await prisma.customerSession.count()).toBe(0);
  });

  it('accepts exactly 72 UTF-8 password bytes', async () => {
    await mutation(server, 'register', {
      ...input,
      password: '😀'.repeat(18),
    }).expect(201);
    await mutation(server, 'login', {
      email: input.email,
      password: '😀'.repeat(18),
    }).expect(200);
  });

  it('rejects normalized duplicate registration without creating a new session', async () => {
    await register();
    await mutation(server, 'register', {
      ...input,
      email: input.email.toUpperCase(),
    }).expect(409);
    expect(await prisma.customerUser.count()).toBe(1);
    expect(await prisma.customerSession.count()).toBe(1);
  });

  it('handles concurrent duplicate registrations through the unique constraint', async () => {
    const results = await Promise.all([
      mutation(server, 'register', input),
      mutation(server, 'register', input),
    ]);
    expect(results.map((result) => result.status).sort()).toEqual([201, 409]);
    expect(await prisma.customerUser.count()).toBe(1);
    expect(await prisma.customerSession.count()).toBe(1);
  });

  it('logs in using normalized email and returns sanitized identity', async () => {
    const registered = await register();
    const response = await mutation(server, 'login', {
      email: input.email.toUpperCase(),
      password: input.password,
    }).expect(200);
    expect(response.body).toEqual(registered.body);
    expect(await prisma.customerSession.count()).toBe(2);
  });

  it.each([
    'missing',
    'wrong-password',
    'inactive',
    'google-only',
    'credentialless',
  ])('returns the same generic error for %s', async (kind) => {
    if (kind !== 'missing') {
      await register();
      if (kind === 'inactive')
        await prisma.customerUser.updateMany({ data: { isActive: false } });
      if (kind === 'google-only')
        await prisma.customerUser.updateMany({
          data: { passwordHash: null, googleSubject: 'future-subject' },
        });
      if (kind === 'credentialless')
        await prisma.customerUser.updateMany({ data: { passwordHash: null } });
      await prisma.customerSession.deleteMany();
    }
    const response = await mutation(server, 'login', {
      email: input.email,
      password: kind === 'wrong-password' ? 'wrong password' : input.password,
    }).expect(401);
    expect((response.body as { message: string }).message).toBe(
      'Invalid email or password.',
    );
    expect(await prisma.customerSession.count()).toBe(0);
  });

  it('does not replace a future Google-only account during registration', async () => {
    const user = await prisma.customerUser.create({
      data: { email: input.email, googleSubject: 'google-subject' },
    });
    await mutation(server, 'register', input).expect(409);
    expect(
      await prisma.customerUser.findUniqueOrThrow({ where: { id: user.id } }),
    ).toMatchObject({
      passwordHash: null,
      googleSubject: 'google-subject',
      name: null,
    });
  });

  it('rotates refresh tokens and revokes the session on old-token replay', async () => {
    const initial = await register();
    const rotated = await mutation(server, 'refresh')
      .set('Cookie', cookie(initial, CUSTOMER_COOKIES.refresh))
      .expect(200);
    expect(token(rotated, CUSTOMER_COOKIES.refresh)).not.toBe(
      token(initial, CUSTOMER_COOKIES.refresh),
    );
    expect(
      (await prisma.customerSession.findFirstOrThrow()).refreshTokenVersion,
    ).toBe(1);
    await mutation(server, 'refresh')
      .set('Cookie', cookie(initial, CUSTOMER_COOKIES.refresh))
      .expect(401);
    expect(await prisma.customerSession.count()).toBe(0);
    await request(server)
      .get('/api/customer/auth/me')
      .set('Cookie', cookie(rotated, CUSTOMER_COOKIES.access))
      .expect(401);
  });

  it.each(['digest', 'expired', 'absolute', 'inactive', 'credentialless'])(
    'rejects and revokes a session with %s failure',
    async (kind) => {
      const initial = await register();
      const data =
        kind === 'digest'
          ? { refreshTokenHash: '0'.repeat(64) }
          : kind === 'expired'
            ? { expiresAt: new Date(Date.now() - 1000) }
            : kind === 'absolute'
              ? { createdAt: new Date(Date.now() - 31 * 86400000) }
              : {};
      await prisma.customerSession.updateMany({ data });
      if (kind === 'inactive')
        await prisma.customerUser.updateMany({ data: { isActive: false } });
      if (kind === 'credentialless')
        await prisma.customerUser.updateMany({ data: { passwordHash: null } });
      if (kind !== 'digest')
        await request(server)
          .get('/api/customer/auth/me')
          .set('Cookie', cookie(initial, CUSTOMER_COOKIES.access))
          .expect(401);
      const response = await mutation(server, 'refresh')
        .set('Cookie', cookie(initial, CUSTOMER_COOKIES.refresh))
        .expect(401);
      expect(await prisma.customerSession.count()).toBe(0);
      expect(cookies(response)).toHaveLength(2);
      expect(
        cookies(response).every((entry) =>
          entry.includes('Expires=Thu, 01 Jan 1970'),
        ),
      ).toBe(true);
    },
  );

  it('caps sliding refresh and JWT expiry at the original absolute deadline', async () => {
    const initial = await register();
    const createdAt = new Date(Date.now() - 29 * 86400000);
    await prisma.customerSession.updateMany({ data: { createdAt } });
    const response = await mutation(server, 'refresh')
      .set('Cookie', cookie(initial, CUSTOMER_COOKIES.refresh))
      .expect(200);
    const session = await prisma.customerSession.findFirstOrThrow();
    expect(session.createdAt).toEqual(createdAt);
    expect(session.expiresAt.getTime()).toBe(
      createdAt.getTime() + 30 * 86400000,
    );
    const decoded = jwt.decode<{ exp: number }>(
      token(response, CUSTOMER_COOKIES.refresh),
    );
    expect(decoded.exp * 1000).toBeLessThanOrEqual(session.expiresAt.getTime());
  });

  it('allows only one winner for simultaneous refreshes, with fail-closed replay handling', async () => {
    const initial = await register();
    const results = await Promise.all(
      [0, 1].map(() =>
        mutation(server, 'refresh').set(
          'Cookie',
          cookie(initial, CUSTOMER_COOKIES.refresh),
        ),
      ),
    );
    expect(results.map((result) => result.status).sort()).toEqual([200, 401]);
    const session = await prisma.customerSession.findFirst();
    if (session) expect(session.refreshTokenVersion).toBe(1);
    const winner = results.find((result) => result.status === 200)!;
    await request(server)
      .get('/api/customer/auth/me')
      .set('Cookie', cookie(winner, CUSTOMER_COOKIES.access))
      .expect(session ? 200 : 401);
  });

  it('logout is idempotent, revokes immediately and leaves Admin sessions intact', async () => {
    const initial = await register();
    const admin = await prisma.adminUser.create({
      data: {
        email: `${randomUUID()}@admin.test`,
        passwordHash: await bcrypt.hash('admin password', 12),
      },
    });
    const adminSession = await prisma.adminSession.create({
      data: {
        adminUserId: admin.id,
        refreshTokenHash: 'admin-hash',
        expiresAt: new Date(Date.now() + 86400000),
      },
    });
    const response = await mutation(server, 'logout')
      .set('Cookie', cookie(initial, CUSTOMER_COOKIES.refresh))
      .expect(204);
    expect(cookies(response)).toHaveLength(2);
    expect(await prisma.customerSession.count()).toBe(0);
    await request(server)
      .get('/api/customer/auth/me')
      .set('Cookie', cookie(initial, CUSTOMER_COOKIES.access))
      .expect(401);
    await mutation(server, 'logout').expect(204);
    await mutation(server, 'logout')
      .set('Cookie', `${CUSTOMER_COOKIES.refresh}=invalid`)
      .expect(204);
    expect(
      await prisma.adminSession.findUnique({ where: { id: adminSession.id } }),
    ).not.toBeNull();
    await prisma.adminUser.delete({ where: { id: admin.id } });
  });

  it('supports immediate explicit revocation and cascades customer deletion', async () => {
    const initial = await register();
    await prisma.customerSession.deleteMany();
    await request(server)
      .get('/api/customer/auth/me')
      .set('Cookie', cookie(initial, CUSTOMER_COOKIES.access))
      .expect(401);
    await mutation(server, 'refresh')
      .set('Cookie', cookie(initial, CUSTOMER_COOKIES.refresh))
      .expect(401);
    await mutation(server, 'login', {
      email: input.email,
      password: input.password,
    }).expect(200);
    await prisma.customerUser.deleteMany();
    expect(await prisma.customerSession.count()).toBe(0);
  });

  it('isolates both cookie namespaces and signing domains, including renamed cookies', async () => {
    const initial = await register();
    const customerAccess = token(initial, CUSTOMER_COOKIES.access);
    await request(server)
      .get('/api/auth/me')
      .set('Cookie', cookie(initial, CUSTOMER_COOKIES.access))
      .expect(401);
    await request(server)
      .get('/api/auth/me')
      .set('Cookie', `orderly_admin_access=${customerAccess}`)
      .expect(401);
    const admin = await prisma.adminUser.create({
      data: {
        email: `${randomUUID()}@admin.test`,
        passwordHash: await bcrypt.hash('admin password', 12),
      },
    });
    const loggedIn = await request(server)
      .post('/api/auth/login')
      .send({ email: admin.email, password: 'admin password' })
      .expect(200);
    await request(server)
      .get('/api/customer/auth/me')
      .set('Cookie', cookie(loggedIn, 'orderly_admin_access'))
      .expect(401);
    await request(server)
      .get('/api/customer/auth/me')
      .set(
        'Cookie',
        `${CUSTOMER_COOKIES.access}=${token(loggedIn, 'orderly_admin_access')}`,
      )
      .expect(401);
    await mutation(server, 'refresh')
      .set(
        'Cookie',
        `${CUSTOMER_COOKIES.refresh}=${token(loggedIn, 'orderly_admin_refresh')}`,
      )
      .expect(401);
    await request(server)
      .post('/api/auth/refresh')
      .set(
        'Cookie',
        `orderly_admin_refresh=${token(initial, CUSTOMER_COOKIES.refresh)}`,
      )
      .expect(401);
    await prisma.adminUser.delete({ where: { id: admin.id } });
  });

  it.each([
    'expired',
    'wrong-type',
    'wrong-audience',
    'wrong-issuer',
    'missing-jti',
    'invalid-sub',
  ])('rejects access JWT with %s', async (kind) => {
    const initial = await register();
    const session = await prisma.customerSession.findFirstOrThrow();
    const signed = await jwt.signAsync(
      {
        sub: kind === 'invalid-sub' ? 'not-a-uuid' : session.customerUserId,
        sid: session.id,
        tokenType:
          kind === 'wrong-type' ? 'customer_refresh' : 'customer_access',
        ...(kind === 'missing-jti' ? {} : { jti: randomUUID() }),
      },
      {
        secret: config.accessSecret,
        issuer: kind === 'wrong-issuer' ? 'other' : config.issuer,
        audience: kind === 'wrong-audience' ? 'other' : config.audience,
        expiresIn: kind === 'expired' ? -1 : 60,
      },
    );
    await request(server)
      .get('/api/customer/auth/me')
      .set('Cookie', `${CUSTOMER_COOKIES.access}=${signed}`)
      .expect(401);
    expect(await prisma.customerSession.count()).toBe(1);
    await request(server)
      .get('/api/customer/auth/me')
      .set('Cookie', cookie(initial, CUSTOMER_COOKIES.access))
      .expect(200);
  });

  it.each(['register', 'login', 'refresh', 'logout'])(
    'rejects missing/foreign Origin, missing header and non-JSON on %s',
    async (path) => {
      await request(server)
        .post(`/api/customer/auth/${path}`)
        .set('X-Orderly-Client', 'customer-web')
        .send(input)
        .expect(403);
      await mutation(server, path, input)
        .set('Origin', 'https://attacker.test')
        .expect(403);
      await request(server)
        .post(`/api/customer/auth/${path}`)
        .set('Origin', 'http://localhost:3000')
        .send(input)
        .expect(403);
      await request(server)
        .post(`/api/customer/auth/${path}`)
        .set('Origin', 'http://localhost:3000')
        .set('X-Orderly-Client', 'customer-web')
        .type('form')
        .send(input)
        .expect(403);
      expect(await prisma.customerUser.count()).toBe(0);
    },
  );

  it('rejects Origin prefix tricks and null Origin', async () => {
    for (const origin of [
      'null',
      'http://localhost:3000.attacker.test',
      'http://localhost:3000/',
    ]) {
      await mutation(server, 'register', input)
        .set('Origin', origin)
        .expect(403);
    }
  });
});

describe('Customer auth real rate limits', () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = await createTestApp();
  });
  afterAll(async () => {
    await app.close();
  });
  it('limits password login to five attempts per minute', async () => {
    const server = app.getHttpServer() as Server;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await mutation(server, 'login', {
        email: 'absent@rate.test',
        password: 'wrong',
      }).expect(401);
    }
    await mutation(server, 'login', {
      email: 'absent@rate.test',
      password: 'wrong',
    }).expect(429);
  });
});
