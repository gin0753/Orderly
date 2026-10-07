/// <reference types="jest" />

import type { INestApplication } from '@nestjs/common';
import { OrderStatus, OrderType, PrismaClient } from '@prisma/client';
import type { Server } from 'node:http';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './support/create-test-app';
import { expectPrivateCache } from './support/cache-policy';

type Summary = {
  id: string;
  orderNumber: string;
  itemCount: number;
  status: OrderStatus;
  totalCents: number;
};
type List = {
  data: Summary[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};

describe('Customer order history (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let prisma: PrismaClient;
  let serial = 0;

  beforeAll(async () => {
    app = await createTestApp({ bypassThrottling: true });
    server = app.getHttpServer() as Server;
    prisma = app.get(PrismaService);
  });
  afterAll(async () => {
    await app.close();
  });
  beforeEach(async () => {
    await prisma.orderItemOption.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.customerSession.deleteMany();
    await prisma.customerUser.deleteMany();
    serial = 0;
  });

  async function customer(email: string) {
    const response = await request(server)
      .post('/api/customer/auth/register')
      .set('Origin', 'http://localhost:3000')
      .set('X-Orderly-Client', 'customer-web')
      .send({
        email,
        name: email.split('@')[0],
        password: 'Order history password 123!',
      })
      .expect(201);
    const cookies = response.headers['set-cookie'] as unknown as string[];
    return {
      id: (response.body as { user: { id: string } }).user.id,
      cookie: cookies
        .find((value) => value.startsWith('orderly_customer_access='))!
        .split(';')[0],
    };
  }

  async function order(
    ownerId: string | null,
    options: {
      status?: OrderStatus;
      total?: number;
      createdAt?: Date;
      type?: OrderType;
      name?: string;
    } = {},
  ) {
    serial += 1;
    const total = options.total ?? 1500;
    return prisma.order.create({
      data: {
        orderNumber: String(900000 + serial),
        customerUserId: ownerId,
        status: options.status ?? OrderStatus.PENDING,
        orderType: options.type ?? OrderType.PICKUP,
        customerName: 'Historical Contact',
        customerEmail: 'snapshot@example.test',
        customerPhone: '0400123456',
        addressLine1:
          options.type === OrderType.DELIVERY ? '7 Old Street' : null,
        city: options.type === OrderType.DELIVERY ? 'Sydney' : null,
        state: options.type === OrderType.DELIVERY ? 'NSW' : null,
        postcode: options.type === OrderType.DELIVERY ? '2000' : null,
        notes: 'No onions',
        subtotalCents: total - 120,
        serviceFeeCents: 120,
        totalCents: total,
        createdAt: options.createdAt ?? new Date('2026-01-01T00:00:00.000Z'),
        items: {
          create: {
            productNameSnapshot: options.name ?? 'Original pizza name',
            sizeNameSnapshot: 'Large',
            sizePriceCentsSnapshot: 400,
            quantity: 2,
            unitPriceCents: (total - 120) / 2,
            lineTotalCents: total - 120,
            options: {
              create: {
                optionGroupNameSnapshot: 'Extras',
                optionNameSnapshot: 'Old cheese',
                priceDeltaCentsSnapshot: 250,
              },
            },
          },
        },
      },
    });
  }

  it('requires a customer session and scopes list, count, filters, and pages to its owner', async () => {
    const a = await customer('history-a@example.test');
    const b = await customer('history-b@example.test');
    const aOne = await order(a.id, { status: OrderStatus.COMPLETED });
    const aTwo = await order(a.id, { status: OrderStatus.PENDING });
    await order(b.id, { status: OrderStatus.COMPLETED });
    await order(null, { status: OrderStatus.COMPLETED });
    await request(server).get('/api/customer/orders').expect(401);
    const first = await request(server)
      .get('/api/customer/orders?pageSize=1')
      .set('Cookie', a.cookie)
      .expect(expectPrivateCache)
      .expect(200);
    expect((first.body as List).meta).toEqual({
      page: 1,
      pageSize: 1,
      totalItems: 2,
      totalPages: 2,
    });
    expect((first.body as List).data).toHaveLength(1);
    const second = await request(server)
      .get('/api/customer/orders?page=2&pageSize=1')
      .set('Cookie', a.cookie)
      .expect(200);
    expect(
      new Set(
        [...(first.body as List).data, ...(second.body as List).data].map(
          (entry) => entry.id,
        ),
      ),
    ).toEqual(new Set([aOne.id, aTwo.id]));
    const filtered = await request(server)
      .get('/api/customer/orders?status=COMPLETED')
      .set('Cookie', a.cookie)
      .expect(200);
    expect((filtered.body as List).data.map((entry) => entry.id)).toEqual([
      aOne.id,
    ]);
    expect((filtered.body as List).meta.totalItems).toBe(1);
    const emptyPage = await request(server)
      .get('/api/customer/orders?page=9')
      .set('Cookie', a.cookie)
      .expect(200);
    expect((emptyPage.body as List).data).toEqual([]);
    expect((emptyPage.body as List).meta).toEqual({
      page: 9,
      pageSize: 10,
      totalItems: 2,
      totalPages: 1,
    });
    expect(
      (
        await request(server)
          .get('/api/customer/orders')
          .set('Cookie', a.cookie)
          .expect(200)
      ).body as List,
    ).toMatchObject({
      meta: { page: 1, pageSize: 10, totalItems: 2, totalPages: 1 },
    });
  });

  it('sorts deterministically with id tie-breakers and counts item quantities', async () => {
    const a = await customer('history-a@example.test');
    const early = new Date('2026-01-01T00:00:00.000Z');
    const late = new Date('2026-01-02T00:00:00.000Z');
    const created = [
      await order(a.id, { total: 1200, createdAt: early }),
      await order(a.id, { total: 1200, createdAt: early }),
      await order(a.id, { total: 2400, createdAt: late }),
      await order(a.id, { total: 2400, createdAt: late }),
    ];
    const expected = {
      newest: [...created].sort(
        (x, y) =>
          y.createdAt.getTime() - x.createdAt.getTime() ||
          y.id.localeCompare(x.id),
      ),
      oldest: [...created].sort(
        (x, y) =>
          x.createdAt.getTime() - y.createdAt.getTime() ||
          x.id.localeCompare(y.id),
      ),
      amount_high: [...created].sort(
        (x, y) =>
          y.totalCents - x.totalCents ||
          y.createdAt.getTime() - x.createdAt.getTime() ||
          y.id.localeCompare(x.id),
      ),
      amount_low: [...created].sort(
        (x, y) =>
          x.totalCents - y.totalCents ||
          y.createdAt.getTime() - x.createdAt.getTime() ||
          y.id.localeCompare(x.id),
      ),
    };
    for (const [sort, rows] of Object.entries(expected)) {
      const result = await request(server)
        .get(`/api/customer/orders?sort=${sort}`)
        .set('Cookie', a.cookie)
        .expect(200);
      expect((result.body as List).data.map((entry) => entry.id)).toEqual(
        rows.map((entry) => entry.id),
      );
      expect(
        (result.body as List).data.every((entry) => entry.itemCount === 2),
      ).toBe(true);
    }
  });

  it('accepts every real status and validates all query bounds and fields', async () => {
    const a = await customer('history-a@example.test');
    for (const status of Object.values(OrderStatus))
      await order(a.id, { status });
    for (const status of Object.values(OrderStatus)) {
      const result = await request(server)
        .get(`/api/customer/orders?status=${status}`)
        .set('Cookie', a.cookie)
        .expect(200);
      expect((result.body as List).data).toHaveLength(1);
      expect((result.body as List).data[0].status).toBe(status);
    }
    expect(
      (
        await request(server)
          .get('/api/customer/orders?status=all&pageSize=50')
          .set('Cookie', a.cookie)
          .expect(200)
      ).body as List,
    ).toMatchObject({ meta: { pageSize: 50, totalItems: 6 } });
    for (const search of [
      'page=0',
      'page=-1',
      'page=1.5',
      'pageSize=0',
      'pageSize=51',
      'pageSize=no',
      'status=UNKNOWN',
      'sort=random',
      'userId=other',
    ]) {
      await request(server)
        .get(`/api/customer/orders?${search}`)
        .set('Cookie', a.cookie)
        .expect(400);
    }
  });

  it('returns one explicit historical snapshot and identical 404s for other, guest, and missing orders', async () => {
    const a = await customer('history-a@example.test');
    const b = await customer('history-b@example.test');
    const own = await order(a.id, {
      type: OrderType.DELIVERY,
      name: 'Original pizza name',
    });
    const other = await order(b.id);
    const guest = await order(null);
    const response = await request(server)
      .get(`/api/customer/orders/${own.id}`)
      .set('Cookie', a.cookie)
      .expect(expectPrivateCache)
      .expect(200);
    expect(response.body).toMatchObject({
      id: own.id,
      orderNumber: own.orderNumber,
      customer: { email: 'snapshot@example.test' },
      address: { addressLine1: '7 Old Street', city: 'Sydney' },
      notes: 'No onions',
      items: [
        {
          name: 'Original pizza name',
          sizeName: 'Large',
          quantity: 2,
          options: [{ name: 'Old cheese', priceDeltaCents: 250 }],
        },
      ],
      subtotalCents: own.subtotalCents,
      totalCents: own.totalCents,
    });
    expect(response.body).not.toHaveProperty('customerUserId');
    expect(response.body).not.toHaveProperty('paymentStatus');
    expect((response.body as { items: unknown[] }).items[0]).not.toHaveProperty(
      'productId',
    );
    const failures = [
      other.id,
      guest.id,
      '00000000-0000-4000-8000-000000000000',
      'bad-id',
    ];
    const bodies: unknown[] = [];
    for (const id of failures) {
      const missing = await request(server)
        .get(`/api/customer/orders/${id}`)
        .set('Cookie', a.cookie)
        .expect(404);
      bodies.push(missing.body as unknown);
    }
    expect(
      bodies.every(
        (body) => JSON.stringify(body) === JSON.stringify(bodies[0]),
      ),
    ).toBe(true);
    const list = await request(server)
      .get('/api/customer/orders')
      .set('Cookie', a.cookie)
      .expect(200);
    expect((list.body as List).data[0]).toEqual({
      id: own.id,
      orderNumber: own.orderNumber,
      status: own.status,
      orderType: own.orderType,
      itemCount: 2,
      totalCents: own.totalCents,
      createdAt: own.createdAt.toISOString(),
    });
  });
});
