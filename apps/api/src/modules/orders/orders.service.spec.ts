import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  OptionGroupType,
  OrderStatus,
  OrderType,
  PaymentStatus,
  Prisma,
  ProductOptionGroupKind,
} from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateOrderDto,
  CreateOrderFulfillmentType,
} from './dto/create-order.dto';
import { OrdersService } from './orders.service';

type TransactionMock = {
  storeSettings: { findUnique: jest.Mock };
  product: { findMany: jest.Mock };
  order: { findFirst: jest.Mock; create: jest.Mock };
};

type PersistedOrderInput = {
  orderType: OrderType;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  subtotalCents: number;
  deliveryFeeCents: number;
  serviceFeeCents: number;
  totalCents: number;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postcode?: string;
  items: {
    create: Array<{
      productNameSnapshot: string;
      productImageUrlSnapshot: string | null;
      sizeNameSnapshot: string | null;
      sizePriceCentsSnapshot: number | null;
      quantity: number;
      unitPriceCents: number;
      lineTotalCents: number;
      options: { create: unknown[] };
    }>;
  };
};

const PRODUCT_ID = '11111111-1111-4111-8111-111111111111';
const SIZE_GROUP_ID = '22222222-2222-4222-8222-222222222222';
const SMALL_OPTION_ID = '33333333-3333-4333-8333-333333333333';
const LARGE_OPTION_ID = '44444444-4444-4444-8444-444444444444';
const EXTRA_GROUP_ID = '55555555-5555-4555-8555-555555555555';
const CHEESE_OPTION_ID = '66666666-6666-4666-8666-666666666666';

function createStoreSettings(overrides: Record<string, unknown> = {}) {
  return {
    id: 'default',
    storeName: 'Orderly Test',
    isAcceptingOrders: true,
    pickupEnabled: true,
    deliveryEnabled: true,
    estimatedPreparationMinutes: 20,
    deliveryFee: new Prisma.Decimal('5.00'),
    minimumOrderAmount: new Prisma.Decimal('0.00'),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function createProduct(overrides: Record<string, unknown> = {}) {
  return {
    id: PRODUCT_ID,
    categoryId: '77777777-7777-4777-8777-777777777777',
    name: 'Test Pizza',
    description: null,
    basePrice: new Prisma.Decimal('14.00'),
    imageUrl: '/test-pizza.jpg',
    isAvailable: true,
    sortOrder: 1,
    archivedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    category: {
      id: '77777777-7777-4777-8777-777777777777',
      name: 'Pizza',
      slug: 'pizza',
      description: null,
      sortOrder: 1,
      isActive: true,
      archivedAt: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    },
    optionGroups: [
      {
        id: SIZE_GROUP_ID,
        productId: PRODUCT_ID,
        name: 'Size',
        kind: ProductOptionGroupKind.SIZE,
        type: OptionGroupType.SINGLE,
        isRequired: true,
        minSelect: 1,
        maxSelect: 1,
        sortOrder: 1,
        isActive: true,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        options: [
          {
            id: SMALL_OPTION_ID,
            optionGroupId: SIZE_GROUP_ID,
            name: 'Small',
            priceDelta: new Prisma.Decimal('0.00'),
            isAvailable: true,
            isDefault: true,
            sortOrder: 1,
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
            updatedAt: new Date('2026-01-01T00:00:00.000Z'),
          },
          {
            id: LARGE_OPTION_ID,
            optionGroupId: SIZE_GROUP_ID,
            name: 'Large',
            priceDelta: new Prisma.Decimal('4.00'),
            isAvailable: true,
            isDefault: false,
            sortOrder: 2,
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
            updatedAt: new Date('2026-01-01T00:00:00.000Z'),
          },
        ],
      },
      {
        id: EXTRA_GROUP_ID,
        productId: PRODUCT_ID,
        name: 'Extras',
        kind: ProductOptionGroupKind.ADD_ON,
        type: OptionGroupType.MULTIPLE,
        isRequired: false,
        minSelect: 0,
        maxSelect: 1,
        sortOrder: 2,
        isActive: true,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        options: [
          {
            id: CHEESE_OPTION_ID,
            optionGroupId: EXTRA_GROUP_ID,
            name: 'Extra cheese',
            priceDelta: new Prisma.Decimal('2.50'),
            isAvailable: true,
            isDefault: false,
            sortOrder: 1,
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
            updatedAt: new Date('2026-01-01T00:00:00.000Z'),
          },
        ],
      },
    ],
    ...overrides,
  };
}

function createOrderDto(
  overrides: Partial<CreateOrderDto> = {},
): CreateOrderDto {
  return {
    fulfillmentType: CreateOrderFulfillmentType.PICKUP,
    customer: {
      name: '  Test Customer  ',
      phone: '+61 (02) 5555 0100',
      email: '  CUSTOMER@Example.COM  ',
    },
    items: [
      {
        productId: PRODUCT_ID,
        quantity: 2,
        selectedOptionIds: [LARGE_OPTION_ID, CHEESE_OPTION_ID],
      },
    ],
    ...overrides,
  };
}

describe('OrdersService order creation rules', () => {
  let service: OrdersService;
  let prisma: { $transaction: jest.Mock };
  let tx: TransactionMock;

  beforeEach(() => {
    tx = {
      storeSettings: { findUnique: jest.fn() },
      product: { findMany: jest.fn() },
      order: { findFirst: jest.fn(), create: jest.fn() },
    };
    prisma = {
      $transaction: jest.fn((callback: (client: TransactionMock) => unknown) =>
        callback(tx),
      ),
    };
    service = new OrdersService(prisma as unknown as PrismaService);

    tx.storeSettings.findUnique.mockResolvedValue(createStoreSettings());
    tx.product.findMany.mockResolvedValue([createProduct()]);
    tx.order.findFirst.mockResolvedValue({ orderNumber: '10000' });
    tx.order.create.mockImplementation(
      ({ data }: { data: Record<string, unknown> }) => ({
        id: 'order-1',
        orderNumber: data.orderNumber,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.UNPAID,
        orderType: data.orderType,
        totalCents: data.totalCents,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        items: [],
      }),
    );
  });

  it('requires an address for delivery before starting persistence work', async () => {
    await expect(
      service.createOrder(
        createOrderDto({
          fulfillmentType: CreateOrderFulfillmentType.DELIVERY,
        }),
      ),
    ).rejects.toThrow('Delivery orders require an address.');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it.each([
    ['closed store', { isAcceptingOrders: false }, 'not currently accepting'],
    [
      'disabled pickup',
      { pickupEnabled: false },
      'Pickup is not currently available',
    ],
    [
      'disabled delivery',
      { deliveryEnabled: false },
      'Delivery is not currently available',
    ],
  ])('rejects a %s', async (_caseName, storeOverrides, message) => {
    tx.storeSettings.findUnique.mockResolvedValue(
      createStoreSettings(storeOverrides),
    );
    const dto = createOrderDto(
      'deliveryEnabled' in storeOverrides
        ? {
            fulfillmentType: CreateOrderFulfillmentType.DELIVERY,
            address: {
              addressLine1: '1 Test Street',
              city: 'Sydney',
              state: 'NSW',
              postcode: '2000',
            },
          }
        : {},
    );

    await expect(service.createOrder(dto)).rejects.toThrow(message);
  });

  it('fails safely when store settings are missing', async () => {
    tx.storeSettings.findUnique.mockResolvedValue(null);
    await expect(service.createOrder(createOrderDto())).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('rejects missing and unavailable products or categories', async () => {
    tx.product.findMany.mockResolvedValue([]);
    await expect(service.createOrder(createOrderDto())).rejects.toThrow(
      'One or more products no longer exist.',
    );

    for (const product of [
      createProduct({ isAvailable: false }),
      createProduct({ archivedAt: new Date() }),
      createProduct({
        category: { ...createProduct().category, isActive: false },
      }),
      createProduct({
        category: { ...createProduct().category, archivedAt: new Date() },
      }),
    ]) {
      tx.product.findMany.mockResolvedValue([product]);
      await expect(service.createOrder(createOrderDto())).rejects.toThrow(
        'Test Pizza is no longer available.',
      );
    }
  });

  it('rejects unknown and unavailable options', async () => {
    await expect(
      service.createOrder(
        createOrderDto({
          items: [
            {
              productId: PRODUCT_ID,
              quantity: 1,
              selectedOptionIds: ['88888888-8888-4888-8888-888888888888'],
            },
          ],
        }),
      ),
    ).rejects.toThrow('An invalid option was selected for Test Pizza.');

    const product = createProduct();
    product.optionGroups[0].options[0].isAvailable = false;
    tx.product.findMany.mockResolvedValue([product]);
    await expect(
      service.createOrder(
        createOrderDto({
          items: [
            {
              productId: PRODUCT_ID,
              quantity: 1,
              selectedOptionIds: [SMALL_OPTION_ID],
            },
          ],
        }),
      ),
    ).rejects.toThrow('Small is no longer available for Test Pizza.');
  });

  it('enforces required, SINGLE and maxSelect option rules', async () => {
    const singleProduct = createProduct();
    singleProduct.optionGroups[0].maxSelect = 3;
    tx.product.findMany.mockResolvedValue([singleProduct]);

    await expect(
      service.createOrder(
        createOrderDto({
          items: [
            { productId: PRODUCT_ID, quantity: 1, selectedOptionIds: [] },
          ],
        }),
      ),
    ).rejects.toThrow('Please select at least 1 option from Size');

    await expect(
      service.createOrder(
        createOrderDto({
          items: [
            {
              productId: PRODUCT_ID,
              quantity: 1,
              selectedOptionIds: [SMALL_OPTION_ID, LARGE_OPTION_ID],
            },
          ],
        }),
      ),
    ).rejects.toThrow('Please select no more than 1 option from Size');

    const product = createProduct();
    product.optionGroups[1].minSelect = 1;
    tx.product.findMany.mockResolvedValue([product]);
    await expect(
      service.createOrder(
        createOrderDto({
          items: [
            {
              productId: PRODUCT_ID,
              quantity: 1,
              selectedOptionIds: [SMALL_OPTION_ID],
            },
          ],
        }),
      ),
    ).rejects.toThrow('Please select at least 1 option from Extras');
  });

  it('uses database prices, quantity and snapshots as the source of truth', async () => {
    await service.createOrder(
      createOrderDto({
        // Extra client fields are deliberately ignored by the service contract.
        items: [
          {
            productId: PRODUCT_ID,
            quantity: 2,
            selectedOptionIds: [LARGE_OPTION_ID, CHEESE_OPTION_ID],
            unitPriceCents: 1,
          } as CreateOrderDto['items'][number],
        ],
      }),
    );

    const createData = getPersistedOrderInput(tx.order.create);
    expect(createData).toMatchObject({
      orderType: OrderType.PICKUP,
      customerName: 'Test Customer',
      customerPhone: '610255550100',
      customerEmail: 'customer@example.com',
      subtotalCents: 4100,
      deliveryFeeCents: 0,
      serviceFeeCents: 120,
      totalCents: 4220,
    });
    expect(createData.items.create).toEqual([
      expect.objectContaining({
        productNameSnapshot: 'Test Pizza',
        productImageUrlSnapshot: '/test-pizza.jpg',
        sizeNameSnapshot: 'Large',
        sizePriceCentsSnapshot: 400,
        quantity: 2,
        unitPriceCents: 2050,
        lineTotalCents: 4100,
        options: {
          create: [
            {
              optionId: CHEESE_OPTION_ID,
              optionGroupNameSnapshot: 'Extras',
              optionNameSnapshot: 'Extra cheese',
              priceDeltaCentsSnapshot: 250,
            },
          ],
        },
      }),
    ]);
  });

  it.each([
    [4999, 500, 5619],
    [5000, 0, 5120],
  ])(
    'applies the delivery threshold at a %i cent subtotal',
    async (basePriceCents, deliveryFeeCents, totalCents) => {
      tx.product.findMany.mockResolvedValue([
        createProduct({
          basePrice: new Prisma.Decimal(basePriceCents / 100),
          optionGroups: [],
        }),
      ]);

      await service.createOrder(
        createOrderDto({
          fulfillmentType: CreateOrderFulfillmentType.DELIVERY,
          address: {
            addressLine1: ' 1 Test Street ',
            addressLine2: ' Unit 2 ',
            city: ' Sydney ',
            state: ' NSW ',
            postcode: ' 2000 ',
          },
          items: [
            { productId: PRODUCT_ID, quantity: 1, selectedOptionIds: [] },
          ],
        }),
      );

      expect(getPersistedOrderInput(tx.order.create)).toMatchObject({
        addressLine1: '1 Test Street',
        addressLine2: 'Unit 2',
        city: 'Sydney',
        state: 'NSW',
        postcode: '2000',
        subtotalCents: basePriceCents,
        deliveryFeeCents,
        totalCents,
      });
    },
  );

  it('enforces the minimum order boundary', async () => {
    tx.storeSettings.findUnique.mockResolvedValue(
      createStoreSettings({ minimumOrderAmount: new Prisma.Decimal('20.01') }),
    );
    tx.product.findMany.mockResolvedValue([
      createProduct({
        basePrice: new Prisma.Decimal('20.00'),
        optionGroups: [],
      }),
    ]);

    await expect(
      service.createOrder(
        createOrderDto({
          items: [
            { productId: PRODUCT_ID, quantity: 1, selectedOptionIds: [] },
          ],
        }),
      ),
    ).rejects.toThrow('The minimum order amount is $20.01.');

    tx.storeSettings.findUnique.mockResolvedValue(
      createStoreSettings({ minimumOrderAmount: new Prisma.Decimal('20.00') }),
    );
    await expect(
      service.createOrder(
        createOrderDto({
          items: [
            { productId: PRODUCT_ID, quantity: 1, selectedOptionIds: [] },
          ],
        }),
      ),
    ).resolves.toMatchObject({ totalCents: 2120 });
  });

  it('rejects a negative computed unit price', async () => {
    tx.product.findMany.mockResolvedValue([
      createProduct({
        basePrice: new Prisma.Decimal('1.00'),
        optionGroups: [
          {
            ...createProduct().optionGroups[0],
            options: [
              {
                ...createProduct().optionGroups[0].options[0],
                priceDelta: new Prisma.Decimal('-2.00'),
              },
            ],
          },
        ],
      }),
    ]);

    await expect(
      service.createOrder(
        createOrderDto({
          items: [
            {
              productId: PRODUCT_ID,
              quantity: 1,
              selectedOptionIds: [SMALL_OPTION_ID],
            },
          ],
        }),
      ),
    ).rejects.toThrow('Test Pizza has an invalid price configuration.');
  });

  it('rejects a phone number with no digits', async () => {
    await expect(
      service.createOrder(
        createOrderDto({
          customer: {
            name: 'Test Customer',
            email: 'customer@example.com',
            phone: '---',
          },
        }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

function getPersistedOrderInput(createMock: jest.Mock): PersistedOrderInput {
  const calls = createMock.mock.calls as Array<[{ data: PersistedOrderInput }]>;

  return calls[0][0].data;
}
