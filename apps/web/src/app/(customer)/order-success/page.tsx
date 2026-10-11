import Link from "next/link";
import type { Metadata } from "next";
import { Check, CircleAlert } from "lucide-react";

import { CustomerStatePanel } from "@/components/ui/customer-state-panel";
import { formatMoneyFromCents } from "@/lib/format-money";
import { buttonStyles } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Order received",
  description: "View your Orderly Kitchen order confirmation.",
};

type OrderSuccessPageProps = {
  searchParams: Promise<{
    orderNumber?: string;
    totalCents?: string;
    orderType?: string;
  }>;
};

export default async function OrderSuccessPage({
  searchParams,
}: OrderSuccessPageProps) {
  const params = await searchParams;

  const orderNumber = params.orderNumber;
  const orderType = params.orderType;
  const totalCents = Number(params.totalCents);

  const hasValidTotal = Number.isFinite(totalCents) && totalCents > 0;
  const hasValidOrderType = orderType === "PICKUP" || orderType === "DELIVERY";

  if (!orderNumber || !hasValidTotal || !hasValidOrderType) {
    return (
      <div className="mx-auto max-w-3xl"><CustomerStatePanel
        eyebrow="Order confirmation"
        title="Order details unavailable"
        description="We couldn’t open this confirmation. You can track an existing order or return to the menu."
        icon={<CircleAlert aria-hidden="true" className="size-7" />}
        actions={
          <>
            <Link
              href="/"
              className={buttonStyles({ size: "lg", className: "min-h-12 flex-1" })}
            >
              Browse menu
            </Link>
            <Link
              href="/track-order"
              className={buttonStyles({ variant: "secondary", size: "lg", className: "min-h-12 flex-1" })}
            >
              Track order
            </Link>
          </>
        }
      /></div>
    );
  }

  return (
    <div className="bg-[var(--color-background)] px-[var(--page-gutter)] py-8 lg:py-12">
      <div className="mx-auto flex max-w-2xl flex-col items-center rounded-[var(--radius-overlay)] bg-[var(--color-surface)] px-5 py-8 text-center shadow-[var(--shadow-surface)] sm:px-10 sm:py-10">
        <div aria-hidden="true" className="transaction-confirmation-mark flex size-14 items-center justify-center rounded-full bg-[var(--color-success-surface)] text-[var(--color-success-strong)]">
          <Check className="size-7" />
        </div>

        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-success-strong)]">
          Order received
        </p>

        <h1 className="mt-3 text-balance text-[length:var(--text-page-title)] font-bold leading-[var(--leading-page-title)] tracking-tight text-[var(--color-text-primary)]">
          Thanks, your order is in.
        </h1>

        <p className="mt-3 max-w-md text-sm leading-6 text-[var(--color-text-secondary)] sm:text-base">
          We&apos;ve received your order. Use order tracking for the latest
          status.
        </p>

        <div className="mt-6 w-full overflow-hidden rounded-[var(--radius-card)] bg-[var(--color-surface-muted)] text-left">
          <div className="bg-[var(--color-brand-surface)] px-5 py-5 text-[var(--color-on-brand)]">
            <p className="text-xs font-medium text-[var(--color-on-brand-secondary)]">Order number</p>
            <p className="mt-2 break-all text-3xl font-bold tracking-tight tabular-nums">#{orderNumber}</p>
          </div>

          <div className="grid gap-4 p-5 text-sm">
            <SummaryRow
              label="Fulfillment"
              value={orderType === "DELIVERY" ? "Delivery" : "Pickup"}
            />

            <SummaryRow
              label="Total"
              value={formatMoneyFromCents(totalCents)}
            />
          </div>
        </div>

        <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row">
          <Link
            href={`/track-order/${encodeURIComponent(orderNumber)}`}
            className={buttonStyles({ size: "lg", className: "min-h-12 flex-1" })}
          >
            Track your order
          </Link>

          <Link
            href="/"
            className={buttonStyles({ variant: "secondary", size: "lg", className: "min-h-12 flex-1" })}
          >
            Start another order
          </Link>
        </div>

      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-[var(--color-text-secondary)]">{label}</span>
      <span className="max-w-[65%] break-words text-right font-bold tabular-nums text-[var(--color-text-primary)]">
        {value}
      </span>
    </div>
  );
}
