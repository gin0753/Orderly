import {
  hashReceiptCode,
  issueReceiptCapability,
  RECEIPT_LIFETIME_MS,
  validReceiptCapability,
} from './receipt-capability';

describe('receipt capabilities', () => {
  const now = new Date('2026-10-11T00:00:00Z');
  const make = () => {
    const receipt = issueReceiptCapability(now);
    return { receipt, order: { ...receipt, receiptCapabilityRevokedAt: null } };
  };
  it('issues independent 256-bit codes with a hash and exact 30-day expiry', () => {
    const { receipt } = make();
    expect(/^[A-Za-z0-9_-]{43}$/.test(receipt.receiptCode)).toBe(true);
    expect(
      receipt.receiptCapabilityHash === hashReceiptCode(receipt.receiptCode),
    ).toBe(true);
    expect(receipt.receiptCapabilityHash === receipt.receiptCode).toBe(false);
    expect(
      receipt.receiptCode === issueReceiptCapability(now).receiptCode,
    ).toBe(false);
    expect(receipt.receiptCapabilityExpiresAt.getTime() - now.getTime()).toBe(
      RECEIPT_LIFETIME_MS,
    );
  });
  it('supports repeated access without consuming the receipt', () => {
    const { receipt, order } = make();
    expect(validReceiptCapability(receipt.receiptCode, order, now)).toBe(true);
    expect(validReceiptCapability(receipt.receiptCode, order, now)).toBe(true);
  });
  it('rejects wrong, malformed, expired, revoked and legacy capabilities', () => {
    const { receipt, order } = make();
    for (const code of ['', 'invalid', issueReceiptCapability(now).receiptCode])
      expect(validReceiptCapability(code, order, now)).toBe(false);
    expect(
      validReceiptCapability(
        receipt.receiptCode,
        order,
        order.receiptCapabilityExpiresAt,
      ),
    ).toBe(false);
    expect(
      validReceiptCapability(
        receipt.receiptCode,
        { ...order, receiptCapabilityRevokedAt: now },
        now,
      ),
    ).toBe(false);
    expect(
      validReceiptCapability(
        receipt.receiptCode,
        {
          receiptCapabilityHash: null,
          receiptCapabilityExpiresAt: null,
          receiptCapabilityRevokedAt: null,
        },
        now,
      ),
    ).toBe(false);
  });
});
