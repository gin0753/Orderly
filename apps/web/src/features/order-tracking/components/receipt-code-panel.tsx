"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { clearTrackingLookup, getTrackingLookup, type StoredTrackingLookup } from "../utils/order-tracking-storage";

export function ReceiptCodePanel({ orderNumber }: { orderNumber: string }) {
  const [receipt, setReceipt] = useState<StoredTrackingLookup | null>(null);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = getTrackingLookup();
      setReceipt(stored?.orderNumber === orderNumber ? stored : null);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [orderNumber]);

  async function copy() {
    try {
      if (!navigator.clipboard || !receipt?.receiptCode) throw new Error();
      await navigator.clipboard.writeText(receipt.receiptCode);
      setMessage("Receipt code copied. Save it somewhere private.");
    } catch { setMessage("Copy is unavailable. Select the receipt code and save it somewhere private."); }
  }

  return <section aria-labelledby="receipt-heading" className="mt-6 w-full min-w-0 rounded-[var(--radius-card)] border border-[var(--color-border)] p-4 text-left">
    <h2 id="receipt-heading" className="font-bold">Save your receipt code</h2>
    <p className="mt-2 text-sm text-[var(--color-text-secondary)]">The code grants tracking access for 30 days. Keep it private. Lost, expired or revoked codes cannot be recovered online. Signed-in owners can use their account.</p>
    {receipt?.receiptCode ? <>
      <label htmlFor="saved-receipt-code" className="mt-3 block text-sm font-medium">Receipt code</label>
      <textarea id="saved-receipt-code" readOnly autoComplete="off" spellCheck={false} data-private="true" className="mt-2 w-full resize-none break-all rounded-lg border border-[var(--color-border)] p-3 font-mono text-sm" value={receipt.receiptCode} />
      <div className="mt-3 flex flex-wrap gap-3">
        <Button type="button" onClick={() => void copy()}>Copy receipt code</Button>
        <Button type="button" variant="secondary" onClick={() => { clearTrackingLookup(); setReceipt(null); setMessage("Receipt forgotten on this tab. Your saved copy is still valid."); }}>Forget on this tab</Button>
      </div>
    </> : <p className="mt-3 text-sm">No receipt code is available in this tab. Use your saved code to track, or sign in to the account that placed the order.</p>}
    <p role="status" className="mt-2 text-sm">{message}</p>
  </section>;
}
