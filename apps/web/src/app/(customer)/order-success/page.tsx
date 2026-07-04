import Link from "next/link";

import { formatMoneyFromCents } from "@/lib/format-money";

type OrderSuccessPageProps = {
  searchParams: Promise<{
    orderId?: string;
    totalCents?: string;
    orderType?: string;
  }>;
};

export default async function OrderSuccessPage({
  searchParams,
}: OrderSuccessPageProps) {
  const params = await searchParams;

  const orderId = params.orderId;
  const orderType = params.orderType;
  const totalCents = Number(params.totalCents);

  const hasValidTotal = Number.isFinite(totalCents) && totalCents > 0;

  return (
    <main className="min-h-screen bg-[var(--color-background)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-2xl flex-col items-center rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-14 text-center shadow-sm sm:px-10">
        <div className="flex size-16 items-center justify-center rounded-full bg-[var(--color-brand-soft)] text-3xl">
          ✓
        </div>

        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-brand-text)]">
          Order received
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-4xl">
          Thanks, your order is in.
        </h1>

        <p className="mt-4 max-w-md text-[var(--color-text-secondary)]">
          We&apos;ve received your order and the restaurant will start preparing
          it shortly.
        </p>

        <div className="mt-8 w-full rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-hover)] p-5 text-left">
          <div className="flex items-center justify-between gap-4 border-b border-[var(--color-border)] pb-4">
            <span className="text-sm text-[var(--color-text-secondary)]">
              Status
            </span>
            <span className="rounded-full bg-[var(--color-brand)] px-3 py-1 text-xs font-semibold text-[var(--color-text-inverse)]">
              Pending
            </span>
          </div>

          <div className="grid gap-4 pt-4 text-sm">
            {orderId ? <SummaryRow label="Order ID" value={orderId} /> : null}

            {orderType ? (
              <SummaryRow
                label="Fulfillment"
                value={orderType === "DELIVERY" ? "Delivery" : "Pickup"}
              />
            ) : null}

            {hasValidTotal ? (
              <SummaryRow
                label="Total"
                value={formatMoneyFromCents(totalCents)}
              />
            ) : null}

            <SummaryRow label="Payment" value="Unpaid" />
          </div>
        </div>

        <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl bg-[var(--color-brand)] px-6 text-sm font-semibold text-[var(--color-text-inverse)] transition hover:bg-[var(--color-brand-hover)]"
          >
            Start another order
          </Link>
        </div>

        <p className="mt-6 text-xs text-[var(--color-text-muted)]">
          Demo checkout only. Payment processing will be added in a later stage.
        </p>
      </div>
    </main>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-[var(--color-text-secondary)]">{label}</span>
      <span className="max-w-[65%] break-words text-right font-semibold text-[var(--color-text-primary)]">
        {value}
      </span>
    </div>
  );
}
