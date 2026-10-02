import 'dotenv/config';

import { Prisma, PrismaClient } from '@prisma/client';

import { createCatalogCategories } from './catalog-data';

const prisma = new PrismaClient();

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
            storeName: 'Orderly Kitchen',
            isAcceptingOrders: true,
            pickupEnabled: true,
            deliveryEnabled: true,
            estimatedPreparationMinutes: 20,
            deliveryFee: '5.00',
            minimumOrderAmount: '0.00',
          },
        });
      }

      for (const data of createCatalogCategories()) {
        await tx.category.create({ data });
      }
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
    console.error(
      error instanceof Error &&
        error.message ===
          'Demo seed aborted: Category or Product records already exist. No changes were made.'
        ? error.message
        : 'Demo seed failed. Check database connectivity and schema; the transaction was rolled back.',
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
