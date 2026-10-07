/// <reference types="jest" />

import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';
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
  orderId: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  orderType: string;
  totalCents: number;
};

type ErrorBody = { message: string };
type TrackingBody = {
  id: string;
  orderNumber: string;
  customerEmail: string;
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

  async function passwordCustomer() {
    const response = await request(httpServer)
      .post('/api/customer/auth/register')
      .set('Origin', 'http://localhost:3000')
      .set('X-Orderly-Client', 'customer-web')
      .send({
        email: 'owner@example.test',
        name: 'Order Owner',
        password: 'An owner password 123!',
      })
      .expect(201);
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

  it('looks up an order using a # number and normalized email or phone', async () => {
    const fixture = await createCheckoutFixture(prisma);
    const created = await request(httpServer)
      .post('/api/orders')
      .send(createPickupRequest(fixture.productId, [fixture.smallOptionId]))
      .expect(201);
    const createdBody = created.body as unknown as CreatedOrderBody;

    const byEmail = await request(httpServer)
      .post('/api/orders/guest/lookup')
      .send({
        orderNumber: `#${createdBody.orderNumber}`,
        email: 'CUSTOMER@EXAMPLE.COM',
      })
      .expect(201);
    const emailTrackingBody = byEmail.body as unknown as TrackingBody;
    expect(emailTrackingBody).toMatchObject({
      orderNumber: createdBody.orderNumber,
      customerEmail: 'customer@example.com',
      totalCents: 1520,
    });

    const byPhone = await request(httpServer)
      .post('/api/orders/guest/lookup')
      .send({
        orderNumber: createdBody.orderNumber,
        phone: '+61 (02) 5555 0100',
      })
      .expect(201);
    const phoneTrackingBody = byPhone.body as unknown as TrackingBody;
    expect(phoneTrackingBody.id).toBe(createdBody.orderId);
  });

  it('returns the same privacy-safe response when guest verification fails', async () => {
    const fixture = await createCheckoutFixture(prisma);
    const created = await request(httpServer)
      .post('/api/orders')
      .send(createPickupRequest(fixture.productId, [fixture.smallOptionId]))
      .expect(201);
    const createdBody = created.body as unknown as CreatedOrderBody;

    const wrongEmail = await request(httpServer)
      .post('/api/orders/guest/lookup')
      .send({
        orderNumber: createdBody.orderNumber,
        email: 'wrong@example.com',
      })
      .expect(404);
    const unknownOrder = await request(httpServer)
      .post('/api/orders/guest/lookup')
      .send({ orderNumber: '99999999', email: 'customer@example.com' })
      .expect(404);
    const wrongEmailBody = wrongEmail.body as unknown as ErrorBody;
    const unknownOrderBody = unknownOrder.body as unknown as ErrorBody;

    expect(wrongEmailBody.message).toBe(
      'Order not found. Please check your order number and contact detail.',
    );
    expect(unknownOrderBody.message).toBe(wrongEmailBody.message);
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
