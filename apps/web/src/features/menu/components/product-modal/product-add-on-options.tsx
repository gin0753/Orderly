import { PRODUCT_ADD_ON_OPTIONS } from "@/features/cart/cart-utils";
import { cn } from "@/lib/cn";
import { formatMoneyFromCents } from "@/lib/format-money";

type ProductAddOnOptionsProps = {
  selectedAddOnIds: string[];
  onToggle: (addOnId: string) => void;
};

export function ProductAddOnOptions({
  selectedAddOnIds,
  onToggle,
}: ProductAddOnOptionsProps) {
  return (
    <section className="mt-6 border-t border-[var(--color-border-soft)] pt-5">
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
        Add-ons{" "}
        <span className="font-normal text-[var(--color-text-subtle)]">
          Optional
        </span>
      </h3>

      <div className="mt-3 space-y-2">
        {PRODUCT_ADD_ON_OPTIONS.map((addOn) => {
          const isSelected = selectedAddOnIds.includes(addOn.id);

          return (
            <label
              key={addOn.id}
              className={cn(
                "flex cursor-pointer items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-sm transition",
                isSelected
                  ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface-hover)]",
              )}
            >
              <span className="flex items-center gap-3 text-[var(--color-text-primary)]">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggle(addOn.id)}
                  className="h-4 w-4 rounded border-[var(--color-border)] accent-[var(--color-brand)]"
                />

                <span className="font-medium">{addOn.name}</span>
              </span>

              <span className="text-[var(--color-text-muted)]">
                +{formatMoneyFromCents(addOn.priceDeltaCents)}
              </span>
            </label>
          );
        })}
      </div>
    </section>
  );
}
