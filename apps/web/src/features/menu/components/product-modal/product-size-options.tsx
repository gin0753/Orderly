import { CartSelectedSize } from "@/features/cart/cart-types";
import { PRODUCT_SIZE_OPTIONS } from "@/features/cart/cart-utils";
import { cn } from "@/lib/cn";

type ProductSizeOptionsProps = {
  selectedSize: CartSelectedSize;
  onChange: (size: CartSelectedSize) => void;
};

export function ProductSizeOptions({
  selectedSize,
  onChange,
}: ProductSizeOptionsProps) {
  return (
    <section className="border-t border-[var(--color-border-soft)] pt-5">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
          Size
        </h3>

        <span className="text-xs text-[var(--color-text-muted)]">Required</span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3">
        {PRODUCT_SIZE_OPTIONS.map((option) => {
          const isSelected = selectedSize === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={cn(
                "cursor-pointer rounded-2xl border px-3 py-3 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:ring-inset",
                isSelected
                  ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)] text-[var(--color-text-primary)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface-hover)]",
              )}
            >
              <span className="block text-sm font-semibold">
                {option.label}
              </span>

              <span className="mt-1 block text-xs text-[var(--color-text-muted)]">
                {option.caption}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
