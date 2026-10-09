/// <reference types="jest" />
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerStorage } from '@nestjs/throttler';
import cookieParser from 'cookie-parser';
import type { Server } from 'node:http';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { CustomerAuthService } from '../src/modules/customer-auth/customer-auth.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { expectPrivateCache } from './support/cache-policy';

const email = 'account-management@example.test';
const oldPassword = 'A correct password 123!';
const newPassword = 'A different password 456!';

function cookie(response: request.Response, name: string) {
  const values: unknown = response.headers['set-cookie'];
  const entries: unknown[] = Array.isArray(values) ? values : [];
  const item = entries.find(
    (value): value is string =>
      typeof value === 'string' && value.startsWith(`${name}=`),
  );
  if (!item) throw new Error(`Missing ${name} cookie`);
  return item.split(';')[0];
}

describe('Customer account management', () => {
  let app: INestApplication;
  let server: Server;
  let prisma: PrismaService;

  beforeAll(async () => {
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
  });
  afterAll(async () => {
    await app.close();
  });
  beforeEach(async () => {
    await prisma.customerOAuthTransaction.deleteMany();
    await prisma.customerSession.deleteMany();
    await prisma.customerUser.deleteMany();
  });

  function mutation(
    method: 'post' | 'patch',
    path: string,
    body: object,
    cookies: string[] = [],
  ) {
    return request(server)
      [method](`/api/customer/${path}`)
      .set('Origin', 'http://localhost:3000')
      .set('X-Orderly-Client', 'customer-web')
      .set('Cookie', cookies)
      .send(body);
  }
  async function register(address = email) {
    return mutation('post', 'auth/register', {
      email: address,
      name: 'First Name',
      password: oldPassword,
    }).expect(201);
  }
  function cookies(response: request.Response) {
    return [
      cookie(response, 'orderly_customer_access'),
      cookie(response, 'orderly_customer_refresh'),
    ];
  }

  it('updates only the authenticated profile and returns sanitized identity', async () => {
    const first = await register();
    const second = await register('other-account@example.test');
    const secondId = (second.body as { user: { id: string } }).user.id;
    await mutation(
      'patch',
      'account',
      { name: '  New Name  ', phone: ' +61 400 123 456 ' },
      cookies(first),
    )
      .expect(expectPrivateCache)
      .expect(200)
      .expect(({ body }: request.Response) => {
        const user = (body as { user: Record<string, unknown> }).user;
        expect(user).toMatchObject({
          name: 'New Name',
          phone: '+61 400 123 456',
        });
        expect(user).not.toHaveProperty('passwordHash');
        expect(user).not.toHaveProperty('googleSubject');
        expect(user).not.toHaveProperty('sessionId');
      });
    const current = await request(server)
      .get('/api/customer/auth/me')
      .set('Cookie', cookie(first, 'orderly_customer_access'))
      .expect(expectPrivateCache)
      .expect(200);
    expect((current.body as { user: { phone: string } }).user.phone).toBe(
      '+61 400 123 456',
    );
    expect(
      (await prisma.customerUser.findUniqueOrThrow({ where: { id: secondId } }))
        .name,
    ).toBe('First Name');
    await mutation('patch', 'account', { phone: '' }, cookies(first))
      .expect(200)
      .expect(({ body }: request.Response) =>
        expect(
          (body as { user: { phone: string | null } }).user.phone,
        ).toBeNull(),
      );
    expect(
      (await prisma.customerUser.findUniqueOrThrow({ where: { email } })).phone,
    ).toBeNull();
  });

  it('rejects unapproved fields, invalid values, anonymous and inactive access', async () => {
    const first = await register();
    const id = (first.body as { user: { id: string } }).user.id;
    await mutation('patch', 'account', { name: 'New' }).expect(401);
    for (const body of [
      { name: '   ' },
      { name: null },
      { name: 'x'.repeat(121) },
      { phone: 'abc' },
      { email: 'changed@example.test' },
      { customerId: id },
      { authMethods: { password: false } },
      { googleSubject: 'forbidden' },
      { password: 'forbidden' },
    ])
      await mutation('patch', 'account', body, cookies(first)).expect(400);
    await prisma.customerUser.update({
      where: { id },
      data: { isActive: false },
    });
    await mutation(
      'patch',
      'account',
      { name: 'Changed' },
      cookies(first),
    ).expect(401);
  });

  it('changes the password, revokes every old customer session and replaces the current one', async () => {
    const first = await register();
    const second = await mutation('post', 'auth/login', {
      email,
      password: oldPassword,
    }).expect(200);
    const firstCookies = cookies(first);
    const secondCookies = cookies(second);
    const previousHash = (
      await prisma.customerUser.findUniqueOrThrow({ where: { email } })
    ).passwordHash;
    const admin = await prisma.adminUser.create({
      data: {
        email: 'account-management-admin@example.test',
        passwordHash: 'unrelated-admin-hash',
      },
    });
    const adminSession = await prisma.adminSession.create({
      data: {
        adminUserId: admin.id,
        refreshTokenHash: 'a'.repeat(64),
        expiresAt: new Date(Date.now() + 60_000),
      },
    });
    await mutation(
      'post',
      'account/password',
      { currentPassword: 'wrong', newPassword },
      firstCookies,
    ).expect(400);
    for (const invalid of ['short', '🙂'.repeat(19)]) {
      await mutation(
        'post',
        'account/password',
        { currentPassword: oldPassword, newPassword: invalid },
        firstCookies,
      ).expect(400);
    }
    const changed = await mutation(
      'post',
      'account/password',
      {
        currentPassword: oldPassword,
        newPassword,
      },
      firstCookies,
    ).expect(200);
    expect(
      (changed.body as { user: { authMethods: unknown } }).user.authMethods,
    ).toEqual({
      password: true,
      google: false,
    });
    expect(await prisma.customerSession.count()).toBe(1);
    expect(
      await prisma.adminSession.findUnique({ where: { id: adminSession.id } }),
    ).toMatchObject({ adminUserId: admin.id });
    expect(
      (await prisma.customerUser.findUniqueOrThrow({ where: { email } }))
        .passwordHash,
    ).not.toBe(previousHash);
    for (const previous of [firstCookies, secondCookies]) {
      await request(server)
        .get('/api/customer/auth/me')
        .set('Cookie', previous[0])
        .expect(401);
      await mutation('post', 'auth/refresh', {}, [previous[1]]).expect(401);
    }
    await request(server)
      .get('/api/customer/auth/me')
      .set('Cookie', cookie(changed, 'orderly_customer_access'))
      .expect(200);
    await mutation('post', 'auth/refresh', {}, [
      cookie(changed, 'orderly_customer_refresh'),
    ]).expect(200);
    await mutation('post', 'auth/login', {
      email,
      password: oldPassword,
    }).expect(401);
    await mutation('post', 'auth/login', {
      email,
      password: newPassword,
    }).expect(200);
    await prisma.adminUser.delete({ where: { id: admin.id } });
  });

  it('does not let Google-only customers establish a password', async () => {
    const auth = app.get(CustomerAuthService);
    const google = await auth.signInWithGoogle({
      subject: 'account-management-google',
      email,
      name: null,
    });
    await mutation('patch', 'account', { name: 'A Google Customer' }, [
      `orderly_customer_access=${google.accessToken}`,
    ])
      .expect(200)
      .expect(({ body }: request.Response) =>
        expect((body as { user: { name: string } }).user.name).toBe(
          'A Google Customer',
        ),
      );
    await mutation(
      'post',
      'account/password',
      {
        currentPassword: oldPassword,
        newPassword,
      },
      [`orderly_customer_access=${google.accessToken}`],
    ).expect(400);
    expect(
      (await prisma.customerUser.findUniqueOrThrow({ where: { email } }))
        .passwordHash,
    ).toBeNull();
  });
});
