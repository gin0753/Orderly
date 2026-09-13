import 'dotenv/config';

import {
  OptionGroupType,
  Prisma,
  PrismaClient,
  ProductOptionGroupKind,
} from '@prisma/client';

const prisma = new PrismaClient();

function createPizzaOptionGroups(): Prisma.ProductOptionGroupCreateWithoutProductInput[] {
  return [
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
            isAvailable: true,
            isDefault: true,
            sortOrder: 1,
          },
          {
            name: 'Medium',
            priceDelta: '3.00',
            isAvailable: true,
            isDefault: false,
            sortOrder: 2,
          },
          {
            name: 'Large',
            priceDelta: '6.00',
            isAvailable: true,
            isDefault: false,
            sortOrder: 3,
          },
        ],
      },
    },
    {
      name: 'Crust',
      kind: ProductOptionGroupKind.MODIFIER,
      type: OptionGroupType.SINGLE,
      isRequired: true,
      minSelect: 1,
      maxSelect: 1,
      sortOrder: 2,
      options: {
        create: [
          {
            name: 'Classic',
            priceDelta: '0.00',
            isAvailable: true,
            isDefault: true,
            sortOrder: 1,
          },
          {
            name: 'Thin',
            priceDelta: '0.00',
            isAvailable: true,
            isDefault: false,
            sortOrder: 2,
          },
          {
            name: 'Cheese Crust',
            priceDelta: '3.00',
            isAvailable: true,
            isDefault: false,
            sortOrder: 3,
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
      maxSelect: 4,
      sortOrder: 3,
      options: {
        create: [
          {
            name: 'Extra Cheese',
            priceDelta: '2.00',
            isAvailable: true,
            isDefault: false,
            sortOrder: 1,
          },
          {
            name: 'Mushroom',
            priceDelta: '2.00',
            isAvailable: true,
            isDefault: false,
            sortOrder: 2,
          },
          {
            name: 'Pepperoni',
            priceDelta: '3.00',
            isAvailable: true,
            isDefault: false,
            sortOrder: 3,
          },
          {
            name: 'Olives',
            priceDelta: '1.50',
            isAvailable: true,
            isDefault: false,
            sortOrder: 4,
          },
        ],
      },
    },
  ];
}

async function main() {
  await prisma.$transaction(
    async (tx) => {
      const existingCategory = await tx.category.findFirst({
        select: { id: true },
      });
      const existingProduct = await tx.product.findFirst({
        select: { id: true },
      });

      if (existingCategory || existingProduct) {
        throw new Error(
          'Demo seed aborted: Category or Product records already exist. No changes were made.',
        );
      }

      const existingSettings = await tx.storeSettings.findUnique({
        where: { id: 'default' },
        select: { id: true },
      });

      if (!existingSettings) {
        await tx.storeSettings.create({
          data: {
            id: 'default',
            storeName: 'Orderly Pizza',
            isAcceptingOrders: true,
            pickupEnabled: true,
            deliveryEnabled: true,
            estimatedPreparationMinutes: 20,
            deliveryFee: '5.00',
            minimumOrderAmount: '0.00',
          },
        });
      }

      await tx.category.create({
        data: {
          name: 'Pizza',
          slug: 'pizza',
          description: 'Classic and signature pizzas.',
          sortOrder: 1,
          products: {
            create: [
              {
                name: 'Margherita Pizza',
                description:
                  'Classic tomato base with mozzarella, basil and olive oil.',
                basePrice: '14.90',
                isAvailable: true,
                sortOrder: 1,
                optionGroups: {
                  create: createPizzaOptionGroups(),
                },
              },
              {
                name: 'Pepperoni Pizza',
                description:
                  'Tomato base, mozzarella and crispy pepperoni slices.',
                basePrice: '16.90',
                isAvailable: true,
                sortOrder: 2,
                optionGroups: {
                  create: createPizzaOptionGroups(),
                },
              },
              {
                name: 'BBQ Chicken Pizza',
                description:
                  'BBQ sauce, roasted chicken, red onion and mozzarella.',
                basePrice: '18.90',
                isAvailable: true,
                sortOrder: 3,
                optionGroups: {
                  create: createPizzaOptionGroups(),
                },
              },
            ],
          },
        },
      });

      await tx.category.create({
        data: {
          name: 'Pasta',
          slug: 'pasta',
          description: 'Fresh pasta and Italian favourites.',
          sortOrder: 2,
          products: {
            create: [
              {
                name: 'Creamy Carbonara',
                description:
                  'Creamy sauce with bacon, parmesan and cracked pepper.',
                basePrice: '15.90',
                isAvailable: true,
                sortOrder: 1,
              },
              {
                name: 'Beef Bolognese',
                description:
                  'Slow-cooked beef ragu with tomato sauce and parmesan.',
                basePrice: '16.90',
                isAvailable: true,
                sortOrder: 2,
              },
            ],
          },
        },
      });

      await tx.category.create({
        data: {
          name: 'Sides',
          slug: 'sides',
          description: 'Sides, snacks and shareable dishes.',
          sortOrder: 3,
          products: {
            create: [
              {
                name: 'Garlic Bread',
                description: 'Toasted bread with garlic butter.',
                basePrice: '5.90',
                isAvailable: true,
                sortOrder: 1,
              },
              {
                name: 'Chicken Wings',
                description: 'Crispy wings served with dipping sauce.',
                basePrice: '9.90',
                isAvailable: true,
                sortOrder: 2,
              },
            ],
          },
        },
      });

      await tx.category.create({
        data: {
          name: 'Drinks',
          slug: 'drinks',
          description: 'Cold drinks and refreshments.',
          sortOrder: 4,
          products: {
            create: [
              {
                name: 'Coke',
                description: 'Classic Coca-Cola.',
                basePrice: '3.50',
                isAvailable: true,
                sortOrder: 1,
              },
              {
                name: 'Sprite',
                description: 'Lemon-lime soft drink.',
                basePrice: '3.50',
                isAvailable: true,
                sortOrder: 2,
              },
            ],
          },
        },
      });

      await tx.category.create({
        data: {
          name: 'Desserts',
          slug: 'desserts',
          description: 'Sweet treats and desserts.',
          sortOrder: 5,
          products: {
            create: [
              {
                name: 'Tiramisu',
                description: 'Classic Italian coffee-flavoured dessert.',
                basePrice: '7.90',
                isAvailable: true,
                sortOrder: 1,
              },
            ],
          },
        },
      });
    },
    {
      // Keep the empty-menu check and all inserts in one serializable operation.
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 30000,
    },
  );

  console.log('Demo seed completed.');
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
