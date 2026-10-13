import { PrismaClient } from "../../apps/api/node_modules/@prisma/client";
import bcrypt from "../../apps/api/node_modules/bcrypt";
import { createCatalogCategories } from "../../apps/api/prisma/catalog-data";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
require("../../apps/api/test/test-database-url.cjs").assertDestructiveTestDatabaseAllowed(
  process.env,
);
const db = new PrismaClient();
async function main() {
  if (await db.category.count())
    throw new Error("Portfolio seed requires an empty guarded test database.");
  await db.storeSettings.create({
    data: {
      id: "default",
      storeName: "Orderly Kitchen",
      isAcceptingOrders: true,
      pickupEnabled: true,
      deliveryEnabled: true,
      deliveryFee: "5.00",
    },
  });
  for (const data of createCatalogCategories())
    await db.category.create({ data });
  const catalogTime = new Date("2026-10-13T01:00:00.000Z");
  await db.product.updateMany({
    data: { createdAt: catalogTime, updatedAt: catalogTime },
  });
  await db.category.updateMany({
    data: { createdAt: catalogTime, updatedAt: catalogTime },
  });
  await db.adminUser.create({
    data: {
      email: "portfolio.admin@orderly.test",
      passwordHash: await bcrypt.hash(process.env.PORTFOLIO_PASSWORD!, 12),
      role: "ADMIN",
    },
  });
  const customer = await db.customerUser.create({
    data: {
      email: "alex@portfolio.test",
      name: "Alex Morgan",
      phone: "0400 000 000",
      passwordHash: await bcrypt.hash(process.env.PORTFOLIO_PASSWORD!, 12),
      emailVerifiedAt: null,
    },
  });
  const product = await db.product.findFirstOrThrow({
    where: { name: "Margherita" },
  });
  const statuses = [
    "PENDING",
    "ACCEPTED",
    "PREPARING",
    "READY",
    "COMPLETED",
    "CANCELLED",
  ] as const;
  for (let i = 0; i < 12; i++)
    await db.order.create({
      data: {
        orderNumber: String(2101 + i),
        status: statuses[i % 6],
        orderType: i % 2 ? "DELIVERY" : "PICKUP",
        customerUserId: customer.id,
        customerName: ["Alex Morgan", "Jamie Chen", "Sam Taylor", "Jordan Lee"][
          i % 4
        ],
        customerEmail: "alex@portfolio.test",
        customerPhone: "0400 000 000",
        addressLine1: i % 2 ? "10 Example Street" : null,
        city: i % 2 ? "Sydney" : null,
        state: i % 2 ? "NSW" : null,
        postcode: i % 2 ? "2000" : null,
        subtotalCents: 2980,
        deliveryFeeCents: i % 2 ? 500 : 0,
        totalCents: i % 2 ? 3480 : 2980,
        createdAt: new Date(Date.UTC(2026, 9, 13, 1, 30 - i * 4)),
        updatedAt: new Date(Date.UTC(2026, 9, 13, 1, 30 - i * 4)),
        items: {
          create: {
            productId: product.id,
            productNameSnapshot: product.name,
            productImageUrlSnapshot: product.imageUrl,
            sizeNameSnapshot: 'Small (9")',
            quantity: 2,
            unitPriceCents: 1490,
            lineTotalCents: 2980,
          },
        },
      },
    });
}
main().finally(() => db.$disconnect());
