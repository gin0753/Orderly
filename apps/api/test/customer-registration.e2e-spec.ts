import { CustomerAuthService } from '../src/modules/customer-auth/customer-auth.service';
import { CustomerRegistrationService } from '../src/modules/customer-auth/customer-registration.service';
import type { INestApplication } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { Server } from 'node:http';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { createTestApp } from './support/create-test-app';
import { PrismaService } from '../src/prisma/prisma.service';
import { RegistrationMailer } from '../src/modules/customer-auth/registration-mailer';
import { registrationDigest } from '../src/modules/customer-auth/customer-registration.service';

describe('Email ownership registration', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let server: Server;
  let send: jest.SpyInstance<Promise<void>, [string, string]>;
  const email = 'owner@verification.example.test';
  const attackerPassword = 'Attacker chosen password 123';
  const password = 'Mailbox owner password 456';
  let delivered: string[];
  const post = (path: string, body: object) =>
    request(server)
      .post(`/api/customer/auth/${path}`)
      .set('Origin', 'http://localhost:3000')
      .set('X-Orderly-Client', 'customer-web')
      .send(body);
  const start = () =>
    post('register', {
      email,
      name: 'Untrusted initial name',
      password: attackerPassword,
    });
  const complete = (token: string) =>
    post('registration/complete', { token, password, name: 'Mailbox Owner' });
  const token = () =>
    new URLSearchParams(
      new URL(delivered[delivered.length - 1]).hash.slice(1),
    ).get('token')!;
  const releaseCooldown = () =>
    prisma.customerPendingRegistration.updateMany({
      data: { lastSentAt: new Date(Date.now() - 61_000) },
    });

  beforeAll(async () => {
    app = await createTestApp({ bypassThrottling: true });
    prisma = app.get(PrismaService);
    server = app.getHttpServer() as Server;
  });
  afterAll(async () => {
    await app.close();
  });
  beforeEach(async () => {
    await prisma.order.deleteMany();
    await prisma.customerUser.deleteMany();
    await prisma.customerPendingRegistration.deleteMany();
    delivered = [];
    send = jest
      .spyOn(app.get(RegistrationMailer), 'send')
      .mockImplementation((_email, link) => {
        delivered.push(link);
        return Promise.resolve();
      });
  });
  afterEach(() => jest.restoreAllMocks());

  it('creates only a hashed pending record, then establishes the owner-chosen password and session', async () => {
    const response = await start().expect(201);
    expect(response.body).toEqual({ status: 'pending', retryAfterSeconds: 60 });
    expect(response.headers['set-cookie']).toBeUndefined();
    expect(await prisma.customerUser.count()).toBe(0);
    expect(await prisma.customerSession.count()).toBe(0);
    const secret = token();
    expect(new URL(delivered[0]).origin).toBe('http://localhost:3000');
    expect(new URL(delivered[0]).search).toBe('');
    expect(
      await prisma.customerPendingRegistration.findUniqueOrThrow({
        where: { email },
      }),
    ).toMatchObject({ tokenHash: registrationDigest(secret) });
    await post('login', { email, password: attackerPassword }).expect(401);
    await post('registration/check', { token: secret }).expect(200);
    await post('registration/check', { token: secret }).expect(200); // GET/scanner/refresh equivalent does not consume.
    expect(await prisma.customerUser.count()).toBe(0);
    const activated = await complete(secret).expect(200);
    const user = await prisma.customerUser.findUniqueOrThrow({
      where: { email },
    });
    expect(user.emailVerifiedAt).toBeInstanceOf(Date);
    expect(user.name).toBe('Mailbox Owner');
    expect(await bcrypt.compare(password, user.passwordHash!)).toBe(true);
    expect(await bcrypt.compare(attackerPassword, user.passwordHash!)).toBe(
      false,
    );
    expect(JSON.stringify(activated.body)).not.toMatch(
      /passwordHash|tokenHash|googleSubject/,
    );
    const cookies = activated.headers['set-cookie'] as unknown as string[];
    await request(server)
      .get('/api/customer/auth/me')
      .set(
        'Cookie',
        cookies.map((item) => item.split(';')[0]),
      )
      .expect(200);
    await post('login', { email, password }).expect(200);
    await complete(secret).expect(400);
    await post('registration/check', { token: secret }).expect(400);
  });

  it('rejects invalid, expired and concurrent replayed tokens with one activation winner', async () => {
    await complete('x'.repeat(43)).expect(400);
    await start();
    const secret = token();
    await prisma.customerPendingRegistration.updateMany({
      data: { expiresAt: new Date(0) },
    });
    await complete(secret).expect(400);
    await releaseCooldown();
    await start();
    const fresh = token();
    const results = await Promise.all([complete(fresh), complete(fresh)]);
    expect(results.map((item) => item.status).sort()).toEqual([200, 400]);
    expect(await prisma.customerUser.count()).toBe(1);
    expect(await prisma.customerSession.count()).toBe(1);
  });

  it('limits duplicate/concurrent requests, rotates on resend and enforces the durable hourly quota', async () => {
    const results = await Promise.all([start(), start()]);
    expect(results.map((item) => item.status)).toEqual([201, 201]);
    expect(send).toHaveBeenCalledTimes(1);
    const first = token();
    await post('registration/resend', { email }).expect(200);
    expect(send).toHaveBeenCalledTimes(1);
    for (let i = 0; i < 4; i++) {
      await releaseCooldown();
      await post('registration/resend', { email }).expect(200);
    }
    expect(send).toHaveBeenCalledTimes(5);
    await complete(first).expect(400);
    await releaseCooldown();
    await post('registration/resend', { email }).expect(200);
    expect(send).toHaveBeenCalledTimes(5);
    expect(await prisma.customerUser.count()).toBe(0);
  });

  it('revokes failed-delivery links, keeps cooldown and recovers with a fresh email', async () => {
    send.mockImplementationOnce((_email, link) => {
      delivered.push(link);
      return Promise.reject(new Error('Synthetic failure'));
    });
    const failed = await start().expect(201);
    const failedToken = token();
    expect(failed.body).toEqual({
      status: 'delivery_failed',
      retryAfterSeconds: 60,
    });
    await complete(failedToken).expect(400);
    await start();
    expect(send).toHaveBeenCalledTimes(1);
    await releaseCooldown();
    await start();
    await complete(token()).expect(200);
  });

  it('keeps existing unverified credentials and sessions; cannot reclaim or merge by mailbox', async () => {
    const user = await prisma.customerUser.create({
      data: {
        email,
        name: 'Legacy',
        passwordHash: await bcrypt.hash(attackerPassword, 12),
      },
    });
    const login = await post('login', {
      email,
      password: attackerPassword,
    }).expect(200);
    expect(user.emailVerifiedAt).toBeNull();
    await start().expect(201);
    await complete(token()).expect(400);
    expect(
      await prisma.customerUser.findUniqueOrThrow({ where: { id: user.id } }),
    ).toEqual(user);
    const cookies = login.headers['set-cookie'] as unknown as string[];
    await post('refresh', {})
      .set(
        'Cookie',
        cookies.map((item) => item.split(';')[0]),
      )
      .expect(200);
  });

  it('pending addresses do not block Google; subject identity and email conflicts remain protected', async () => {
    await start();
    const auth = app.get(CustomerAuthService);
    const google = await auth.signInWithGoogle({
      subject: 'verification-google-subject',
      email,
      name: 'Google',
    });
    await complete(token()).expect(400);
    const again = await auth.signInWithGoogle({
      subject: 'verification-google-subject',
      email: 'changed@provider.test',
      name: 'Changed',
    });
    expect(again.user.id).toBe(google.user.id);
    await expect(
      auth.signInWithGoogle({ subject: 'other-subject', email, name: null }),
    ).rejects.toThrow();
  });

  it('arbitrates simultaneous Google and password activation without duplicate identities or merging', async () => {
    await start();
    const results = await Promise.allSettled([
      app
        .get(CustomerRegistrationService)
        .complete({ token: token(), password, name: 'Owner' }),
      app.get(CustomerAuthService).signInWithGoogle({
        subject: 'racing-google-subject',
        email,
        name: 'Google',
      }),
    ]);
    expect(results.map((result) => result.status).sort()).toEqual([
      'fulfilled',
      'rejected',
    ]);
    const users = await prisma.customerUser.findMany({ where: { email } });
    expect(users).toHaveLength(1);
    expect(
      Boolean(users[0].passwordHash) !== Boolean(users[0].googleSubject),
    ).toBe(true);
    expect(await prisma.customerSession.count()).toBe(1);
  });

  it('never claims historical guest or other-owner orders just because email matches', async () => {
    const other = await prisma.customerUser.create({
      data: { email: 'other@verification.test', googleSubject: randomUUID() },
    });
    const orders = await Promise.all(
      [null, other.id].map((owner) =>
        prisma.order.create({
          data: {
            orderNumber: randomUUID(),
            customerUserId: owner,
            orderType: 'PICKUP',
            customerEmail: email,
            customerName: 'Historical',
            customerPhone: '0400000000',
            subtotalCents: 1000,
            totalCents: 1000,
          },
        }),
      ),
    );
    await start();
    const response = await complete(token()).expect(200);
    const cookies = response.headers['set-cookie'] as unknown as string[];
    const header = cookies.map((item) => item.split(';')[0]);
    const history = await request(server)
      .get('/api/customer/orders')
      .set('Cookie', header)
      .expect(200);
    expect((history.body as { data: unknown[] }).data).toEqual([]);
    for (const order of orders)
      await request(server)
        .get(`/api/customer/orders/${order.id}`)
        .set('Cookie', header)
        .expect(404);
    expect(
      (await prisma.order.findUniqueOrThrow({ where: { id: orders[0].id } }))
        .customerUserId,
    ).toBeNull();
  });

  it('releases expired pending records without creating durable identities', async () => {
    await start();
    await prisma.customerPendingRegistration.updateMany({
      data: { expiresAt: new Date(0), windowStartedAt: new Date(0) },
    });
    await start();
    expect(send).toHaveBeenCalledTimes(2);
    expect(await prisma.customerUser.count()).toBe(0);
  });

  it('validates owner credentials and rejects injected identity before activation', async () => {
    await start();
    for (const patch of [
      { password: 'short' },
      { password: '😀'.repeat(19) },
      { name: '  ' },
      { email: 'injected@example.test' },
    ]) {
      await post('registration/complete', {
        token: token(),
        password,
        name: 'Owner',
        ...patch,
      }).expect(400);
    }
    expect(await prisma.customerUser.count()).toBe(0);
    await complete(token()).expect(200);
  });

  it('rolls back consumption and identity if session establishment fails', async () => {
    await start();
    const auth = app.get<CustomerAuthService>(CustomerAuthService);
    const original = auth.activateRegistration.bind(
      auth,
    ) as CustomerAuthService['activateRegistration'];
    const activation = jest
      .spyOn(auth, 'activateRegistration')
      .mockImplementationOnce(async (...args) => {
        await original(...args);
        throw new Error('Synthetic post-session failure');
      });
    const failed = await app
      .get<CustomerRegistrationService>(CustomerRegistrationService)
      .complete({ token: token(), password, name: 'Owner' })
      .then(
        () => false,
        () => true,
      );
    expect(failed).toBe(true);
    expect(await prisma.customerUser.count()).toBe(0);
    expect(await prisma.customerSession.count()).toBe(0);
    activation.mockRestore();
    await complete(token()).expect(200);
  });

  it('protects verification mutation endpoints against foreign origins', async () => {
    await start();
    for (const path of [
      'registration/check',
      'registration/complete',
      'registration/resend',
    ]) {
      await post(path, { token: token(), password, name: 'Owner' })
        .set('Origin', 'https://attacker.test')
        .expect(403);
    }
  });
});
