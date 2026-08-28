import {
  AdminRole,
  OptionGroupType,
  PrismaClient,
  ProductOptionGroupKind,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getSafeTestDatabaseUrl } = require('../test-database-url.cjs') as {
  getSafeTestDatabaseUrl: () => { url: string };
};

const { url } = getSafeTestDatabaseUrl();
const prisma = new PrismaClient({ datasourceUrl: url });

async function main() {
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

  await prisma.storeSettings.create({
    data: {
      id: 'default',
      storeName: 'Orderly Browser Test',
      isAcceptingOrders: true,
      pickupEnabled: true,
      deliveryEnabled: true,
      estimatedPreparationMinutes: 20,
      deliveryFee: '5.00',
      minimumOrderAmount: '0.00',
    },
  });

  await prisma.adminUser.create({
    data: {
      email: 'browser.admin@orderly.test',
      passwordHash: await bcrypt.hash('BrowserPassword123!', 10),
      role: AdminRole.ADMIN,
      isActive: true,
    },
  });

  await prisma.category.create({
    data: {
      name: 'Browser Test Pizza',
      slug: 'browser-test-pizza',
      sortOrder: 1,
      isActive: true,
      products: {
        create: {
          name: 'Golden Path Pizza',
          description: 'A deterministic pizza for the critical browser flow.',
          basePrice: '14.00',
          sortOrder: 1,
          isAvailable: true,
          optionGroups: {
            create: [
              {
                name: 'Size',
                kind: ProductOptionGroupKind.SIZE,
                type: OptionGroupType.SINGLE,
                isRequired: true,
                minSelect: 1,
                maxSelect: 1,
                sortOrder: 1,
                options: {
                  create: [
                    {
                      name: 'Small',
                      priceDelta: '0.00',
                      isDefault: true,
                      sortOrder: 1,
                    },
                    {
                      name: 'Large',
                      priceDelta: '4.00',
                      sortOrder: 2,
                    },
                  ],
                },
              },
              {
                name: 'Extras',
                kind: ProductOptionGroupKind.ADD_ON,
                type: OptionGroupType.MULTIPLE,
                isRequired: false,
                minSelect: 0,
                maxSelect: 2,
                sortOrder: 2,
                options: {
                  create: {
                    name: 'Extra Cheese',
                    priceDelta: '2.00',
                    sortOrder: 1,
                  },
                },
              },
            ],
          },
        },
      },
    },
  });
}

main()
  .then(() => console.log('Browser E2E fixtures seeded.'))
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
