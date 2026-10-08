/// <reference types="jest" />
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerStorage } from '@nestjs/throttler';
import cookieParser from 'cookie-parser';
import { createHash } from 'node:crypto';
import type { Server } from 'node:http';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { CustomerGoogleOAuthService } from '../src/modules/customer-auth/customer-google-oauth.service';
import { PrismaService } from '../src/prisma/prisma.service';

const password = 'A correct password 123!';
const email = 'account.browser@example.com';

function cookie(response: request.Response, name: string) {
  const values: unknown = response.headers['set-cookie'];
  const entries: unknown[] = Array.isArray(values) ? values : [];
  const item = entries.find(
    (value): value is string =>
      typeof value === 'string' && value.startsWith(`${name}=`),
  );
  if (!item) throw new Error(`Missing ${name} cookie`);
  return String(item).split(';')[0];
}

describe('Customer Google OAuth', () => {
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

  function mutation(path: string, body: object, cookies: string[] = []) {
    return request(server)
      .post(`/api/customer/auth/${path}`)
      .set('Origin', 'http://localhost:3000')
      .set('X-Orderly-Client', 'customer-web')
      .set('Cookie', cookies)
      .send(body);
  }
  async function register() {
    return mutation('register', {
      email,
      password,
      name: 'Password Customer',
    }).expect(201);
  }
  async function start(returnTo = '/account') {
    const response = await mutation('google/start', { returnTo }).expect(200);
    const url = new URL(
      (response.body as { authorizationUrl: string }).authorizationUrl,
    );
    return {
      state: url.searchParams.get('state')!,
      binding: cookie(response, 'orderly_customer_oauth'),
    };
  }
  async function providerCallback(state: string, identity: string) {
    const response = await request(server)
      .get('/api/customer/auth/google/test-provider/authorize')
      .query({ state, identity })
      .expect(303);
    return new URL(response.headers.location);
  }
  function callback(url: URL, cookies: string[]) {
    return request(server)
      .get(`${url.pathname}${url.search}`)
      .set('Cookie', cookies);
  }

  it('stores hashed, expiring, single-use state and binds the callback to its browser', async () => {
    const started = await start('https://attacker.example/');
    const transaction =
      await prisma.customerOAuthTransaction.findFirstOrThrow();
    expect(transaction.stateHash).toBe(
      createHash('sha256').update(started.state).digest('hex'),
    );
    expect(transaction.browserBindingHash).not.toContain(started.binding);
    expect(transaction.nonceHash).toHaveLength(64);
    expect(transaction.returnPath).toBe('/account');
    expect(transaction.expiresAt.getTime() - Date.now()).toBeLessThanOrEqual(
      300_000,
    );
    const url = await providerCallback(started.state, 'new');
    await callback(url, ['orderly_customer_oauth=wrong']).expect(303);
    expect(await prisma.customerOAuthTransaction.count()).toBe(1);
    const success = await callback(url, [started.binding]).expect(303);
    expect(success.headers.location).toBe(
      'http://localhost:3000/account?orderlyOAuth=complete',
    );
    expect(cookie(success, 'orderly_customer_access')).toContain(
      'orderly_customer_access=',
    );
    await callback(url, [started.binding]).expect(303);
    expect(await prisma.customerUser.count()).toBe(1);
    expect(await prisma.customerSession.count()).toBe(1);
    expect(await prisma.customerOAuthTransaction.count()).toBe(0);
  });

  it('consumes a declined sign-in without creating a customer or session', async () => {
    const started = await start('/checkout');
    const response = await request(server)
      .get('/api/customer/auth/google/callback')
      .query({ state: started.state, error: 'access_denied' })
      .set('Cookie', started.binding)
      .expect(303);
    expect(response.headers.location).toBe(
      'http://localhost:3000/login?google=cancelled',
    );
    expect(await prisma.customerOAuthTransaction.count()).toBe(0);
    expect(await prisma.customerUser.count()).toBe(0);
    expect(await prisma.customerSession.count()).toBe(0);
  });

  it('sends malformed callbacks through the controlled failure redirect even if purpose lookup fails', async () => {
    const google = app.get(CustomerGoogleOAuthService);
    const lookup = jest
      .spyOn(google, 'callbackPurpose')
      .mockRejectedValueOnce(new Error('lookup unavailable'));
    try {
      const response = await request(server)
        .get('/api/customer/auth/google/callback?state=malformed')
        .expect(303);
      expect(response.headers.location).toBe(
        'http://localhost:3000/login?google=failed',
      );
    } finally {
      lookup.mockRestore();
    }
  });

  it('rejects expired state and invalid nonce without creating an account', async () => {
    const expired = await start();
    await prisma.customerOAuthTransaction.updateMany({
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    await callback(await providerCallback(expired.state, 'new'), [
      expired.binding,
    ]).expect(303);
    expect(await prisma.customerUser.count()).toBe(0);
    await prisma.customerOAuthTransaction.deleteMany();
    const badNonce = await start();
    await prisma.customerOAuthTransaction.updateMany({
      data: { nonceHash: '0'.repeat(64) },
    });
    await callback(await providerCallback(badNonce.state, 'new'), [
      badNonce.binding,
    ]).expect(303);
    expect(await prisma.customerUser.count()).toBe(0);
  });

  it('creates a Google-only customer, reuses the subject and keeps stored email when provider email changes', async () => {
    const first = await start('/checkout');
    const success = await callback(await providerCallback(first.state, 'new'), [
      first.binding,
    ]).expect(303);
    expect(success.headers.location).toBe(
      'http://localhost:3000/checkout?orderlyOAuth=complete',
    );
    const user = await prisma.customerUser.findFirstOrThrow();
    expect(user).toMatchObject({
      email: 'google.browser@example.com',
      passwordHash: null,
      googleSubject: 'google-browser-new',
    });
    await request(server)
      .get('/api/customer/auth/me')
      .set('Cookie', cookie(success, 'orderly_customer_access'))
      .expect(200);
    const second = await start();
    await callback(await providerCallback(second.state, 'new'), [
      second.binding,
    ]).expect(303);
    expect(await prisma.customerUser.count()).toBe(1);
    expect(await prisma.customerSession.count()).toBe(2);
    await prisma.customerUser.update({
      where: { id: user.id },
      data: { email: 'changed@orderly.test' },
    });
    const third = await start();
    await callback(await providerCallback(third.state, 'new'), [
      third.binding,
    ]).expect(303);
    expect(
      (await prisma.customerUser.findUniqueOrThrow({ where: { id: user.id } }))
        .email,
    ).toBe('changed@orderly.test');
  });

  it('never merges an anonymous Google subject into a password account by matching email', async () => {
    await register();
    const started = await start();
    const response = await callback(
      await providerCallback(started.state, 'conflict'),
      [started.binding],
    ).expect(303);
    expect(response.headers.location).toBe(
      'http://localhost:3000/login?google=conflict',
    );
    expect(await prisma.customerUser.count()).toBe(1);
    expect(
      (await prisma.customerUser.findUniqueOrThrow({ where: { email } }))
        .googleSubject,
    ).toBeNull();
  });

  it('allows a fresh sign-in with another identity after a password-account collision', async () => {
    await register();
    const first = await start();
    const rejectedUrl = await providerCallback(first.state, 'conflict');
    const rejected = await callback(rejectedUrl, [first.binding]).expect(303);
    expect(rejected.headers.location).toBe(
      'http://localhost:3000/login?google=conflict',
    );
    expect(await prisma.customerOAuthTransaction.count()).toBe(0);
    const retry = await start('/checkout');
    expect(retry.state).not.toBe(first.state);
    expect(retry.binding).not.toBe(first.binding);
    const accepted = await callback(
      await providerCallback(retry.state, 'new'),
      [retry.binding],
    ).expect(303);
    expect(accepted.headers.location).toBe(
      'http://localhost:3000/checkout?orderlyOAuth=complete',
    );
    const identity = await request(server)
      .get('/api/customer/auth/me')
      .set('Cookie', cookie(accepted, 'orderly_customer_access'))
      .expect(200);
    expect((identity.body as { user: { email: string } }).user.email).toBe(
      'google.browser@example.com',
    );
    expect(
      (await prisma.customerUser.findUniqueOrThrow({ where: { email } }))
        .googleSubject,
    ).toBeNull();
    expect(await prisma.customerUser.count()).toBe(2);
    expect(await prisma.customerOAuthTransaction.count()).toBe(0);
    await callback(rejectedUrl, [first.binding]).expect(303);
    expect(await prisma.customerUser.count()).toBe(2);
  });

  it('requires password reauthentication and links only the same verified account', async () => {
    const registered = await register();
    const cookies = [
      cookie(registered, 'orderly_customer_access'),
      cookie(registered, 'orderly_customer_refresh'),
    ];
    await mutation('google/connect', { password: 'wrong' }, cookies).expect(
      401,
    );
    const started = await mutation(
      'google/connect',
      { password },
      cookies,
    ).expect(200);
    const state = new URL(
      (started.body as { authorizationUrl: string }).authorizationUrl,
    ).searchParams.get('state')!;
    const result = await callback(await providerCallback(state, 'link'), [
      cookie(started, 'orderly_customer_oauth'),
      ...cookies,
    ]).expect(303);
    expect(result.headers.location).toBe(
      'http://localhost:3000/account?google=connected&orderlyOAuth=complete',
    );
    const original = await prisma.customerUser.findUniqueOrThrow({
      where: { email },
    });
    expect(original.googleSubject).toBe('google-browser-link');
    expect(await prisma.customerUser.count()).toBe(1);
    const refreshedIdentity = await request(server)
      .get('/api/customer/auth/me')
      .set('Cookie', cookie(registered, 'orderly_customer_access'))
      .expect(200);
    expect(
      (refreshedIdentity.body as { user: { authMethods: unknown } }).user
        .authMethods,
    ).toEqual({
      password: true,
      google: true,
    });
    const signin = await start();
    await callback(await providerCallback(signin.state, 'link'), [
      signin.binding,
    ]).expect(303);
    expect(await prisma.customerUser.count()).toBe(1);
  });

  it('rejects revoked linking sessions, email disagreement and a different already-linked subject', async () => {
    const registered = await register();
    const cookies = [
      cookie(registered, 'orderly_customer_access'),
      cookie(registered, 'orderly_customer_refresh'),
    ];
    const mismatch = await mutation(
      'google/connect',
      { password },
      cookies,
    ).expect(200);
    const mismatchState = new URL(
      (mismatch.body as { authorizationUrl: string }).authorizationUrl,
    ).searchParams.get('state')!;
    await callback(await providerCallback(mismatchState, 'other'), [
      cookie(mismatch, 'orderly_customer_oauth'),
      ...cookies,
    ]).expect(303);
    expect(
      (await prisma.customerUser.findUniqueOrThrow({ where: { email } }))
        .googleSubject,
    ).toBeNull();
    const revoked = await mutation(
      'google/connect',
      { password },
      cookies,
    ).expect(200);
    const revokedState = new URL(
      (revoked.body as { authorizationUrl: string }).authorizationUrl,
    ).searchParams.get('state')!;
    await prisma.customerSession.deleteMany();
    await callback(await providerCallback(revokedState, 'link'), [
      cookie(revoked, 'orderly_customer_oauth'),
      ...cookies,
    ]).expect(303);
    expect(
      (await prisma.customerUser.findUniqueOrThrow({ where: { email } }))
        .googleSubject,
    ).toBeNull();
  });

  it('handles concurrent first sign-ins without duplicate customer records', async () => {
    const first = await start();
    const second = await start();
    const [firstUrl, secondUrl] = await Promise.all([
      providerCallback(first.state, 'new'),
      providerCallback(second.state, 'new'),
    ]);
    const results = await Promise.all([
      callback(firstUrl, [first.binding]),
      callback(secondUrl, [second.binding]),
    ]);
    expect(results.map((result) => result.status)).toEqual([303, 303]);
    expect(
      await prisma.customerUser.count({
        where: { googleSubject: 'google-browser-new' },
      }),
    ).toBe(1);
    expect(await prisma.customerSession.count()).toBe(2);
  });

  it('keeps an inactive linked customer signed out', async () => {
    await prisma.customerUser.create({
      data: {
        email: 'google.browser@example.com',
        googleSubject: 'google-browser-new',
        isActive: false,
      },
    });
    const started = await start();
    const response = await callback(
      await providerCallback(started.state, 'new'),
      [started.binding],
    ).expect(303);
    expect(response.headers.location).toBe(
      'http://localhost:3000/login?google=failed',
    );
    expect(await prisma.customerSession.count()).toBe(0);
  });

  it('does not move a Google subject that belongs to another customer', async () => {
    await prisma.customerUser.create({
      data: {
        email: 'different@example.test',
        googleSubject: 'google-browser-link',
      },
    });
    const registered = await register();
    const cookies = [
      cookie(registered, 'orderly_customer_access'),
      cookie(registered, 'orderly_customer_refresh'),
    ];
    const started = await mutation(
      'google/connect',
      { password },
      cookies,
    ).expect(200);
    const state = new URL(
      (started.body as { authorizationUrl: string }).authorizationUrl,
    ).searchParams.get('state')!;
    const response = await callback(await providerCallback(state, 'link'), [
      cookie(started, 'orderly_customer_oauth'),
      ...cookies,
    ]).expect(303);
    expect(response.headers.location).toBe(
      'http://localhost:3000/account?google=conflict',
    );
    expect(
      (await prisma.customerUser.findUniqueOrThrow({ where: { email } }))
        .googleSubject,
    ).toBeNull();
    expect(await prisma.customerUser.count()).toBe(2);
  });

  it('rejects a linking transaction without its initiating session', async () => {
    const started = await start();
    await prisma.customerOAuthTransaction.updateMany({
      data: { purpose: 'CONNECT_GOOGLE' },
    });
    const response = await callback(
      await providerCallback(started.state, 'new'),
      [started.binding],
    ).expect(303);
    expect(response.headers.location).toBe(
      'http://localhost:3000/account?google=failed',
    );
    expect(await prisma.customerUser.count()).toBe(0);
  });

  it('does not replace a different Google subject connected during OAuth', async () => {
    const registered = await register();
    const cookies = [
      cookie(registered, 'orderly_customer_access'),
      cookie(registered, 'orderly_customer_refresh'),
    ];
    const started = await mutation(
      'google/connect',
      { password },
      cookies,
    ).expect(200);
    const state = new URL(
      (started.body as { authorizationUrl: string }).authorizationUrl,
    ).searchParams.get('state')!;
    await prisma.customerUser.update({
      where: { email },
      data: { googleSubject: 'different-google-subject' },
    });
    const response = await callback(await providerCallback(state, 'link'), [
      cookie(started, 'orderly_customer_oauth'),
      ...cookies,
    ]).expect(303);
    expect(response.headers.location).toBe(
      'http://localhost:3000/account?google=conflict',
    );
    expect(
      (await prisma.customerUser.findUniqueOrThrow({ where: { email } }))
        .googleSubject,
    ).toBe('different-google-subject');
  });
  it('allows only one simultaneous Google connection for a customer', async () => {
    const registered = await register();
    const cookies = [
      cookie(registered, 'orderly_customer_access'),
      cookie(registered, 'orderly_customer_refresh'),
    ];
    const first = await mutation(
      'google/connect',
      { password },
      cookies,
    ).expect(200);
    const second = await mutation(
      'google/connect',
      { password },
      cookies,
    ).expect(200);
    const state = (response: request.Response) =>
      new URL(
        (response.body as { authorizationUrl: string }).authorizationUrl,
      ).searchParams.get('state')!;
    const firstUrl = await providerCallback(state(first), 'link');
    const secondUrl = await providerCallback(state(second), 'conflict');
    const results = await Promise.all([
      callback(firstUrl, [cookie(first, 'orderly_customer_oauth'), ...cookies]),
      callback(secondUrl, [
        cookie(second, 'orderly_customer_oauth'),
        ...cookies,
      ]),
    ]);
    expect(results.map((result) => result.status)).toEqual([303, 303]);
    expect(results.map((result) => result.headers.location).sort()).toEqual([
      'http://localhost:3000/account?google=conflict',
      'http://localhost:3000/account?google=connected&orderlyOAuth=complete',
    ]);
    expect(await prisma.customerUser.count()).toBe(1);
    expect(
      (await prisma.customerUser.findUniqueOrThrow({ where: { email } }))
        .googleSubject,
    ).toMatch(/^google-browser-(link|conflict)$/);
  });
});
