import { verifiedCustomer } from './support/verified-customer';
/// <reference types="jest" />

import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomUUID } from 'node:crypto';
import {
  OptionGroupType,
  PrismaClient,
  ProductOptionGroupKind,
} from '@prisma/client';
import type { Server } from 'node:http';
import request from 'supertest';

import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './support/create-test-app';

type CreatedOrderBody = {
  receiptCode: string;
  receiptExpiresAt: string;
  orderId: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  orderType: string;
  totalCents: number;
};

type ErrorBody = { message: string };
type TrackingBody = {
  orderNumber: string;
  totalCents: number;
};

describe('Guest orders API (e2e)', () => {
  let app: INestApplication;
  let httpServer: Server;
  let prisma: PrismaClient;

  beforeAll(async () => {
    app = await createTestApp({ bypassThrottling: true });
    httpServer = app.getHttpServer() as Server;
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await clearOrderFixtures(prisma);
    await prisma.customerSession.deleteMany();
    await prisma.customerUser.deleteMany();
  });

  async function passwordCustomer(email = 'owner@example.test') {
    const response = await verifiedCustomer(app, {
      email,
      name: 'Order Owner',
      password: 'An owner password 123!',
    });
    const setCookies = response.headers['set-cookie'] as unknown as string[];
    const access = setCookies
      .find((value) => value.startsWith('orderly_customer_access='))!
      .split(';')[0];
    const refresh = setCookies
      .find((value) => value.startsWith('orderly_customer_refresh='))!
      .split(';')[0];
    return {
      id: (response.body as { user: { id: string } }).user.id,
      access,
      refresh,
    };
  }

  it('rejects missing contact data and blank required fields without persisting an order', async () => {
    const fixture = await createCheckoutFixture(prisma);
    const valid = createPickupRequest(fixture.productId, [
      fixture.smallOptionId,
    ]);
    const { customer: omitted, ...withoutCustomer } = valid;
    void omitted;
    const address = {
      addressLine1: '1 Test Street',
      city: 'Sydney',
      state: 'NSW',
      postcode: '2000',
    };
    const invalidRequests = [
      withoutCustomer,
      { ...valid, customer: null },
      { ...valid, customer: { ...valid.customer, name: '   ' } },
      ...Object.keys(address).map((field) => ({
        ...valid,
        fulfillmentType: 'DELIVERY',
        address: { ...address, [field]: '   ' },
      })),
    ];
    for (const body of invalidRequests) {
      await request(httpServer).post('/api/orders').send(body).expect(400);
    }
    expect(await prisma.order.count()).toBe(0);
  });

  it('creates and persists a guest delivery order using server prices and snapshots', async () => {
    const fixture = await createCheckoutFixture(prisma);

    const response = await request(httpServer)
      .post('/api/orders')
      .send({
        fulfillmentType: 'DELIVERY',
        customer: {
          name: '  Ada Lovelace  ',
          phone: '+61 (02) 5555 0100',
          email: 'ADA@Example.COM',
        },
        address: {
          addressLine1: ' 1 Test Street ',
          addressLine2: ' Unit 2 ',
          city: ' Sydney ',
          state: ' NSW ',
          postcode: ' 2000 ',
        },
        notes: '  Leave at reception.  ',
        items: [
          {
            productId: fixture.productId,
            quantity: 2,
            selectedOptionIds: [fixture.largeOptionId, fixture.cheeseOptionId],
          },
        ],
      })
      .expect(201);
    const responseBody = response.body as unknown as CreatedOrderBody;

    expect(responseBody).toMatchObject({
      status: 'PENDING',
      paymentStatus: 'UNPAID',
      orderType: 'DELIVERY',
      totalCents: 4720,
    });
    expect(responseBody.orderNumber).toMatch(/^\d+$/);

    const order = await prisma.order.findUniqueOrThrow({
      where: { id: responseBody.orderId },
      include: { items: { include: { options: true } } },
    });

    expect(order).toMatchObject({
      customerUserId: null,
      customerName: 'Ada Lovelace',
      customerPhone: '610255550100',
      customerEmail: 'ada@example.com',
      addressLine1: '1 Test Street',
      addressLine2: 'Unit 2',
      city: 'Sydney',
      state: 'NSW',
      postcode: '2000',
      notes: 'Leave at reception.',
      subtotalCents: 4100,
      deliveryFeeCents: 500,
      serviceFeeCents: 120,
      totalCents: 4720,
    });
    expect(order.items).toHaveLength(1);
    expect(order.items[0]).toMatchObject({
      productNameSnapshot: 'Integration Pizza',
      productImageUrlSnapshot: '/integration-pizza.jpg',
      sizeNameSnapshot: 'Large',
      sizePriceCentsSnapshot: 400,
      quantity: 2,
      unitPriceCents: 2050,
      lineTotalCents: 4100,
    });
    expect(order.items[0].options).toEqual([
      expect.objectContaining({
        optionGroupNameSnapshot: 'Extras',
        optionNameSnapshot: 'Extra cheese',
        priceDeltaCentsSnapshot: 250,
      }),
    ]);
  });

  it('allocates distinct order numbers for concurrent checkouts', async () => {
    const fixture = await createCheckoutFixture(prisma);
    const requestBody = createPickupRequest(fixture.productId, [
      fixture.smallOptionId,
    ]);

    const responses = await Promise.all(
      Array.from({ length: 8 }, () =>
        request(httpServer).post('/api/orders').send(requestBody),
      ),
    );
    expect(responses.map((response) => response.status)).toEqual(
      Array(8).fill(201),
    );
    const numbers = responses.map(
      (response) => (response.body as CreatedOrderBody).orderNumber,
    );
    expect(new Set(numbers).size).toBe(8);
    expect(numbers.every((number) => /^\d+$/.test(number))).toBe(true);
    expect(await prisma.order.count()).toBe(8);
  });

  it('binds an authenticated order to the session while keeping submitted contact snapshots', async () => {
    const fixture = await createCheckoutFixture(prisma);
    const owner = await passwordCustomer();
    const body = createPickupRequest(fixture.productId, [
      fixture.smallOptionId,
    ]);
    body.customer.email = 'different-work-address@example.test';
    const response = await request(httpServer)
      .post('/api/orders')
      .set('Cookie', owner.access)
      .send(body)
      .expect(201);
    const order = await prisma.order.findUniqueOrThrow({
      where: { id: (response.body as CreatedOrderBody).orderId },
    });
    expect(order.customerUserId).toBe(owner.id);
    expect(order.customerEmail).toBe('different-work-address@example.test');
    expect(response.body).not.toHaveProperty('customerUserId');
    expect(
      (await prisma.customerUser.findUniqueOrThrow({ where: { id: owner.id } }))
        .email,
    ).toBe('owner@example.test');

    await prisma.product.update({
      where: { id: fixture.productId },
      data: { name: 'Renamed pizza', archivedAt: new Date() },
    });
    await prisma.productOption.update({
      where: { id: fixture.smallOptionId },
      data: { name: 'Renamed size', priceDelta: '9.00' },
    });
    const history = await request(httpServer)
      .get(`/api/customer/orders/${order.id}`)
      .set('Cookie', owner.access)
      .expect(200);
    const historicalItem = (history.body as { items: unknown[] }).items[0];
    expect(historicalItem).toMatchObject({
      name: 'Integration Pizza',
      sizeName: 'Small',
      sizePriceCents: 0,
    });
  });

  it.each(['customerUserId', 'customerId', 'userId'])(
    'rejects a browser-supplied %s ownership field',
    async (field) => {
      const fixture = await createCheckoutFixture(prisma);
      const owner = await passwordCustomer();
      await request(httpServer)
        .post('/api/orders')
        .set('Cookie', owner.access)
        .send({
          ...createPickupRequest(fixture.productId, [fixture.smallOptionId]),
          [field]: owner.id,
        })
        .expect(400);
      expect(await prisma.order.count()).toBe(0);
    },
  );

  it('rejects stale customer credentials without creating an unowned order', async () => {
    const fixture = await createCheckoutFixture(prisma);
    const owner = await passwordCustomer();
    const body = createPickupRequest(fixture.productId, [
      fixture.smallOptionId,
    ]);
    const jwt = app.get(JwtService);
    const session = await prisma.customerSession.findFirstOrThrow({
      where: { customerUserId: owner.id },
    });
    const expired = await jwt.signAsync(
      {
        sub: owner.id,
        sid: session.id,
        tokenType: 'customer_access',
        jti: randomUUID(),
      },
      {
        algorithm: 'HS256',
        secret: process.env.CUSTOMER_JWT_ACCESS_SECRET,
        issuer: process.env.CUSTOMER_JWT_ISSUER,
        audience: process.env.CUSTOMER_JWT_AUDIENCE,
        expiresIn: -1,
      },
    );
    for (const cookies of [
      [`orderly_customer_access=${expired}`, owner.refresh],
      ['orderly_customer_access=malformed'],
      [owner.refresh],
    ]) {
      await request(httpServer)
        .post('/api/orders')
        .set('Cookie', cookies)
        .send(body)
        .expect(401);
      expect(await prisma.order.count()).toBe(0);
    }
    await prisma.customerSession.deleteMany({
      where: { customerUserId: owner.id },
    });
    await request(httpServer)
      .post('/api/orders')
      .set('Cookie', owner.access)
      .send(body)
      .expect(401);
    expect(await prisma.order.count()).toBe(0);
    const newSession = await passwordCustomerAfterRevocation();
    await prisma.customerUser.update({
      where: { id: owner.id },
      data: { isActive: false },
    });
    await request(httpServer)
      .post('/api/orders')
      .set('Cookie', newSession)
      .send(body)
      .expect(401);
    expect(await prisma.order.count()).toBe(0);

    async function passwordCustomerAfterRevocation() {
      const login = await request(httpServer)
        .post('/api/customer/auth/login')
        .set('Origin', 'http://localhost:3000')
        .set('X-Orderly-Client', 'customer-web')
        .send({
          email: 'owner@example.test',
          password: 'An owner password 123!',
        })
        .expect(200);
      const cookies = login.headers['set-cookie'] as unknown as string[];
      return cookies
        .find((value) => value.startsWith('orderly_customer_access='))!
        .split(';')[0];
    }
  });

  it('leaves admin-only and historical orders unowned and clears ownership on customer deletion', async () => {
    const fixture = await createCheckoutFixture(prisma);
    const body = createPickupRequest(fixture.productId, [
      fixture.smallOptionId,
    ]);
    const guest = await request(httpServer)
      .post('/api/orders')
      .set('Cookie', [
        'orderly_admin_access=admin-token',
        'orderly_admin_refresh=admin-refresh',
      ])
      .send(body)
      .expect(201);
    expect(
      (
        await prisma.order.findUniqueOrThrow({
          where: { id: (guest.body as CreatedOrderBody).orderId },
        })
      ).customerUserId,
    ).toBeNull();
    const owner = await passwordCustomer();
    const owned = await request(httpServer)
      .post('/api/orders')
      .set('Cookie', owner.access)
      .send(body)
      .expect(201);
    await prisma.customerUser.delete({ where: { id: owner.id } });
    expect(
      (
        await prisma.order.findUniqueOrThrow({
          where: { id: (owned.body as CreatedOrderBody).orderId },
        })
      ).customerUserId,
    ).toBeNull();
  });

  it('has the ownership indexes needed for customer history queries', async () => {
    const indexes = await prisma.$queryRaw<Array<{ indexname: string }>>`
      SELECT indexname FROM pg_indexes
      WHERE schemaname = 'public' AND tablename = 'Order'
    `;
    expect(indexes.map((index) => index.indexname)).toEqual(
      expect.arrayContaining([
        'Order_customerUserId_createdAt_id_idx',
        'Order_customerUserId_status_createdAt_id_idx',
        'Order_customerUserId_totalCents_createdAt_id_idx',
      ]),
    );
  });

  it('rejects an authenticated checkout when customer cookies vanish before the request', async () => {
    const fixture = await createCheckoutFixture(prisma);
    await request(httpServer)
      .post('/api/orders')
      .set('X-Orderly-Customer-Intent', 'authenticated')
      .send(createPickupRequest(fixture.productId, [fixture.smallOptionId]))
      .expect(401);
    expect(await prisma.order.count()).toBe(0);
  });

  it.each(['an unknown property', 'duplicate option selections'])(
    'rejects checkout DTO input containing %s',
    async (caseName) => {
      const fixture = await createCheckoutFixture(prisma);
      const validRequest = createPickupRequest(fixture.productId, [
        fixture.smallOptionId,
      ]);
      const override =
        caseName === 'an unknown property'
          ? { unexpectedTotal: 1 }
          : {
              items: [
                {
                  productId: fixture.productId,
                  quantity: 1,
                  selectedOptionIds: [
                    fixture.smallOptionId,
                    fixture.smallOptionId,
                  ],
                },
              ],
            };

      await request(httpServer)
        .post('/api/orders')
        .send({ ...validRequest, ...override })
        .expect(400);

      await expect(prisma.order.count()).resolves.toBe(0);
    },
  );

  it('rejects an order that bypasses a required option selection', async () => {
    const fixture = await createCheckoutFixture(prisma);

    const response = await request(httpServer)
      .post('/api/orders')
      .send(createPickupRequest(fixture.productId, []))
      .expect(400);
    const responseBody = response.body as unknown as ErrorBody;

    expect(responseBody.message).toContain(
      'Please select at least 1 option from Size for Integration Pizza.',
    );
    await expect(prisma.order.count()).resolves.toBe(0);
  });

  async function receiptOrder(ownerCookie?: string) {
    const fixture = await createCheckoutFixture(prisma);
    const call = request(httpServer).post('/api/orders');
    if (ownerCookie) call.set('Cookie', ownerCookie);
    const response = await call
      .send(createPickupRequest(fixture.productId, [fixture.smallOptionId]))
      .expect(201);
    expect(response.headers['cache-control']).toBe('private, no-store');
    return response.body as CreatedOrderBody;
  }

  async function lookup(body: object, cookie?: string) {
    const call = request(httpServer).post('/api/orders/guest/lookup');
    if (cookie) call.set('Cookie', cookie);
    return call.send(body);
  }

  it.each([false, true])(
    'issues hash-only receipts for guest/owned orders (%s) and allows repeated minimal tracking',
    async (owned) => {
      const owner = owned ? await passwordCustomer() : null;
      const created = await receiptOrder(owner?.access);
      const stored = await prisma.order.findUniqueOrThrow({
        where: { id: created.orderId },
      });
      expect(
        stored.receiptCapabilityHash ===
          createHash('sha256').update(created.receiptCode).digest('hex'),
      ).toBe(true);
      expect(JSON.stringify(stored).includes(created.receiptCode)).toBe(false);
      expect(
        new Date(created.receiptExpiresAt).getTime() -
          stored.createdAt.getTime(),
      ).toBe(30 * 86400000);
      for (let count = 0; count < 2; count++) {
        const response = await lookup({
          orderNumber: '#' + created.orderNumber,
          receiptCode: created.receiptCode,
        });
        expect(response.status).toBe(201);
        expect(response.headers['cache-control']).toBe('private, no-store');
        const body = response.body as TrackingBody;
        expect(body).toMatchObject({
          orderNumber: created.orderNumber,
          totalCents: 1520,
        });
        for (const field of [
          'id',
          'customerName',
          'customerEmail',
          'customerPhone',
          'addressLine1',
          'addressLine2',
          'city',
          'state',
          'postcode',
          'notes',
          'receiptCapabilityHash',
          'receiptCode',
        ])
          expect(Object.hasOwn(body, field)).toBe(false);
        expect(JSON.stringify(body).includes(created.receiptCode)).toBe(false);
      }
    },
  );

  it('fails closed for missing, invalid, wrong-order, expired and revoked receipts with identical non-disclosing responses', async () => {
    const created = await receiptOrder();
    const product = await prisma.product.findFirstOrThrow({
      include: { optionGroups: { include: { options: true } } },
    });
    const size = product.optionGroups.find(
      (group) => group.kind === ProductOptionGroupKind.SIZE,
    )!.options[0];
    const second = await request(httpServer)
      .post('/api/orders')
      .send(createPickupRequest(product.id, [size.id]))
      .expect(201);
    const otherOrder = second.body as CreatedOrderBody;
    const failures = [
      await lookup({
        orderNumber: otherOrder.orderNumber,
        receiptCode: created.receiptCode,
      }),
      await lookup({ orderNumber: created.orderNumber }),
      await lookup({
        orderNumber: created.orderNumber,
        receiptCode: 'a'.repeat(43),
      }),
      await lookup({
        orderNumber: '99999999',
        receiptCode: created.receiptCode,
      }),
      await lookup({ orderNumber: created.orderNumber, receiptCode: '' }),
    ];
    await prisma.order.update({
      where: { id: created.orderId },
      data: { receiptCapabilityExpiresAt: new Date(0) },
    });
    failures.push(
      await lookup({
        orderNumber: created.orderNumber,
        receiptCode: created.receiptCode,
      }),
    );
    await prisma.order.update({
      where: { id: created.orderId },
      data: {
        receiptCapabilityExpiresAt: new Date(Date.now() + 86400000),
        receiptCapabilityRevokedAt: new Date(),
      },
    });
    failures.push(
      await lookup({
        orderNumber: created.orderNumber,
        receiptCode: created.receiptCode,
      }),
    );
    for (const response of failures) {
      expect(response.status).toBe(404);
      expect((response.body as ErrorBody).message).toBe(
        'Order tracking is unavailable with these credentials.',
      );
      expect(Object.keys(response.body as object).sort()).toEqual([
        'error',
        'message',
        'statusCode',
      ]);
      expect(JSON.stringify(response.body).includes(created.receiptCode)).toBe(
        false,
      );
    }
    // Legacy contact-only requests are rejected by whitelist validation, not used as proof.
    for (const contact of [
      { email: 'customer@example.com' },
      { phone: '610255550100' },
    ]) {
      const response = await lookup({
        orderNumber: created.orderNumber,
        ...contact,
      });
      expect(response.status).toBe(400);
      expect(Object.hasOwn(response.body as object, 'items')).toBe(false);
    }
    const nullCode = await lookup({
      orderNumber: created.orderNumber,
      receiptCode: null,
    });
    expect(nullCode.status).toBe(400);
  });

  it('preserves owner-only access and legacy ownership with different contact email, without invalid-code fallback', async () => {
    const owner = await passwordCustomer();
    const created = await receiptOrder(owner.access);
    const otherCustomer = await passwordCustomer('other.owner@example.test');
    expect(
      (await lookup({ orderNumber: created.orderNumber }, otherCustomer.access))
        .status,
    ).toBe(404);
    expect(
      (
        await lookup(
          {
            orderNumber: created.orderNumber,
            receiptCode: created.receiptCode,
          },
          otherCustomer.access,
        )
      ).status,
    ).toBe(201);
    // Receipt possession works independently of stale/invalid customer cookies.
    expect(
      (
        await lookup(
          {
            orderNumber: created.orderNumber,
            receiptCode: created.receiptCode,
          },
          'orderly_customer_access=invalid',
        )
      ).status,
    ).toBe(201);
    expect(
      (
        await lookup(
          { orderNumber: created.orderNumber, receiptCode: '' },
          owner.access,
        )
      ).status,
    ).toBe(404);
    const ownerAccess = await lookup(
      { orderNumber: created.orderNumber },
      owner.access,
    );
    expect(ownerAccess.status).toBe(201);
    const invalid = await lookup(
      { orderNumber: created.orderNumber, receiptCode: 'a'.repeat(43) },
      owner.access,
    );
    expect(invalid.status).toBe(404);
    await prisma.order.update({
      where: { id: created.orderId },
      data: { receiptCapabilityHash: null, receiptCapabilityExpiresAt: null },
    });
    expect(
      (await lookup({ orderNumber: created.orderNumber }, owner.access)).status,
    ).toBe(201);
    expect(
      (
        await lookup({
          orderNumber: created.orderNumber,
          receiptCode: created.receiptCode,
        })
      ).status,
    ).toBe(404);
    const other = await prisma.customerUser.create({
      data: { email: 'other@example.test' },
    });
    await prisma.order.update({
      where: { id: created.orderId },
      data: { customerUserId: other.id },
    });
    expect(
      (await lookup({ orderNumber: created.orderNumber }, owner.access)).status,
    ).toBe(404);
    await prisma.order.update({
      where: { id: created.orderId },
      data: { customerUserId: null },
    });
    expect((await lookup({ orderNumber: created.orderNumber })).status).toBe(
      404,
    );
    expect(
      (await lookup({ orderNumber: created.orderNumber }, owner.access)).status,
    ).toBe(404);
  });

  it('enforces the focused anonymous lookup throttle without revealing order data', async () => {
    const guardedApp = await createTestApp();
    try {
      const server = guardedApp.getHttpServer() as Server;
      for (let attempt = 0; attempt < 20; attempt++) {
        const response = await request(server)
          .post('/api/orders/guest/lookup')
          .send({ orderNumber: 'missing' });
        expect(response.status).toBe(404);
      }
      const throttled = await request(server)
        .post('/api/orders/guest/lookup')
        .send({ orderNumber: 'missing' });
      expect(throttled.status).toBe(429);
      expect(Object.hasOwn(throttled.body as object, 'items')).toBe(false);
    } finally {
      await guardedApp.close();
    }
  });
});

function createPickupRequest(productId: string, selectedOptionIds: string[]) {
  return {
    fulfillmentType: 'PICKUP',
    customer: {
      name: 'Test Customer',
      phone: '+61 (02) 5555 0100',
      email: 'customer@example.com',
    },
    items: [{ productId, quantity: 1, selectedOptionIds }],
  };
}

async function createCheckoutFixture(prisma: PrismaClient) {
  await prisma.storeSettings.create({
    data: {
      id: 'default',
      storeName: 'Orderly Test',
      isAcceptingOrders: true,
      pickupEnabled: true,
      deliveryEnabled: true,
      deliveryFee: '5.00',
      minimumOrderAmount: '0.00',
    },
  });

  const product = await prisma.product.create({
    data: {
      name: 'Integration Pizza',
      description: 'A deterministic test pizza.',
      basePrice: '14.00',
      imageUrl: '/integration-pizza.jpg',
      category: {
        create: { name: 'Integration Pizza', slug: 'integration-pizza' },
      },
      optionGroups: {
        create: [
          {
            name: 'Size',
            kind: ProductOptionGroupKind.SIZE,
            type: OptionGroupType.SINGLE,
            isRequired: true,
            minSelect: 1,
            maxSelect: 1,
            options: {
              create: [
                { name: 'Small', priceDelta: '0.00' },
                { name: 'Large', priceDelta: '4.00' },
              ],
            },
          },
          {
            name: 'Extras',
            kind: ProductOptionGroupKind.ADD_ON,
            type: OptionGroupType.MULTIPLE,
            maxSelect: 2,
            options: {
              create: [{ name: 'Extra cheese', priceDelta: '2.50' }],
            },
          },
        ],
      },
    },
    include: { optionGroups: { include: { options: true } } },
  });

  const sizeGroup = product.optionGroups.find((group) => group.name === 'Size');
  const extrasGroup = product.optionGroups.find(
    (group) => group.name === 'Extras',
  );

  if (!sizeGroup || !extrasGroup) {
    throw new Error('Order test fixture option groups were not created.');
  }

  return {
    productId: product.id,
    smallOptionId: sizeGroup.options.find((option) => option.name === 'Small')!
      .id,
    largeOptionId: sizeGroup.options.find((option) => option.name === 'Large')!
      .id,
    cheeseOptionId: extrasGroup.options[0].id,
  };
}

async function clearOrderFixtures(prisma: PrismaClient) {
  await prisma.orderItemOption.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productOption.deleteMany();
  await prisma.productOptionGroup.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.storeSettings.deleteMany();
}
