import { PrismaClient, OptionGroupType, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  await prisma.orderItemOption.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.productOption.deleteMany();
  await prisma.productOptionGroup.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.storeSettings.deleteMany();

  await prisma.storeSettings.create({
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

  const passwordHash = await bcrypt.hash('Password123!', 10);

  await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@orderly.dev',
      passwordHash,
      role: UserRole.ADMIN,
    },
  });

  const pizza = await prisma.category.create({
    data: {
      name: 'Pizza',
      slug: 'pizza',
      sortOrder: 1,
      products: {
        create: [
          {
            name: 'Margherita Pizza',
            description:
              'Classic tomato base with mozzarella, basil and olive oil.',
            basePrice: '14.90',
            sortOrder: 1,
            optionGroups: {
              create: [
                {
                  name: 'Size',
                  type: OptionGroupType.SINGLE,
                  isRequired: true,
                  minSelect: 1,
                  maxSelect: 1,
                  sortOrder: 1,
                  options: {
                    create: [
                      { name: 'Small', priceDelta: '0.00', sortOrder: 1 },
                      { name: 'Medium', priceDelta: '3.00', sortOrder: 2 },
                      { name: 'Large', priceDelta: '6.00', sortOrder: 3 },
                    ],
                  },
                },
                {
                  name: 'Crust',
                  type: OptionGroupType.SINGLE,
                  isRequired: true,
                  minSelect: 1,
                  maxSelect: 1,
                  sortOrder: 2,
                  options: {
                    create: [
                      { name: 'Classic', priceDelta: '0.00', sortOrder: 1 },
                      { name: 'Thin', priceDelta: '0.00', sortOrder: 2 },
                      {
                        name: 'Cheese Crust',
                        priceDelta: '3.00',
                        sortOrder: 3,
                      },
                    ],
                  },
                },
                {
                  name: 'Extras',
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
                        sortOrder: 1,
                      },
                      { name: 'Mushroom', priceDelta: '2.00', sortOrder: 2 },
                      { name: 'Pepperoni', priceDelta: '3.00', sortOrder: 3 },
                      { name: 'Olives', priceDelta: '1.50', sortOrder: 4 },
                    ],
                  },
                },
              ],
            },
          },
          {
            name: 'Pepperoni Pizza',
            description: 'Tomato base, mozzarella and crispy pepperoni slices.',
            basePrice: '16.90',
            sortOrder: 2,
          },
          {
            name: 'BBQ Chicken Pizza',
            description:
              'BBQ sauce, roasted chicken, red onion and mozzarella.',
            basePrice: '18.90',
            sortOrder: 3,
          },
        ],
      },
    },
  });

  await prisma.category.create({
    data: {
      name: 'Pasta',
      slug: 'pasta',
      sortOrder: 2,
      products: {
        create: [
          {
            name: 'Creamy Carbonara',
            description:
              'Creamy sauce with bacon, parmesan and cracked pepper.',
            basePrice: '15.90',
            sortOrder: 1,
          },
          {
            name: 'Beef Bolognese',
            description:
              'Slow-cooked beef ragu with tomato sauce and parmesan.',
            basePrice: '16.90',
            sortOrder: 2,
          },
        ],
      },
    },
  });

  await prisma.category.create({
    data: {
      name: 'Sides',
      slug: 'sides',
      sortOrder: 3,
      products: {
        create: [
          {
            name: 'Garlic Bread',
            description: 'Toasted bread with garlic butter.',
            basePrice: '5.90',
            sortOrder: 1,
          },
          {
            name: 'Chicken Wings',
            description: 'Crispy wings served with dipping sauce.',
            basePrice: '9.90',
            sortOrder: 2,
          },
        ],
      },
    },
  });

  await prisma.category.create({
    data: {
      name: 'Drinks',
      slug: 'drinks',
      sortOrder: 4,
      products: {
        create: [
          {
            name: 'Coke',
            description: 'Classic Coca-Cola.',
            basePrice: '3.50',
            sortOrder: 1,
          },
          {
            name: 'Sprite',
            description: 'Lemon-lime soft drink.',
            basePrice: '3.50',
            sortOrder: 2,
          },
        ],
      },
    },
  });

  await prisma.category.create({
    data: {
      name: 'Desserts',
      slug: 'desserts',
      sortOrder: 5,
      products: {
        create: [
          {
            name: 'Tiramisu',
            description: 'Classic Italian coffee-flavoured dessert.',
            basePrice: '7.90',
            sortOrder: 1,
          },
        ],
      },
    },
  });

  console.log('Seed completed.');
  console.log('Admin login: admin@orderly.dev / Password123!');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
