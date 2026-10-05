import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { createCatalogCategories } from './catalog-data';
import { assertDestructiveSeedAllowed } from './seed-safety';

assertDestructiveSeedAllowed(process.env);

const prisma = new PrismaClient();

async function main() {
  await prisma.customerSession.deleteMany();
  await prisma.customerUser.deleteMany();
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
      storeName: 'Orderly Kitchen',
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

  for (const data of createCatalogCategories()) {
    await prisma.category.create({ data });
  }

  console.log('Seed completed.');
}

main()
  .catch(() => {
    console.error(
      'Seed failed. Check the local database connection and schema; no database URL is logged.',
    );
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
