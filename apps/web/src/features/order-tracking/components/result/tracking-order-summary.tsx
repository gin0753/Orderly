import type { OrderTrackingResponse } from "../../types/order-tracking.types";
import { formatMoneyFromCents } from "../../utils/order-tracking-utils";

type TrackingOrderSummaryProps = {
  order: OrderTrackingResponse;
};

export function TrackingOrderSummary({ order }: TrackingOrderSummaryProps) {
  return (
    <section className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 md:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-[var(--color-text-primary)]">
            Order summary
          </h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {order.items.length} {order.items.length === 1 ? "item" : "items"}
          </p>
        </div>

        <span className="rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-xs font-semibold text-[var(--color-text-secondary)]">
          {order.orderType === "PICKUP" ? "Pickup" : "Delivery"}
        </span>
      </div>

      <div className="space-y-4">
        {order.items.map((item) => (
          <div key={item.id} className="flex gap-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[var(--color-surface-muted)]">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-[var(--color-text-subtle)]">
                  Item
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                    {item.name}
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">
                    {item.sizeName ? item.sizeName : "Standard"}
                    {item.options.length > 0
                      ? ` · ${item.options
                          .map((option) => option.name)
                          .join(", ")}`
                      : ""}
                  </p>

                  <p className="mt-1 text-xs font-medium text-[var(--color-text-muted)]">
                    Qty {item.quantity}
                  </p>
                </div>

                <p className="shrink-0 text-sm font-bold text-[var(--color-text-primary)]">
                  {formatMoneyFromCents(item.lineTotalCents)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-3 border-t border-[var(--color-border)] pt-5">
        <div className="flex justify-between text-sm text-[var(--color-text-secondary)]">
          <span>Subtotal</span>
          <span>{formatMoneyFromCents(order.subtotalCents)}</span>
        </div>

        <div className="flex justify-between text-sm text-[var(--color-text-secondary)]">
          <span>Delivery fee</span>
          <span>
            {order.deliveryFeeCents > 0
              ? formatMoneyFromCents(order.deliveryFeeCents)
              : "Free"}
          </span>
        </div>

        <div className="flex justify-between text-sm text-[var(--color-text-secondary)]">
          <span>Tax</span>
          <span>{formatMoneyFromCents(order.taxCents)}</span>
        </div>

        <div className="flex justify-between border-t border-[var(--color-border)] pt-4 text-lg font-bold text-[var(--color-text-primary)]">
          <span>Total</span>
          <span>{formatMoneyFromCents(order.totalCents)}</span>
        </div>
      </div>
    </section>
  );
}
