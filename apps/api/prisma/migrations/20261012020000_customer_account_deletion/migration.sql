ALTER TYPE "CustomerOAuthPurpose" ADD VALUE 'DELETE_ACCOUNT';
CREATE TABLE "CustomerDeletionGrant" (
  "id" UUID NOT NULL,
  "secretHash" CHAR(64) NOT NULL,
  "browserBindingHash" CHAR(64) NOT NULL,
  "customerUserId" UUID NOT NULL,
  "customerSessionId" UUID NOT NULL,
  "googleSubject" VARCHAR(255) NOT NULL,
  "purpose" "CustomerOAuthPurpose" NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CustomerDeletionGrant_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CustomerDeletionGrant_customerSessionId_fkey" FOREIGN KEY ("customerSessionId") REFERENCES "CustomerSession"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "CustomerDeletionGrant_secretHash_key" ON "CustomerDeletionGrant"("secretHash");
CREATE INDEX "CustomerDeletionGrant_expiresAt_idx" ON "CustomerDeletionGrant"("expiresAt");
CREATE TABLE "CustomerDeletedGoogleSubject" (
  "subjectHash" CHAR(64) NOT NULL,
  "deletedAt" TIMESTAMP(3) NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CustomerDeletedGoogleSubject_pkey" PRIMARY KEY ("subjectHash")
);
CREATE INDEX "CustomerDeletedGoogleSubject_expiresAt_idx" ON "CustomerDeletedGoogleSubject"("expiresAt");
