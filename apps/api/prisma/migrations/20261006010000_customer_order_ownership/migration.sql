ALTER TABLE "Order" ADD COLUMN "customerUserId" UUID;

ALTER TABLE "Order" ADD CONSTRAINT "Order_customerUserId_fkey"
  FOREIGN KEY ("customerUserId") REFERENCES "CustomerUser"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Order_customerUserId_createdAt_id_idx"
  ON "Order"("customerUserId", "createdAt", "id");
CREATE INDEX "Order_customerUserId_status_createdAt_id_idx"
  ON "Order"("customerUserId", "status", "createdAt", "id");
CREATE INDEX "Order_customerUserId_totalCents_createdAt_id_idx"
  ON "Order"("customerUserId", "totalCents", "createdAt", "id");
