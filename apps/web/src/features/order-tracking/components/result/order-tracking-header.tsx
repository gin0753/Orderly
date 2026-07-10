import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

import type { OrderTrackingResponse } from "../../types/order-tracking.types";
import {
  getEstimatedTimeLabel,
  isTerminalOrderStatus,
  ORDER_STATUS_BADGE_CLASS_NAMES,
  ORDER_STATUS_LABELS,
} from "../../utils/order-status-copy";
import { formatDateTime } from "../../utils/order-tracking-utils";

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
    <section className="mb-6 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 md:p-6">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)] md:text-4xl">
              Order #{order.orderNumber}
            </h1>

            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-bold",
                ORDER_STATUS_BADGE_CLASS_NAMES[order.status],
              )}
            >
              {ORDER_STATUS_LABELS[order.status]}
            </span>
          </div>

          <p className="mt-3 text-sm font-medium text-[var(--color-text-muted)]">
            {getEstimatedTimeLabel(order)}
          </p>

          <p className="mt-1 text-sm text-[var(--color-text-subtle)]">
            Placed {formatDateTime(order.createdAt)}
          </p>
        </div>

        <Button type="button" onClick={onRefresh} disabled={isRefreshing}>
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {!isTerminalStatus ? (
        <p className="mt-5 rounded-2xl bg-[var(--color-notice-background)] px-4 py-3 text-sm text-[var(--color-notice-foreground)]">
          We’ll refresh your order status every 30 seconds while it is active.
        </p>
      ) : null}
    </section>
  );
}
