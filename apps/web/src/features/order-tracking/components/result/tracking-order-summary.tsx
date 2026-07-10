import type { OrderTrackingResponse } from "../../types/order-tracking.types";
import { formatMoneyFromCents } from "../../utils/order-tracking-utils";
import Image from "next/image";

type TrackingOrderSummaryProps = {
  order: OrderTrackingResponse;
};

const getItemMeta = (item: OrderTrackingResponse["items"][number]) => {
  const labels = [
    item.sizeName,
    ...item.options.map((option) => option.name),
  ].filter(Boolean);

  return labels.length > 0 ? labels.join(" · ") : null;
};

export function TrackingOrderSummary({ order }: TrackingOrderSummaryProps) {
  return (
    <section className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 md:p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-[var(--color-text-primary)]">
            Order summary
          </h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {order.items.length} {order.items.length === 1 ? "item" : "items"}
          </p>
        </div>

        <span className="shrink-0 rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-xs font-semibold text-[var(--color-text-secondary)]">
          {order.orderType === "PICKUP" ? "Pickup" : "Delivery"}
        </span>
      </div>

      {order.items.length > 0 ? (
        <div className="divide-y divide-[var(--color-border)]">
          {order.items.map((item) => {
            const itemMeta = getItemMeta(item);

            return (
              <div key={item.id} className="flex gap-4 py-4 first:pt-0">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[var(--color-surface-muted)]">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-[var(--color-text-subtle)]">
                      Item
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-[var(--color-text-primary)]">
                        {item.name}
                      </h3>

                      {itemMeta ? (
                        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                          {itemMeta}
                        </p>
                      ) : null}

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
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 text-sm text-[var(--color-text-muted)]">
          No items found for this order.
        </div>
      )}

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
          <span>Service fee</span>
          <span>{formatMoneyFromCents(order.serviceFeeCents)}</span>
        </div>

        <div className="flex justify-between border-t border-[var(--color-border)] pt-4 text-lg font-bold text-[var(--color-text-primary)]">
          <span>Total</span>
          <span>{formatMoneyFromCents(order.totalCents)}</span>
        </div>
      </div>
    </section>
  );
}
