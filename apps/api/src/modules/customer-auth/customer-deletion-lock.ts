import { Prisma } from '@prisma/client';

/** Serialize brief identity/owned-checkout transactions with deletion. No provider I/O under this lock. */
export async function lockCustomerDeletion(
  tx: Prisma.TransactionClient,
): Promise<void> {
  await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(192837465)`;
}
