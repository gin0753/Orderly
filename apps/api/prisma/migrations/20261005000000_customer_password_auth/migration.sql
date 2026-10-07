-- Customer identity is additive; existing identity and order tables are untouched.
CREATE TABLE "CustomerUser" (
    "id" UUID NOT NULL,
    "email" VARCHAR(160) NOT NULL,
    "passwordHash" TEXT,
    "googleSubject" VARCHAR(255),
    "name" VARCHAR(120),
    "phone" VARCHAR(40),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CustomerUser_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CustomerSession" (
    "id" UUID NOT NULL,
    "customerUserId" UUID NOT NULL,
    "refreshTokenHash" CHAR(64) NOT NULL,
    "refreshTokenVersion" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CustomerSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CustomerUser_email_key" ON "CustomerUser"("email");
CREATE UNIQUE INDEX "CustomerUser_googleSubject_key" ON "CustomerUser"("googleSubject");
CREATE INDEX "CustomerSession_customerUserId_idx" ON "CustomerSession"("customerUserId");
CREATE INDEX "CustomerSession_expiresAt_idx" ON "CustomerSession"("expiresAt");
ALTER TABLE "CustomerSession" ADD CONSTRAINT "CustomerSession_customerUserId_fkey"
    FOREIGN KEY ("customerUserId") REFERENCES "CustomerUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
