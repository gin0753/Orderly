CREATE TYPE "CustomerOAuthPurpose" AS ENUM ('SIGN_IN', 'CONNECT_GOOGLE');

CREATE TABLE "CustomerOAuthTransaction" (
    "id" UUID NOT NULL,
    "stateHash" CHAR(64) NOT NULL,
    "browserBindingHash" CHAR(64) NOT NULL,
    "nonceHash" CHAR(64) NOT NULL,
    "codeVerifier" TEXT NOT NULL,
    "purpose" "CustomerOAuthPurpose" NOT NULL,
    "returnPath" VARCHAR(512) NOT NULL,
    "customerSessionId" UUID,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerOAuthTransaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CustomerOAuthTransaction_stateHash_key" ON "CustomerOAuthTransaction"("stateHash");
CREATE INDEX "CustomerOAuthTransaction_expiresAt_idx" ON "CustomerOAuthTransaction"("expiresAt");

ALTER TABLE "CustomerOAuthTransaction" ADD CONSTRAINT "CustomerOAuthTransaction_customerSessionId_fkey"
    FOREIGN KEY ("customerSessionId") REFERENCES "CustomerSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
