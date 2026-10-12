import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export const RECEIPT_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;
export const RECEIPT_CODE_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function hashReceiptCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

export function issueReceiptCapability(now = new Date()) {
  const receiptCode = randomBytes(32).toString('base64url');
  return {
    receiptCode,
    receiptCapabilityHash: hashReceiptCode(receiptCode),
    receiptCapabilityExpiresAt: new Date(now.getTime() + RECEIPT_LIFETIME_MS),
  };
}

export function validReceiptCapability(
  code: string,
  order: {
    receiptCapabilityHash: string | null;
    receiptCapabilityExpiresAt: Date | null;
    receiptCapabilityRevokedAt: Date | null;
  },
  now = new Date(),
): boolean {
  if (
    !RECEIPT_CODE_PATTERN.test(code) ||
    !order.receiptCapabilityHash ||
    !/^[a-f0-9]{64}$/.test(order.receiptCapabilityHash) ||
    !order.receiptCapabilityExpiresAt ||
    order.receiptCapabilityExpiresAt <= now ||
    order.receiptCapabilityRevokedAt
  )
    return false;
  return timingSafeEqual(
    Buffer.from(hashReceiptCode(code), 'hex'),
    Buffer.from(order.receiptCapabilityHash, 'hex'),
  );
}
