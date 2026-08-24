-- CreateEnum
CREATE TYPE "ProductOptionGroupKind" AS ENUM ('SIZE', 'MODIFIER', 'ADD_ON');

-- AlterTable
ALTER TABLE "ProductOptionGroup" ADD COLUMN     "kind" "ProductOptionGroupKind" NOT NULL DEFAULT 'MODIFIER';
