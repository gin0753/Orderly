ALTER TABLE "CustomerUser" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);
CREATE TABLE "CustomerPendingRegistration" (
  "email" VARCHAR(160) NOT NULL,
  "tokenHash" CHAR(64) NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "lastSentAt" TIMESTAMP(3) NOT NULL,
  "windowStartedAt" TIMESTAMP(3) NOT NULL,
  "sendCount" INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT "CustomerPendingRegistration_pkey" PRIMARY KEY ("email")
);
CREATE UNIQUE INDEX "CustomerPendingRegistration_tokenHash_key" ON "CustomerPendingRegistration"("tokenHash");
CREATE INDEX "CustomerPendingRegistration_expiresAt_idx" ON "CustomerPendingRegistration"("expiresAt");
