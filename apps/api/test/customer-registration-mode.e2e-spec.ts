import type { INestApplication } from '@nestjs/common';
import type { Server } from 'node:http';
import { randomBytes } from 'node:crypto';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { createTestApp } from './support/create-test-app';
import { PrismaService } from '../src/prisma/prisma.service';
import { RegistrationMailer } from '../src/modules/customer-auth/registration-mailer';
import { registrationDigest } from '../src/modules/customer-auth/customer-registration.service';
import { CustomerAuthService } from '../src/modules/customer-auth/customer-auth.service';

const payload = (response: { body: unknown }) =>
  response.body as {
    user: { id: string; emailVerified: boolean };
    status: string;
  };

describe('Dual registration mode', () => {
  let direct: INestApplication;
  let verified: INestApplication;
  let prisma: PrismaService;
  const email = 'dual-mode@example.test';
  const password = 'Direct synthetic password 123!';
  const credentials = { name: 'Synthetic Owner', email, password };
  const post = (
    app: INestApplication,
    path: string,
    body: object,
    cookies: string[] = [],
  ) =>
    request(app.getHttpServer() as Server)
      .post(`/api/${path}`)
      .set('Origin', 'http://localhost:3000')
      .set('X-Orderly-Client', 'customer-web')
      .set('Cookie', cookies)
      .send(body);
  const register = (body: object = credentials) =>
    post(direct, 'customer/auth/register', body);
  const cookieJar = (headers: Record<string, unknown>) =>
    (headers['set-cookie'] as string[]).map((c) => c.split(';')[0]);
  beforeAll(async () => {
    const original = process.env.CUSTOMER_REGISTRATION_MODE;
    try {
      process.env.CUSTOMER_REGISTRATION_MODE = 'direct';
      direct = await createTestApp({ bypassThrottling: true });
      process.env.CUSTOMER_REGISTRATION_MODE = 'verified';
      verified = await createTestApp({ bypassThrottling: true });
    } finally {
      if (original === undefined) delete process.env.CUSTOMER_REGISTRATION_MODE;
      else process.env.CUSTOMER_REGISTRATION_MODE = original;
    }
    prisma = direct.get(PrismaService);
  });
  afterAll(async () => {
    await direct?.close();
    await verified?.close();
  });
  beforeEach(async () => {
    await prisma.order.deleteMany();
    await prisma.customerUser.deleteMany();
    await prisma.customerPendingRegistration.deleteMany();
  });
  afterEach(() => jest.restoreAllMocks());
  it('creates an unverified identity and immediate secure session without mail or pending rows', async () => {
    const send = jest.spyOn(direct.get(RegistrationMailer), 'send');
    const result = await register({
      ...credentials,
      email: ' DUAL-MODE@EXAMPLE.TEST ',
    }).expect(201);
    const user = await prisma.customerUser.findUniqueOrThrow({
      where: { email },
    });
    expect(user.emailVerifiedAt).toBeNull();
    expect(await bcrypt.compare(password, user.passwordHash!)).toBe(true);
    expect(payload(result).user).toMatchObject({
      id: user.id,
      email,
      emailVerified: false,
    });
    expect(result.body).not.toHaveProperty('passwordHash');
    expect(await prisma.customerPendingRegistration.count()).toBe(0);
    expect(send).not.toHaveBeenCalled();
    for (const cookie of result.headers['set-cookie'] as unknown as string[]) {
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('SameSite=Lax');
      expect(cookie).toContain('Path=/api;');
    }
    const cookies = cookieJar(result.headers);
    await request(direct.getHttpServer() as Server)
      .get('/api/customer/auth/me')
      .set('Cookie', cookies)
      .expect(200);
    await post(direct, 'customer/auth/login', { email, password }).expect(200);
    await request(direct.getHttpServer() as Server)
      .get('/api/auth/me')
      .set('Cookie', cookies)
      .expect(401);
  });
  it.each([undefined, null, '', 'too short', 'é'.repeat(37)])(
    'rejects invalid direct password %p',
    async (candidate) => {
      await register({ ...credentials, password: candidate }).expect(400);
      expect(await prisma.customerUser.count()).toBe(0);
    },
  );
  it('arbitrates concurrent canonical duplicate registration without duplicate sessions', async () => {
    const results = await Promise.all([
      register(),
      register({ ...credentials, email: email.toUpperCase() }),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 400]);
    expect(await prisma.customerUser.count()).toBe(1);
    expect(await prisma.customerSession.count()).toBe(1);
  });
  it('rolls back account creation if session issuance fails', async () => {
    jest
      .spyOn(JwtService.prototype, 'signAsync')
      .mockRejectedValue(new Error('Synthetic token issuance failure'));
    await register().expect(500);
    expect(await prisma.customerUser.count()).toBe(0);
    expect(await prisma.customerSession.count()).toBe(0);
  });
  it('pauses live pending links in direct mode, blocks conversion, and resumes legitimate verified proof', async () => {
    const token = randomBytes(32).toString('base64url');
    await prisma.customerPendingRegistration.create({
      data: {
        email,
        tokenHash: registrationDigest(token),
        expiresAt: new Date(Date.now() + 30 * 60_000),
        lastSentAt: new Date(),
        windowStartedAt: new Date(),
      },
    });
    await register().expect(400);
    await post(direct, 'customer/auth/registration/resend', { email }).expect(
      400,
    );
    await post(direct, 'customer/auth/registration/check', { token }).expect(
      400,
    );
    await post(direct, 'customer/auth/registration/complete', {
      token,
      name: 'Verified Owner',
      password,
    }).expect(400);
    expect(await prisma.customerUser.count()).toBe(0);
    const result = await post(verified, 'customer/auth/registration/complete', {
      token,
      name: 'Verified Owner',
      password,
    }).expect(200);
    expect(payload(result).user.emailVerified).toBe(true);
    await post(verified, 'customer/auth/registration/complete', {
      token,
      name: 'Replay',
      password,
    }).expect(400);
  });
  it('requires fresh direct credentials after pending expiry and never retroactively verifies them', async () => {
    const token = randomBytes(32).toString('base64url');
    await prisma.customerPendingRegistration.create({
      data: {
        email,
        tokenHash: registrationDigest(token),
        expiresAt: new Date(0),
        lastSentAt: new Date(),
        windowStartedAt: new Date(),
      },
    });
    const result = await register().expect(201);
    await post(verified, 'customer/auth/registration/complete', {
      token,
      name: 'Replay',
      password,
    }).expect(400);
    const me = await request(verified.getHttpServer() as Server)
      .get('/api/customer/auth/me')
      .set('Cookie', cookieJar(result.headers))
      .expect(200);
    expect(payload(me).user.emailVerified).toBe(false);
    expect(payload(me).user.id).toBe(payload(result).user.id);
  });
  it('rejects unknown verification proof without an account, session, cookies or mail', async () => {
    const send = jest.spyOn(verified.get(RegistrationMailer), 'send');
    const result = await post(verified, 'customer/auth/registration/complete', {
      token: randomBytes(32).toString('base64url'),
      name: credentials.name,
      password,
    }).expect(400);
    expect(result.headers['set-cookie']).toBeUndefined();
    expect(await prisma.customerUser.count()).toBe(0);
    expect(await prisma.customerSession.count()).toBe(0);
    expect(send).not.toHaveBeenCalled();
  });

  it('verified registration ignores initial credentials and exposes only its mode', async () => {
    const send = jest
      .spyOn(verified.get(RegistrationMailer), 'send')
      .mockResolvedValue();
    const result = await post(
      verified,
      'customer/auth/register',
      credentials,
    ).expect(201);
    expect(payload(result).status).toBe('pending');
    expect(result.headers['set-cookie']).toBeUndefined();
    expect(send).toHaveBeenCalledTimes(1);
    expect(await prisma.customerUser.count()).toBe(0);
    for (const [app, mode] of [
      [direct, 'direct'],
      [verified, 'verified'],
    ] as const) {
      const status = await request(app.getHttpServer() as Server)
        .get('/api/customer/auth/registration/status')
        .expect(200);
      expect(status.body).toEqual({ mode });
      expect(status.headers['cache-control']).toContain('no-store');
    }
  });
  it('does not merge direct email with a Google subject', async () => {
    await register().expect(201);
    await expect(
      direct.get(CustomerAuthService).signInWithGoogle({
        subject: 'synthetic-other-subject',
        email,
        name: 'Other',
      }),
    ).rejects.toThrow('already uses this email');
    expect(
      (await prisma.customerUser.findUniqueOrThrow({ where: { email } }))
        .googleSubject,
    ).toBeNull();
  });
  it('deletes using current password, revokes old session and re-registers a new UUID', async () => {
    const first = await register().expect(201);
    const cookies = cookieJar(first.headers);
    await post(
      direct,
      'customer/account/delete',
      { confirmation: 'DELETE', currentPassword: password },
      cookies,
    ).expect(200);
    await request(direct.getHttpServer() as Server)
      .get('/api/customer/auth/me')
      .set('Cookie', cookies)
      .expect(401);
    const second = await register().expect(201);
    expect(payload(second).user.id).not.toBe(payload(first).user.id);
    expect(payload(second).user.emailVerified).toBe(false);
  });
  it('isolates matching-email guest history and retains scrubbed owned financial records after deletion', async () => {
    const first = await register().expect(201);
    const cookies = cookieJar(first.headers);
    const snapshot = {
      orderType: 'PICKUP' as const,
      customerName: 'Synthetic Contact',
      customerEmail: email,
      customerPhone: '0400000000',
      subtotalCents: 1500,
      totalCents: 1500,
    };
    const guest = await prisma.order.create({
      data: { ...snapshot, orderNumber: 'DIRECT-GUEST', status: 'COMPLETED' },
    });
    const owned = await prisma.order.create({
      data: {
        ...snapshot,
        orderNumber: 'DIRECT-OWNED',
        customerUserId: payload(first).user.id,
        status: 'PENDING',
      },
    });
    await request(direct.getHttpServer() as Server)
      .get(`/api/customer/orders/${guest.id}`)
      .set('Cookie', cookies)
      .expect(404);
    await post(
      direct,
      'customer/account/delete',
      { confirmation: 'DELETE', currentPassword: password },
      cookies,
    ).expect(409);
    await prisma.order.update({
      where: { id: owned.id },
      data: { status: 'COMPLETED' },
    });
    await post(
      direct,
      'customer/account/delete',
      { confirmation: 'DELETE', currentPassword: password },
      cookies,
    ).expect(200);
    const retained = await prisma.order.findUniqueOrThrow({
      where: { id: owned.id },
    });
    expect(retained.customerUserId).toBeNull();
    expect(retained.totalCents).toBe(1500);
    expect(retained.customerEmail).not.toBe(email);
    expect(
      (await prisma.order.findUniqueOrThrow({ where: { id: guest.id } }))
        .customerEmail,
    ).toBe(email);
    const second = await register().expect(201);
    await request(direct.getHttpServer() as Server)
      .get(`/api/customer/orders/${owned.id}`)
      .set('Cookie', cookieJar(second.headers))
      .expect(404);
  });
  it('rejects cross-origin direct registration before account creation', async () => {
    await request(direct.getHttpServer() as Server)
      .post('/api/customer/auth/register')
      .set('Origin', 'https://attacker.example.test')
      .set('X-Orderly-Client', 'customer-web')
      .send(credentials)
      .expect(403);
    expect(await prisma.customerUser.count()).toBe(0);
  });
});

describe('Direct registration real HTTP guards', () => {
  it('limits unauthenticated creation to five attempts per client per minute', async () => {
    const original = process.env.CUSTOMER_REGISTRATION_MODE;
    process.env.CUSTOMER_REGISTRATION_MODE = 'direct';
    let app: INestApplication | undefined;
    try {
      app = await createTestApp();
      for (let i = 0; i < 6; i++) {
        // Invalid inputs count too; avoids creating accounts while exercising the real guard.
        await request(app.getHttpServer() as Server)
          .post('/api/customer/auth/register')
          .set('Origin', 'http://localhost:3000')
          .set('X-Orderly-Client', 'customer-web')
          .send({ email: 'guard@example.test', name: 'Guard' })
          .expect(i < 5 ? 400 : 429);
      }
    } finally {
      await app?.close();
      if (original === undefined) delete process.env.CUSTOMER_REGISTRATION_MODE;
      else process.env.CUSTOMER_REGISTRATION_MODE = original;
    }
  });
});
