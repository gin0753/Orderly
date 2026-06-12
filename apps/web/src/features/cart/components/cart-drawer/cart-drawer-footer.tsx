import { Button } from "@/components/ui/button";
import { formatMoneyFromCents } from "@/lib/format-money";
import Link from "next/link";
import { closeCart } from "../../cart-slice";
import { useAppDispatch } from "@/store/hooks";

type CartDrawerFooterProps = {
  subtotalCents: number;
  onClearCart: () => void;
};

export function CartDrawerFooter({
  subtotalCents,
  onClearCart,
}: CartDrawerFooterProps) {
  const dispatch = useAppDispatch();
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
        <Link
          href="/checkout"
          onClick={() => dispatch(closeCart())}
          className="mt-6 flex h-13 w-full items-center justify-center rounded-2xl bg-[var(--color-brand)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-hover)]"
        >
          View Cart & Checkout
        </Link>

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
