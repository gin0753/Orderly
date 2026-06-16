import { formatMoneyFromCents } from "@/lib/format-money";
import { AdminOrderItem } from "../../types";

type AdminOrderItemsSectionProps = {
  items: AdminOrderItem[];
};

export function AdminOrderItemsSection({ items }: AdminOrderItemsSectionProps) {
  return (
    <section>
      <h3 className="mb-3 text-sm font-bold">Items ({items.length})</h3>

      <div className="space-y-3">
        {items.map((item) => {
          const optionTotalCents = item.options.reduce(
            (total, option) => total + option.priceDeltaCentsSnapshot,
            0,
          );

          const baseUnitPriceCents = item.unitPriceCents - optionTotalCents;

          return (
            <div
              key={item.id}
              className="rounded-2xl border border-[var(--color-border)] p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-bold">{item.productNameSnapshot}</p>

                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    {item.sizeNameSnapshot ? `${item.sizeNameSnapshot} · ` : ""}
                    Qty {item.quantity}
                  </p>

                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    {formatMoneyFromCents(item.unitPriceCents)} each
                  </p>
                </div>

                <p className="font-bold">
                  {formatMoneyFromCents(item.lineTotalCents)}
                </p>
              </div>

              {item.options.length > 0 ? (
                <div className="mt-3 space-y-2 border-t border-[var(--color-border-soft)] pt-3">
                  <div className="flex justify-between text-sm text-[var(--color-text-secondary)]">
                    <span>Base item</span>
                    <span>{formatMoneyFromCents(baseUnitPriceCents)} each</span>
                  </div>

                  {item.options.map((option) => (
                    <div
                      key={option.id}
                      className="flex justify-between text-sm text-[var(--color-text-secondary)]"
                    >
                      <span>+ {option.optionNameSnapshot}</span>
                      <span>
                        +
                        {formatMoneyFromCents(
                          option.priceDeltaCentsSnapshot * item.quantity,
                        )}{" "}
                        total
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
