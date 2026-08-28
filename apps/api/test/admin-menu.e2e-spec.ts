/// <reference types="jest" />

import { INestApplication } from '@nestjs/common';
import {
  AdminRole,
  OptionGroupType,
  ProductOptionGroupKind,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import type { Server } from 'node:http';
import request from 'supertest';

import { BCRYPT_SALT_ROUNDS } from '../src/modules/auth/auth.constants';
import { PrismaService } from '../src/prisma/prisma.service';
import { createTestApp } from './support/create-test-app';

const ADMIN_EMAIL = 'menu.admin@orderly.test';
const ADMIN_PASSWORD = 'CorrectPassword123!';

type CategoryBody = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
};
type ProductBody = { id: string; name: string; optionGroups: unknown[] };
type ErrorBody = { message: string };
type PublicMenuBody = {
  categories: Array<{
    id: string;
    products: Array<{ id: string }>;
  }>;
};

describe('Admin menu API (e2e)', () => {
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

  it('creates a nested product attached to the intended category and public menu', async () => {
    const agent = await createAuthenticatedAgent(prisma, httpServer);
    const category = await createCategory(agent, '  Signature   Pizza  ');
    expect(category).toMatchObject({
      name: 'Signature Pizza',
      slug: 'signature-pizza',
    });

    const response = await agent
      .post('/api/admin/menu/products')
      .send(createNestedProductRequest(category.id))
      .expect(201);
    const body = response.body as unknown as ProductBody;

    expect(body).toMatchObject({ name: 'Margherita Deluxe' });
    expect(body.optionGroups).toHaveLength(2);

    const product = await prisma.product.findUniqueOrThrow({
      where: { id: body.id },
      include: {
        optionGroups: {
          include: { options: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    expect(product.categoryId).toBe(category.id);
    expect(Number(product.basePrice)).toBe(14);
    expect(product.optionGroups.map((group) => group.name)).toEqual([
      'Size',
      'Extras',
    ]);
    expect(product.optionGroups[0]).toMatchObject({
      kind: ProductOptionGroupKind.SIZE,
      type: OptionGroupType.SINGLE,
      isRequired: true,
      minSelect: 1,
      maxSelect: 1,
      sortOrder: 1,
    });
    expect(
      product.optionGroups[0].options.map((option) => option.name),
    ).toEqual(['Small', 'Large']);
    expect(Number(product.optionGroups[0].options[1].priceDelta)).toBe(4);

    const publicResponse = await request(httpServer)
      .get('/api/menu')
      .expect(200);
    const publicMenu = publicResponse.body as unknown as PublicMenuBody;
    expect(publicMenu.categories).toEqual([
      expect.objectContaining({
        id: category.id,
        products: [expect.objectContaining({ id: body.id })],
      }),
    ]);
  });

  it('rejects an internally inconsistent SINGLE option group', async () => {
    const agent = await createAuthenticatedAgent(prisma, httpServer);
    const category = await createCategory(agent, 'Pizza');
    const requestBody = createNestedProductRequest(category.id);
    requestBody.optionGroups[0].maxSelect = 2;

    const response = await agent
      .post('/api/admin/menu/products')
      .send(requestBody)
      .expect(400);
    const body = response.body as unknown as ErrorBody;

    expect(body.message).toContain(
      'Size must have maxSelect set to 1 because it uses SINGLE selection.',
    );
    await expect(prisma.product.count()).resolves.toBe(0);
  });

  it('persists category reorder and rejects an incomplete ID set', async () => {
    const agent = await createAuthenticatedAgent(prisma, httpServer);
    const first = await createCategory(agent, 'Pizza');
    const second = await createCategory(agent, 'Sides');
    const third = await createCategory(agent, 'Drinks');

    await agent
      .patch('/api/admin/menu/categories/reorder')
      .send({ categoryIds: [third.id, first.id, second.id] })
      .expect(200);

    const persisted = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      select: { id: true, sortOrder: true },
    });
    expect(persisted).toEqual([
      { id: third.id, sortOrder: 1 },
      { id: first.id, sortOrder: 2 },
      { id: second.id, sortOrder: 3 },
    ]);

    const invalidResponse = await agent
      .patch('/api/admin/menu/categories/reorder')
      .send({ categoryIds: [third.id, first.id] })
      .expect(400);
    expect((invalidResponse.body as unknown as ErrorBody).message).toBe(
      'Category reorder must include every non-archived category exactly once.',
    );
  });

  it('removes an unavailable product from the customer-facing menu', async () => {
    const agent = await createAuthenticatedAgent(prisma, httpServer);
    const category = await createCategory(agent, 'Pizza');
    const productResponse = await agent
      .post('/api/admin/menu/products')
      .send({
        name: 'Customer Visible Pizza',
        categoryId: category.id,
        basePriceCents: 1400,
      })
      .expect(201);
    const product = productResponse.body as unknown as ProductBody;

    const visibleResponse = await request(httpServer)
      .get('/api/menu')
      .expect(200);
    expect(JSON.stringify(visibleResponse.body)).toContain(product.id);

    await agent
      .patch(`/api/admin/menu/products/${product.id}/availability`)
      .send({ isAvailable: false })
      .expect(200);

    const hiddenResponse = await request(httpServer)
      .get('/api/menu')
      .expect(200);
    expect(JSON.stringify(hiddenResponse.body)).not.toContain(product.id);
    await expect(
      prisma.product.findUniqueOrThrow({ where: { id: product.id } }),
    ).resolves.toMatchObject({ isAvailable: false, archivedAt: null });
  });

  it('rejects an authenticated malformed AI suggestion request before provider use', async () => {
    const agent = await createAuthenticatedAgent(prisma, httpServer);

    await agent
      .post('/api/admin/menu/ai/content-suggestion')
      .send({ name: 'Margherita Pizza' })
      .expect(400);
  });
});

function createNestedProductRequest(categoryId: string) {
  return {
    name: '  Margherita Deluxe  ',
    description: '  Tomato, mozzarella and basil.  ',
    categoryId,
    basePriceCents: 1400,
    optionGroups: [
      {
        name: 'Size',
        kind: ProductOptionGroupKind.SIZE,
        type: OptionGroupType.SINGLE,
        isRequired: true,
        minSelect: 1,
        maxSelect: 1,
        options: [
          { name: 'Small', priceDeltaCents: 0, isDefault: true },
          { name: 'Large', priceDeltaCents: 400 },
        ],
      },
      {
        name: 'Extras',
        kind: ProductOptionGroupKind.ADD_ON,
        type: OptionGroupType.MULTIPLE,
        isRequired: false,
        minSelect: 0,
        maxSelect: 2,
        options: [{ name: 'Extra cheese', priceDeltaCents: 250 }],
      },
    ],
  };
}

async function createAuthenticatedAgent(prisma: PrismaService, server: Server) {
  await prisma.adminUser.create({
    data: {
      email: ADMIN_EMAIL,
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_SALT_ROUNDS),
      role: AdminRole.ADMIN,
    },
  });
  const agent = request.agent(server);
  await agent
    .post('/api/auth/login')
    .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    .expect(200);
  return agent;
}

async function createCategory(
  agent: ReturnType<typeof request.agent>,
  name: string,
): Promise<CategoryBody> {
  const response = await agent
    .post('/api/admin/menu/categories')
    .send({ name })
    .expect(201);
  const body: unknown = response.body;

  if (
    typeof body !== 'object' ||
    body === null ||
    !('id' in body) ||
    typeof body.id !== 'string' ||
    !('name' in body) ||
    typeof body.name !== 'string' ||
    !('slug' in body) ||
    typeof body.slug !== 'string' ||
    !('sortOrder' in body) ||
    typeof body.sortOrder !== 'number'
  ) {
    throw new Error('Category fixture returned an invalid response.');
  }

  return {
    id: body.id,
    name: body.name,
    slug: body.slug,
    sortOrder: body.sortOrder,
  };
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
