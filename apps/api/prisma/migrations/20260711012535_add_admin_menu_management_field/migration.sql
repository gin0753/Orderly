-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "archivedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ProductOption" ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ProductOptionGroup" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "Category_archivedAt_isActive_sortOrder_idx" ON "Category"("archivedAt", "isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "Product_categoryId_archivedAt_isAvailable_sortOrder_idx" ON "Product"("categoryId", "archivedAt", "isAvailable", "sortOrder");

-- CreateIndex
CREATE INDEX "ProductOption_optionGroupId_isAvailable_sortOrder_idx" ON "ProductOption"("optionGroupId", "isAvailable", "sortOrder");

-- CreateIndex
CREATE INDEX "ProductOptionGroup_productId_isActive_sortOrder_idx" ON "ProductOptionGroup"("productId", "isActive", "sortOrder");
