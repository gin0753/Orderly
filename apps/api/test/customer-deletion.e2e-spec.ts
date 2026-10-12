import { OrdersService } from '../src/modules/orders/orders.service';
import { OrderAction } from '../src/modules/orders/order-action';
import type { INestApplication } from '@nestjs/common';
import type { Server } from 'node:http';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { CustomerAuthService } from '../src/modules/customer-auth/customer-auth.service';
import {
  CustomerDeletionService,
  deletionDigest,
  DELETION_COOKIES,
} from '../src/modules/customer-auth/customer-deletion.service';
import { createTestApp } from './support/create-test-app';
import { verifiedCustomer } from './support/verified-customer';

const password = 'Deletion test password 123!';
function cookies(response: request.Response): string[] {
  return ((response.headers['set-cookie'] ?? []) as unknown as string[]).map(
    (entry) => entry.split(';')[0],
  );
}
function merge(...groups: string[][]) {
  const values = new Map<string, string>();
  for (const entry of groups.flat()) values.set(entry.split('=')[0], entry);
  return [...values.values()];
}

describe('Secure customer account deletion', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let server: Server;
  const post = (path: string, body: object, credentials: string[] = []) =>
    request(server)
      .post(`/api/${path}`)
      .set('Origin', 'http://localhost:3000')
      .set('X-Orderly-Client', 'customer-web')
      .set('Cookie', credentials)
      .send(body);
  const remove = (
    credentials: string[],
    body: object = { confirmation: 'DELETE', currentPassword: password },
  ) => post('customer/account/delete', body, credentials);
  beforeAll(async () => {
    app = await createTestApp({ bypassThrottling: true });
    prisma = app.get(PrismaService);
    server = app.getHttpServer() as Server;
  });
  afterAll(async () => app.close());
  beforeEach(async () => {
    await prisma.order.deleteMany();
    await prisma.customerUser.deleteMany();
    await prisma.customerPendingRegistration.deleteMany();
    await prisma.customerDeletedGoogleSubject.deleteMany();
  });
  afterEach(() => jest.restoreAllMocks());

  async function passwordAccount(email = 'deletion@example.test') {
    const response = await verifiedCustomer(app, {
      email,
      name: 'Delete Owner',
      password,
    });
    const user = await prisma.customerUser.findUniqueOrThrow({
      where: { email },
    });
    return { user, credentials: cookies(response) };
  }
  async function googleAccount() {
    const auth = app.get<CustomerAuthService>(CustomerAuthService);
    const result = await auth.signInWithGoogle({
      subject: 'google-browser-new',
      email: 'google.browser@example.com',
      name: 'Google Owner',
    });
    return {
      id: result.user.id,
      credentials: [
        `orderly_customer_access=${result.accessToken}`,
        `orderly_customer_refresh=${result.refreshToken}`,
      ],
    };
  }
  async function proof(
    credentials: string[],
    choice = 'delete-fresh',
    callbackCredentials = credentials,
  ) {
    const start = await post(
      'customer/auth/google/delete-account',
      {},
      credentials,
    ).expect(200);
    const state = new URL(
      (start.body as { authorizationUrl: string }).authorizationUrl,
    ).searchParams.get('state')!;
    const provider = await request(server)
      .get(
        `/api/customer/auth/google/test-provider/authorize?state=${encodeURIComponent(state)}&identity=${choice}`,
      )
      .expect(303);
    const url = new URL(provider.headers.location);
    const callback = await request(server)
      .get(url.pathname + url.search)
      .set('Cookie', merge(callbackCredentials, cookies(start)))
      .expect(303);
    return {
      callback,
      credentials: merge(credentials, cookies(start), cookies(callback)),
    };
  }
  async function order(
    owner: string | null,
    status:
      | 'PENDING'
      | 'ACCEPTED'
      | 'PREPARING'
      | 'READY'
      | 'COMPLETED'
      | 'CANCELLED' = 'COMPLETED',
  ) {
    return prisma.order.create({
      data: {
        orderNumber: 'D' + randomUUID().replaceAll('-', '').slice(0, 20),
        customerUserId: owner,
        orderType: 'DELIVERY',
        status,
        paymentStatus: 'PAID',
        customerName: 'Order Contact',
        customerPhone: '0400000000',
        customerEmail: 'deletion@example.test',
        addressLine1: 'Synthetic Road',
        addressLine2: 'Unit 1',
        city: 'Synthetic',
        state: 'NSW',
        postcode: '2000',
        notes: 'Synthetic personal note',
        subtotalCents: 1234,
        deliveryFeeCents: 200,
        serviceFeeCents: 120,
        totalCents: 1554,
        receiptCapabilityHash: deletionDigest('r'.repeat(43)),
        receiptCapabilityExpiresAt: new Date(Date.now() + 60_000),
        items: {
          create: {
            productNameSnapshot: 'Historical Pizza',
            quantity: 2,
            unitPriceCents: 617,
            lineTotalCents: 1234,
          },
        },
      },
    });
  }

  it('deletes password credentials/all devices while retaining financial records and isolating guest/Admin data', async () => {
    const { user, credentials } = await passwordAccount();
    const peer = cookies(
      await post('customer/auth/login', { email: user.email, password }).expect(
        200,
      ),
    );
    const owned = await order(user.id);
    const guest = await order(null);
    const other = await passwordAccount('other-deletion@example.test');
    const otherOrder = await order(other.user.id);
    const admin = await prisma.adminUser.create({
      data: { email: user.email, passwordHash: 'synthetic-admin-hash' },
    });
    const adminSession = await prisma.adminSession.create({
      data: {
        adminUserId: admin.id,
        refreshTokenHash: 'synthetic',
        expiresAt: new Date(Date.now() + 60_000),
      },
    });
    const response = await remove(credentials, {
      confirmation: 'DELETE',
      currentPassword: password,
      savedReceiptNumber: owned.orderNumber,
    }).expect(200);
    expect(response.body).toEqual({ clearSavedReceipt: true });
    expect(
      await prisma.customerUser.findUnique({ where: { id: user.id } }),
    ).toBeNull();
    expect(
      await prisma.customerSession.count({
        where: { customerUserId: user.id },
      }),
    ).toBe(0);
    const retained = await prisma.order.findUniqueOrThrow({
      where: { id: owned.id },
      include: { items: true },
    });
    expect(retained).toMatchObject({
      customerUserId: null,
      customerName: 'Deleted customer',
      customerEmail: '',
      customerPhone: '',
      addressLine1: null,
      addressLine2: null,
      city: null,
      state: null,
      postcode: null,
      notes: null,
      receiptCapabilityHash: null,
      totalCents: 1554,
      subtotalCents: 1234,
      status: 'COMPLETED',
      paymentStatus: 'PAID',
      orderNumber: owned.orderNumber,
      createdAt: owned.createdAt,
    });
    expect(retained.items[0]).toMatchObject({
      productNameSnapshot: 'Historical Pizza',
      quantity: 2,
      unitPriceCents: 617,
      lineTotalCents: 1234,
    });
    expect(await prisma.order.findUnique({ where: { id: guest.id } })).toEqual(
      guest,
    );
    expect(
      await prisma.order.findUnique({ where: { id: otherOrder.id } }),
    ).toEqual(otherOrder);
    expect(
      await prisma.adminSession.findUnique({ where: { id: adminSession.id } }),
    ).not.toBeNull();
    for (const session of [credentials, peer]) {
      await request(server)
        .get('/api/customer/auth/me')
        .set('Cookie', session)
        .expect(401);
      await post('customer/auth/refresh', {}, session).expect(401);
    }
    await remove(credentials).expect(401);
    await post('orders/guest/lookup', {
      orderNumber: owned.orderNumber,
      receiptCode: 'r'.repeat(43),
    }).expect(404);
    await post('orders/guest/lookup', {
      orderNumber: guest.orderNumber,
      receiptCode: 'r'.repeat(43),
    }).expect(201);
    await prisma.adminUser.delete({ where: { id: admin.id } });
  });

  it.each(['PENDING', 'ACCEPTED', 'PREPARING', 'READY'] as const)(
    'blocks deletion for %s with no mutation',
    async (status) => {
      const { user, credentials } = await passwordAccount();
      const active = await order(user.id, status);
      await remove(credentials).expect(409);
      expect(
        await prisma.customerUser.findUnique({ where: { id: user.id } }),
      ).toEqual(user);
      expect(
        await prisma.order.findUnique({ where: { id: active.id } }),
      ).toEqual(active);
    },
  );
  it('requires backend password, explicit confirmation, valid customer authorization and CSRF protection', async () => {
    const { user, credentials } = await passwordAccount();
    await remove(credentials, {
      confirmation: 'DELETE',
      currentPassword: 'wrong',
    }).expect(401);
    await remove(credentials, { confirmation: 'DELETE' }).expect(401);
    await remove(credentials, {
      confirmation: 'no',
      currentPassword: password,
    }).expect(400);
    await remove(credentials, {
      confirmation: 'DELETE',
      currentPassword: password,
      customerId: user.id,
    }).expect(400);
    await remove(credentials)
      .set('Origin', 'https://attacker.test')
      .expect(403);
    await remove([]).expect(401);
    expect(await prisma.customerUser.count()).toBe(1);
  });
  it('allows linked accounts to delete only with their current password and isolates another owner', async () => {
    const { user, credentials } = await passwordAccount();
    await prisma.customerUser.update({
      where: { id: user.id },
      data: { googleSubject: 'linked-delete-subject' },
    });
    await post('customer/auth/google/delete-account', {}, credentials).expect(
      401,
    );
    const other = await passwordAccount('other-deletion@example.test');
    await remove(other.credentials, {
      confirmation: 'DELETE',
      currentPassword: 'wrong',
    }).expect(401);
    await remove(credentials).expect(200);
    expect(
      await prisma.customerUser.findUnique({ where: { id: other.user.id } }),
    ).not.toBeNull();
  });

  it('reauthenticates Google-only deletion without ordinary login side effects; grants are digest-only and one-use', async () => {
    const google = await googleAccount();
    const before = await prisma.customerSession.count();
    const verified = await proof(google.credentials);
    expect(verified.callback.headers.location).toContain('deletion=verified');
    expect(await prisma.customerSession.count()).toBe(before);
    expect(await prisma.customerUser.count()).toBe(1);
    const grant = await prisma.customerDeletionGrant.findFirstOrThrow();
    const raw = verified.credentials
      .find((entry) => entry.startsWith(DELETION_COOKIES.grant + '='))!
      .split('=')[1];
    expect(grant.secretHash === deletionDigest(raw)).toBe(true);
    expect(grant).toMatchObject({
      purpose: 'DELETE_ACCOUNT',
      customerUserId: google.id,
    });
    const missingBinding = verified.credentials.filter(
      (entry) => !entry.startsWith(DELETION_COOKIES.browser + '='),
    );
    await remove(missingBinding, { confirmation: 'DELETE' }).expect(401);
    const results = await Promise.all([
      remove(verified.credentials, { confirmation: 'DELETE' }),
      remove(verified.credentials, { confirmation: 'DELETE' }),
    ]);
    expect(results.map((response) => response.status).sort()).toEqual([
      200, 401,
    ]);
    expect(await prisma.customerDeletionGrant.count()).toBe(0);
    await remove(verified.credentials, { confirmation: 'DELETE' }).expect(401);
  });
  it.each(['delete-wrong', 'delete-stale', 'delete-silent'])(
    'rejects %s provider evidence and creates no grant',
    async (choice) => {
      const google = await googleAccount();
      const verified = await proof(google.credentials, choice);
      expect(verified.callback.headers.location).toContain('deletion=failed');
      expect(await prisma.customerDeletionGrant.count()).toBe(0);
      await remove(verified.credentials, { confirmation: 'DELETE' }).expect(
        401,
      );
      expect(await prisma.customerUser.count()).toBe(1);
    },
  );
  it('does not transfer proof across sessions/accounts, and logout/password change revoke it', async () => {
    const google = await googleAccount();
    const verified = await proof(google.credentials);
    const otherSession = await app
      .get<CustomerAuthService>(CustomerAuthService)
      .signInWithGoogle({
        subject: 'google-browser-new',
        email: 'google.browser@example.com',
        name: null,
      });
    const another = [
      `orderly_customer_access=${otherSession.accessToken}`,
      `orderly_customer_refresh=${otherSession.refreshToken}`,
    ];
    await remove(
      merge(
        verified.credentials.filter(
          (entry) =>
            !entry.startsWith('orderly_customer_access=') &&
            !entry.startsWith('orderly_customer_refresh='),
        ),
        another,
      ),
      { confirmation: 'DELETE' },
    ).expect(401);
    const other = await passwordAccount('other-deletion@example.test');
    await remove(
      merge(
        verified.credentials.filter((entry) =>
          entry.startsWith('orderly_customer_delete'),
        ),
        other.credentials,
      ),
      { confirmation: 'DELETE' },
    ).expect(401);
    await post('customer/auth/logout', {}, verified.credentials).expect(204);
    expect(await prisma.customerDeletionGrant.count()).toBe(0);
    const credential = await passwordAccount('password-change@example.test');
    const session = await prisma.customerSession.findFirstOrThrow({
      where: { customerUserId: credential.user.id },
    });
    await prisma.customerDeletionGrant.create({
      data: {
        customerUserId: credential.user.id,
        customerSessionId: session.id,
        googleSubject: 'fixture',
        purpose: 'DELETE_ACCOUNT',
        secretHash: deletionDigest('g'.repeat(43)),
        browserBindingHash: deletionDigest('b'.repeat(43)),
        expiresAt: new Date(Date.now() + 60_000),
      },
    });
    await post(
      'customer/account/password',
      { currentPassword: password, newPassword: 'New deletion password 456!' },
      credential.credentials,
    ).expect(200);
    expect(await prisma.customerDeletionGrant.count()).toBe(0);
  });
  it('rejects a changed session at the Google callback', async () => {
    const google = await googleAccount();
    const other = await app
      .get<CustomerAuthService>(CustomerAuthService)
      .signInWithGoogle({
        subject: 'google-browser-new',
        email: 'google.browser@example.com',
        name: null,
      });
    const changed = [
      `orderly_customer_access=${other.accessToken}`,
      `orderly_customer_refresh=${other.refreshToken}`,
    ];
    const result = await proof(google.credentials, 'delete-fresh', changed);
    expect(result.callback.headers.location).toContain('deletion=failed');
    expect(await prisma.customerDeletionGrant.count()).toBe(0);
  });

  it('cannot resurrect the identity when an old Google sign-in races deletion', async () => {
    const google = await googleAccount();
    const verified = await proof(google.credentials);
    const startedAt = new Date(Date.now() - 1000);
    const results = await Promise.all([
      remove(verified.credentials, { confirmation: 'DELETE' }),
      app
        .get<CustomerAuthService>(CustomerAuthService)
        .signInWithGoogle(
          {
            subject: 'google-browser-new',
            email: 'google.browser@example.com',
            name: null,
          },
          startedAt,
        )
        .then(
          () => true,
          () => false,
        ),
    ]);
    expect(results[0].status).toBe(200);
    expect(await prisma.customerUser.count()).toBe(0);
    expect(await prisma.customerSession.count()).toBe(0);
  });

  it('rechecks locked order status against a racing completion', async () => {
    const owner = await passwordAccount();
    const active = await order(owner.user.id, 'READY');
    const results = await Promise.all([
      remove(owner.credentials),
      app
        .get<OrdersService>(OrdersService)
        .performAction(active.id, { action: OrderAction.COMPLETE }),
    ]);
    expect([200, 409]).toContain(results[0].status);
    const retained = await prisma.order.findUniqueOrThrow({
      where: { id: active.id },
    });
    expect(retained.status).toBe('COMPLETED');
    expect(retained.customerUserId).toBe(
      results[0].status === 200 ? null : owner.user.id,
    );
  });

  it('rejects expired grants and rolls back grant consumption/erasure on active orders or DB failure', async () => {
    const google = await googleAccount();
    const verified = await proof(google.credentials);
    const active = await order(google.id, 'PENDING');
    await remove(verified.credentials, { confirmation: 'DELETE' }).expect(409);
    expect(await prisma.customerDeletionGrant.count()).toBe(1);
    await prisma.order.update({
      where: { id: active.id },
      data: { status: 'COMPLETED' },
    });
    await prisma.$executeRawUnsafe(
      "CREATE FUNCTION security2b_rollback_failure() RETURNS trigger LANGUAGE plpgsql AS $body$ BEGIN RAISE EXCEPTION 'Synthetic deletion rollback'; END; $body$",
    );
    await prisma.$executeRawUnsafe(
      'CREATE TRIGGER security2b_rollback BEFORE DELETE ON "CustomerUser" FOR EACH ROW EXECUTE FUNCTION security2b_rollback_failure()',
    );

    let failure = false;
    try {
      failure = await app
        .get<CustomerDeletionService>(CustomerDeletionService)
        .delete(
          google.id,
          (await prisma.customerSession.findFirstOrThrow()).id,
          undefined,
          verified.credentials
            .find((entry) => entry.startsWith(DELETION_COOKIES.grant + '='))!
            .split('=')[1],
          verified.credentials
            .find((entry) => entry.startsWith(DELETION_COOKIES.browser + '='))!
            .split('=')[1],
        )
        .then(
          () => false,
          () => true,
        );
    } finally {
      await prisma.$executeRawUnsafe(
        'DROP TRIGGER security2b_rollback ON "CustomerUser"',
      );
      await prisma.$executeRawUnsafe(
        'DROP FUNCTION security2b_rollback_failure()',
      );
    }
    expect(failure).toBe(true);
    expect(await prisma.customerDeletionGrant.count()).toBe(1);
    expect(
      (await prisma.order.findUniqueOrThrow({ where: { id: active.id } }))
        .customerUserId,
    ).toBe(google.id);
    expect(await prisma.customerSession.count()).toBe(1);
    await prisma.customerDeletionGrant.updateMany({
      data: { expiresAt: new Date(0) },
    });
    await remove(verified.credentials, { confirmation: 'DELETE' }).expect(401);
    const fresh = await proof(google.credentials);
    await remove(fresh.credentials, { confirmation: 'DELETE' }).expect(200);
  });
  it('serializes deletion with refresh and preserves revocation even if a response arrives late', async () => {
    const { user, credentials } = await passwordAccount();
    const results = await Promise.all([
      remove(credentials),
      post('customer/auth/refresh', {}, credentials),
    ]);
    expect(results[0].status).toBe(200);
    expect([200, 401]).toContain(results[1].status);
    expect(
      await prisma.customerSession.count({
        where: { customerUserId: user.id },
      }),
    ).toBe(0);
    await request(server)
      .get('/api/customer/auth/me')
      .set('Cookie', merge(credentials, cookies(results[1])))
      .expect(401);
  });
  it.each(['password deletion', 'Google linking'] as const)(
    'rejects %s when concurrent session revocation commits first',
    async (operation) => {
      const { user } = await passwordAccount();
      const session = await prisma.customerSession.findFirstOrThrow({
        where: { customerUserId: user.id },
      });
      let outcome!: Promise<boolean>;
      await prisma.$transaction(async (tx) => {
        // Hold an uncommitted revocation. An unlocked MVCC read still sees the old row.
        await tx.customerSession.delete({ where: { id: session.id } });
        const action =
          operation === 'password deletion'
            ? app
                .get(CustomerDeletionService)
                .delete(user.id, session.id, password)
            : app.get(CustomerAuthService).connectGoogle(session.id, {
                subject: 'revoked-concurrent-link',
                email: user.email,
              });
        outcome = action.then(
          () => true,
          () => false,
        );
        const deadline = Date.now() + 3000;
        let blocked = false;
        while (Date.now() < deadline) {
          await tx.$queryRaw`SELECT 1 FROM pg_stat_clear_snapshot()`;
          const rows = await tx.$queryRaw<{ blocked: boolean }[]>`
          SELECT EXISTS (
            SELECT 1 FROM pg_stat_activity
            WHERE datname = current_database() AND pid <> pg_backend_pid()
              AND wait_event_type = 'Lock' AND state = 'active'
          ) AS blocked`;
          if (rows[0]?.blocked) {
            blocked = true;
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 20));
        }
        expect(blocked).toBe(true);
        // Commit revocation before the blocked deletion can proceed.
      });
      expect(await outcome).toBe(false);
      expect(await prisma.customerUser.count({ where: { id: user.id } })).toBe(
        1,
      );
      expect(
        await prisma.customerSession.count({ where: { id: session.id } }),
      ).toBe(0);
      expect(
        (
          await prisma.customerUser.findUniqueOrThrow({
            where: { id: user.id },
          })
        ).googleSubject,
      ).toBeNull();
    },
  );
  it('serializes an authenticated new order with deletion without guest fallback', async () => {
    const { user, credentials } = await passwordAccount();
    await prisma.storeSettings.upsert({
      where: { id: 'default' },
      create: { id: 'default' },
      update: {
        isAcceptingOrders: true,
        pickupEnabled: true,
        minimumOrderAmount: 0,
      },
    });
    const category = await prisma.category.create({
      data: {
        name: 'Deletion Fixture',
        slug: randomUUID(),
        products: { create: { name: 'Deletion Pizza', basePrice: 14 } },
      },
      include: { products: true },
    });
    const results = await Promise.all([
      remove(credentials),
      post(
        'orders',
        {
          fulfillmentType: 'PICKUP',
          customer: {
            name: 'Order',
            email: 'order@deletion.test',
            phone: '0400000000',
          },
          items: [
            {
              productId: category.products[0].id,
              quantity: 1,
              selectedOptionIds: [],
            },
          ],
        },
        credentials,
      ),
    ]);
    if (results[0].status === 200) {
      expect(results[1].status).toBe(401);
      expect(await prisma.order.count()).toBe(0);
    } else {
      expect(results[0].status).toBe(409);
      expect(results[1].status).toBe(201);
      expect(
        await prisma.order.count({ where: { customerUserId: user.id } }),
      ).toBe(1);
    }
  });
  it('email/Google subject reuse creates new UUIDs with no historic recovery; rejects stale sign-in callbacks', async () => {
    const old = await passwordAccount();
    const historical = await order(old.user.id);
    await prisma.customerPendingRegistration.update({
      where: { email: old.user.email },
      data: {
        tokenHash: deletionDigest('v'.repeat(43)),
        expiresAt: new Date(Date.now() + 60_000),
      },
    });
    await remove(old.credentials).expect(200);
    await post('customer/auth/registration/complete', {
      token: 'v'.repeat(43),
      password,
      name: 'Old verification',
    }).expect(400);
    const fresh = await passwordAccount();
    expect(fresh.user.id).not.toBe(old.user.id);
    expect(
      (await prisma.order.findUniqueOrThrow({ where: { id: historical.id } }))
        .customerUserId,
    ).toBeNull();
    const google = await googleAccount();
    const beforeDelete = new Date(Date.now() - 1000);
    const verified = await proof(google.credentials);
    await remove(verified.credentials, { confirmation: 'DELETE' }).expect(200);
    const auth = app.get<CustomerAuthService>(CustomerAuthService);
    const rejected = await auth
      .signInWithGoogle(
        {
          subject: 'google-browser-new',
          email: 'google.browser@example.com',
          name: null,
        },
        beforeDelete,
      )
      .then(
        () => false,
        () => true,
      );
    expect(rejected).toBe(true);
    const newGoogle = await auth.signInWithGoogle(
      {
        subject: 'google-browser-new',
        email: 'google.browser@example.com',
        name: null,
      },
      new Date(Date.now() + 1),
    );
    expect(newGoogle.user.id).not.toBe(google.id);
  });
});

describe('Deletion real HTTP rate limits', () => {
  let app: INestApplication;
  let credentials: string[];
  beforeAll(async () => {
    app = await createTestApp();
    credentials = cookies(
      await verifiedCustomer(app, {
        email: 'quota-deletion@example.test',
        name: 'Quota',
        password,
      }),
    );
  });
  afterAll(async () => {
    await app.get<PrismaService>(PrismaService).customerUser.deleteMany({
      where: { email: 'quota-deletion@example.test' },
    });
    await app.close();
  });
  it.each(['customer/account/delete', 'customer/auth/google/delete-account'])(
    'limits %s without bypassing guards',
    async (path) => {
      for (let i = 0; i < 6; i++) {
        await request(app.getHttpServer() as Server)
          .post('/api/' + path)
          .set('Origin', 'http://localhost:3000')
          .set('X-Orderly-Client', 'customer-web')
          .set('Cookie', credentials)
          .send({ confirmation: 'DELETE', currentPassword: 'wrong' })
          .expect(i < 5 ? 401 : 429);
      }
    },
  );
});
