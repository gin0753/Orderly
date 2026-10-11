import { formatMoneyFromCents } from "@/lib/format-money";
import type { OrderTrackingResponse } from "../../types/order-tracking.types";
import { ProductImage } from "@/components/ui/product-image";

type TrackingOrderSummaryProps = {
  order: OrderTrackingResponse;
};

const getItemMeta = (item: OrderTrackingResponse["items"][number]) => {
  const labels = [
    item.sizeName,
    ...item.options.map((option) => `${option.optionGroupName}: ${option.name}`),
  ].filter(Boolean);

  return labels.length > 0 ? labels.join(" · ") : null;
};

export function TrackingOrderSummary({ order }: TrackingOrderSummaryProps) {
  return (
    <section aria-labelledby="tracking-summary-heading" className="rounded-[var(--radius-card)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-surface)] sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 id="tracking-summary-heading" className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
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
        <ul className="divide-y divide-[var(--color-border)]">
          {order.items.map((item) => {
            const itemMeta = getItemMeta(item);

            return (
              <li key={item.id} className="flex gap-3 py-4 first:pt-0">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[var(--color-surface-muted)]">
                  <ProductImage
                    src={item.imageUrl}
                    alt=""
                    sizes="64px"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="break-words text-base font-bold text-[var(--color-text-primary)]">
                        {item.name}
                      </h3>

                      {itemMeta ? (
                        <p className="mt-1 break-words text-sm text-[var(--color-text-muted)]">
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
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 text-sm text-[var(--color-text-muted)]">
          No items found for this order.
        </div>
      )}

      <dl className="mt-6 space-y-3 border-t border-[var(--color-border)] pt-5 tabular-nums">
        <div className="flex justify-between text-sm text-[var(--color-text-secondary)]">
          <dt>Subtotal</dt>
          <dd>{formatMoneyFromCents(order.subtotalCents)}</dd>
        </div>

        <div className="flex justify-between text-sm text-[var(--color-text-secondary)]">
          <dt>Delivery fee</dt>
          <dd>
            {order.orderType === "PICKUP" ? "Not applicable" : order.deliveryFeeCents > 0
              ? formatMoneyFromCents(order.deliveryFeeCents)
              : "Free"}
          </dd>
        </div>

        <div className="flex justify-between text-sm text-[var(--color-text-secondary)]">
          <dt>Service fee</dt>
          <dd>{formatMoneyFromCents(order.serviceFeeCents)}</dd>
        </div>

        <div className="flex justify-between border-t border-[var(--color-border)] pt-4 text-lg font-bold text-[var(--color-text-primary)]">
          <dt>Total</dt>
          <dd>{formatMoneyFromCents(order.totalCents)}</dd>
        </div>
      </dl>
    </section>
  );
}
