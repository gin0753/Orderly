/*
  Warnings:

  - You are about to drop the column `deliveryAddressLine1` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `deliveryFee` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `deliveryPostcode` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `deliverySuburb` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `note` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `orderNumber` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `subtotal` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `total` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `totalPrice` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `unitPriceSnapshot` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `priceDeltaSnapshot` on the `OrderItemOption` table. All the data in the column will be lost.
  - Added the required column `subtotalCents` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalCents` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Made the column `customerEmail` on table `Order` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `lineTotalCents` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitPriceCents` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priceDeltaCentsSnapshot` to the `OrderItemOption` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_productId_fkey";

-- DropForeignKey
ALTER TABLE "OrderItemOption" DROP CONSTRAINT "OrderItemOption_optionId_fkey";

-- DropIndex
DROP INDEX "Order_orderNumber_key";

-- DropIndex
DROP INDEX "Order_orderType_idx";

-- DropIndex
DROP INDEX "Order_paymentStatus_idx";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "deliveryAddressLine1",
DROP COLUMN "deliveryFee",
DROP COLUMN "deliveryPostcode",
DROP COLUMN "deliverySuburb",
DROP COLUMN "note",
DROP COLUMN "orderNumber",
DROP COLUMN "subtotal",
DROP COLUMN "total",
ADD COLUMN     "addressLine1" TEXT,
ADD COLUMN     "addressLine2" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "deliveryFeeCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "postcode" TEXT,
ADD COLUMN     "serviceFeeCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "subtotalCents" INTEGER NOT NULL,
ADD COLUMN     "totalCents" INTEGER NOT NULL,
ALTER COLUMN "customerEmail" SET NOT NULL;

-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "totalPrice",
DROP COLUMN "unitPriceSnapshot",
ADD COLUMN     "lineTotalCents" INTEGER NOT NULL,
ADD COLUMN     "productImageUrlSnapshot" TEXT,
ADD COLUMN     "sizeNameSnapshot" TEXT,
ADD COLUMN     "sizePriceCentsSnapshot" INTEGER,
ADD COLUMN     "unitPriceCents" INTEGER NOT NULL,
ALTER COLUMN "productId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "OrderItemOption" DROP COLUMN "priceDeltaSnapshot",
ADD COLUMN     "priceDeltaCentsSnapshot" INTEGER NOT NULL,
ALTER COLUMN "optionId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Order_customerEmail_idx" ON "Order"("customerEmail");

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItemOption" ADD CONSTRAINT "OrderItemOption_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "ProductOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;
