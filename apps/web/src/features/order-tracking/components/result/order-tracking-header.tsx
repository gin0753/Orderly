import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

import type { OrderTrackingResponse } from "../../types/order-tracking.types";
import {
  getOrderStatusSummary,
  isTerminalOrderStatus,
  ORDER_STATUS_BADGE_CLASS_NAMES,
  ORDER_STATUS_LABELS,
} from "../../utils/order-status-copy";
import { formatDateTime } from "@/lib/format-date-time";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";

type OrderTrackingHeaderProps = {
  order: OrderTrackingResponse;
  isRefreshing: boolean;
  onRefresh: () => void;
};

export function OrderTrackingHeader({
  order,
  isRefreshing,
  onRefresh,
}: OrderTrackingHeaderProps) {
  const isTerminalStatus = isTerminalOrderStatus(order.status);

  return (
    <section aria-labelledby="tracking-order-heading" className="mb-6 rounded-[var(--radius-card)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-surface)] sm:p-8">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-brand-text)]">Your order status</p>
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 id="tracking-order-heading" tabIndex={-1} className="break-all text-[length:var(--text-page-title)] font-bold leading-[var(--leading-page-title)] tracking-tight text-[var(--color-text-primary)]">
              Order #{order.orderNumber}
            </h1>

            <span
              className={cn(
                "inline-flex items-center rounded-full px-3 py-1.5 text-sm font-bold",
                ORDER_STATUS_BADGE_CLASS_NAMES[order.status],
              )}
            >
              {ORDER_STATUS_LABELS[order.status]}
            </span>
          </div>

          <p className="mt-3 text-sm font-medium text-[var(--color-text-muted)]">
            {getOrderStatusSummary(order)}
          </p>

          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Placed <time dateTime={order.createdAt}>{formatDateTime(order.createdAt)}</time>
          </p>
        </div>

        <div className="flex flex-wrap gap-3"><Button variant="brandSoft" type="button" onClick={onRefresh} disabled={isRefreshing} aria-busy={isRefreshing}>
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </Button><Link href="/track-order" className={buttonStyles({ variant: "secondary" })}>Track another order</Link></div>
      </div>

      {!isTerminalStatus ? (
        <p className="mt-5 rounded-2xl bg-[var(--color-notice-background)] px-4 py-3 text-sm text-[var(--color-notice-foreground)]">
          We’ll refresh your order status every 30 seconds while it is active.
        </p>
      ) : null}
    </section>
  );
}
