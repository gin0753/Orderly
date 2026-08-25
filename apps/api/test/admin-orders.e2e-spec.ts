/// <reference types="jest" />

import { INestApplication } from '@nestjs/common';
import { AdminRole, OrderStatus, OrderType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import type { Server } from 'node:http';
import request from 'supertest';

import { BCRYPT_SALT_ROUNDS } from '../src/modules/auth/auth.constants';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './support/create-test-app';

const ADMIN_EMAIL = 'orders.admin@orderly.test';
const ADMIN_PASSWORD = 'CorrectPassword123!';

type CreatedOrder = { orderId: string; orderNumber: string };
type AdminOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  orderType: OrderType;
  status: OrderStatus;
  totalCents: number;
  items: Array<{
    productNameSnapshot: string;
    quantity: number;
    unitPriceCents: number;
    lineTotalCents: number;
  }>;
};
type OrdersListBody = {
  data: AdminOrder[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  summary: Record<string, number>;
};
type ErrorBody = { message: string };

describe('Admin orders API (e2e)', () => {
  let app: INestApplication;
  let httpServer: Server;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp();
    httpServer = app.getHttpServer() as Server;
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await clearFixtures(prisma);
  });

  it('lists authenticated orders newest first with status summaries', async () => {
    const fixture = await createAdminOrdersFixture(prisma, httpServer);

    const response = await fixture.agent.get('/api/orders').expect(200);
    const body = response.body as unknown as OrdersListBody;

    expect(body.data.map((order) => order.id)).toEqual([
      fixture.orders[2].orderId,
      fixture.orders[1].orderId,
      fixture.orders[0].orderId,
    ]);
    expect(body.summary).toMatchObject({
      total: 3,
      pending: 1,
      accepted: 1,
      completed: 1,
    });
    expect(body.meta).toMatchObject({ total: 3, page: 1, pageSize: 20 });
  });

  it('composes representative customer, status, and fulfillment filters', async () => {
    const fixture = await createAdminOrdersFixture(prisma, httpServer);

    const response = await fixture.agent
      .get('/api/orders')
      .query({ search: 'grace', status: 'ACCEPTED', orderType: 'DELIVERY' })
      .expect(200);
    const body = response.body as unknown as OrdersListBody;

    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toMatchObject({
      id: fixture.orders[1].orderId,
      customerName: 'Grace Hopper',
      status: OrderStatus.ACCEPTED,
      orderType: OrderType.DELIVERY,
    });
    expect(body.meta.total).toBe(1);
  });

  it('paginates without repeating records', async () => {
    const fixture = await createAdminOrdersFixture(prisma, httpServer);

    const firstResponse = await fixture.agent
      .get('/api/orders')
      .query({ page: 1, pageSize: 2 })
      .expect(200);
    const secondResponse = await fixture.agent
      .get('/api/orders')
      .query({ page: 2, pageSize: 2 })
      .expect(200);
    const first = firstResponse.body as unknown as OrdersListBody;
    const second = secondResponse.body as unknown as OrdersListBody;

    expect(first.data).toHaveLength(2);
    expect(second.data).toHaveLength(1);
    expect(first.meta).toMatchObject({
      page: 1,
      pageSize: 2,
      total: 3,
      totalPages: 2,
      hasNextPage: true,
      hasPreviousPage: false,
    });
    expect(second.meta).toMatchObject({
      page: 2,
      hasNextPage: false,
      hasPreviousPage: true,
    });
    expect(first.data.map((order) => order.id)).not.toContain(
      second.data[0].id,
    );
  });

  it('returns meaningful order detail and immutable item snapshots', async () => {
    const fixture = await createAdminOrdersFixture(prisma, httpServer);

    const response = await fixture.agent
      .get(`/api/orders/${fixture.orders[0].orderId}`)
      .expect(200);
    const body = response.body as unknown as AdminOrder;

    expect(body).toMatchObject({
      id: fixture.orders[0].orderId,
      orderNumber: fixture.orders[0].orderNumber,
      customerName: 'Ada Lovelace',
      orderType: OrderType.PICKUP,
      status: OrderStatus.PENDING,
      totalCents: 1520,
    });
    expect(body.items).toEqual([
      expect.objectContaining({
        productNameSnapshot: 'Admin Orders Pizza',
        quantity: 1,
        unitPriceCents: 1400,
        lineTotalCents: 1400,
      }),
    ]);
  });

  it('persists a valid action, keeps it idempotent, and rejects an invalid transition', async () => {
    const fixture = await createAdminOrdersFixture(prisma, httpServer);
    const orderId = fixture.orders[0].orderId;

    const acceptedResponse = await fixture.agent
      .patch(`/api/orders/${orderId}/action`)
      .send({ action: 'ACCEPT' })
      .expect(200);
    expect((acceptedResponse.body as unknown as AdminOrder).status).toBe(
      OrderStatus.ACCEPTED,
    );
    await expect(
      prisma.order.findUniqueOrThrow({ where: { id: orderId } }),
    ).resolves.toMatchObject({ status: OrderStatus.ACCEPTED });

    const repeatedResponse = await fixture.agent
      .patch(`/api/orders/${orderId}/action`)
      .send({ action: 'ACCEPT' })
      .expect(200);
    expect((repeatedResponse.body as unknown as AdminOrder).status).toBe(
      OrderStatus.ACCEPTED,
    );

    const invalidResponse = await fixture.agent
      .patch(`/api/orders/${orderId}/action`)
      .send({ action: 'COMPLETE' })
      .expect(400);
    expect((invalidResponse.body as unknown as ErrorBody).message).toContain(
      'Cannot perform COMPLETE while order is ACCEPTED.',
    );
  });
});

async function createAdminOrdersFixture(
  prisma: PrismaService,
  httpServer: Server,
) {
  await prisma.storeSettings.create({
    data: {
      id: 'default',
      storeName: 'Orderly Test',
      deliveryFee: '5.00',
      minimumOrderAmount: '0.00',
    },
  });
  const product = await prisma.product.create({
    data: {
      name: 'Admin Orders Pizza',
      basePrice: '14.00',
      category: {
        create: { name: 'Admin Orders Pizza', slug: 'admin-orders-pizza' },
      },
    },
  });
  await prisma.adminUser.create({
    data: {
      email: ADMIN_EMAIL,
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_SALT_ROUNDS),
      role: AdminRole.ADMIN,
    },
  });

  const agent = request.agent(httpServer);
  await agent
    .post('/api/auth/login')
    .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    .expect(200);

  const orders = [
    await createPublicOrder(httpServer, product.id, 'Ada Lovelace', 'PICKUP'),
    await createPublicOrder(httpServer, product.id, 'Grace Hopper', 'DELIVERY'),
    await createPublicOrder(
      httpServer,
      product.id,
      'Katherine Johnson',
      'PICKUP',
    ),
  ];

  await prisma.order.update({
    where: { id: orders[0].orderId },
    data: { createdAt: new Date('2026-01-01T10:00:00.000Z') },
  });
  await prisma.order.update({
    where: { id: orders[1].orderId },
    data: {
      status: OrderStatus.ACCEPTED,
      createdAt: new Date('2026-01-01T11:00:00.000Z'),
    },
  });
  await prisma.order.update({
    where: { id: orders[2].orderId },
    data: {
      status: OrderStatus.COMPLETED,
      createdAt: new Date('2026-01-01T12:00:00.000Z'),
    },
  });

  return { agent, orders };
}

async function createPublicOrder(
  httpServer: Server,
  productId: string,
  customerName: string,
  orderType: 'PICKUP' | 'DELIVERY',
): Promise<CreatedOrder> {
  const response = await request(httpServer)
    .post('/api/orders')
    .send({
      fulfillmentType: orderType,
      customer: {
        name: customerName,
        phone: '0400 000 000',
        email: `${customerName.toLowerCase().replaceAll(' ', '.')}@example.com`,
      },
      ...(orderType === 'DELIVERY'
        ? {
            address: {
              addressLine1: '1 Test Street',
              city: 'Sydney',
              state: 'NSW',
              postcode: '2000',
            },
          }
        : {}),
      items: [{ productId, quantity: 1, selectedOptionIds: [] }],
    })
    .expect(201);

  const body: unknown = response.body;

  if (
    typeof body !== 'object' ||
    body === null ||
    !('orderId' in body) ||
    typeof body.orderId !== 'string' ||
    !('orderNumber' in body) ||
    typeof body.orderNumber !== 'string'
  ) {
    throw new Error('Public order fixture returned an invalid response.');
  }

  return { orderId: body.orderId, orderNumber: body.orderNumber };
}

async function clearFixtures(prisma: PrismaService) {
  await prisma.adminSession.deleteMany();
  await prisma.adminUser.deleteMany();
  await prisma.orderItemOption.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productOption.deleteMany();
  await prisma.productOptionGroup.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.storeSettings.deleteMany();
}
