import { Button } from "@/components/ui/button";
import { formatMoneyFromCents } from "@/lib/format-money";

type CartDrawerFooterProps = {
  subtotalCents: number;
  onClearCart: () => void;
};

export function CartDrawerFooter({
  subtotalCents,
  onClearCart,
}: CartDrawerFooterProps) {
  return (
    <footer className="shrink-0 border-t border-[var(--color-border-soft)] bg-[var(--color-surface)] px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-5">
      <div className="flex items-center justify-between text-sm text-[var(--color-text-secondary)]">
        <span>Subtotal</span>

        <span className="font-semibold text-[var(--color-text-primary)]">
          {formatMoneyFromCents(subtotalCents)}
        </span>
      </div>

      <p className="mt-2 text-xs leading-5 text-[var(--color-text-subtle)]">
        Delivery fee and final total will be calculated at checkout.
      </p>

      <div className="mt-5 grid gap-3">
        <Button
          type="button"
          variant="brand"
          size="lg"
          className="w-full rounded-2xl"
        >
          View Cart & Checkout
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClearCart}
          className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
        >
          Clear cart
        </Button>
      </div>
    </footer>
  );
}
