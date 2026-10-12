-- Nullable metadata only: legacy orders receive no capability or ownership change.
ALTER TABLE "Order"
ADD COLUMN "receiptCapabilityHash" VARCHAR(64),
ADD COLUMN "receiptCapabilityExpiresAt" TIMESTAMP(3),
ADD COLUMN "receiptCapabilityRevokedAt" TIMESTAMP(3);
