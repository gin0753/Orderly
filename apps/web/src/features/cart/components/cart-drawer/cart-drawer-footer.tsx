import { Button } from "@/components/ui/button";
import { formatMoneyFromCents } from "@/lib/format-money";
import Link from "next/link";
import { closeCart } from "../../cart-slice";
import { useAppDispatch } from "@/store/hooks";

type CartDrawerFooterProps = {
  subtotalCents: number;
  onClearCart: () => void;
  checkoutAvailability: "checking" | "available" | "paused" | "unavailable";
};

export function CartDrawerFooter({
  subtotalCents,
  onClearCart,
  checkoutAvailability,
}: CartDrawerFooterProps) {
  const dispatch = useAppDispatch();
  return (
    <div className="shrink-0 border-t border-[var(--color-border-soft)] bg-[var(--color-surface)] px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-5">
      <div className="flex items-center justify-between text-sm text-[var(--color-text-secondary)]">
        <span>Subtotal</span>

        <span className="font-semibold text-[var(--color-text-primary)]">
          {formatMoneyFromCents(subtotalCents)}
        </span>
      </div>

      <p className="mt-2 text-xs leading-5 text-[var(--color-text-muted)]">
        Delivery fee and final total will be calculated at checkout.
      </p>

      <div className="mt-5 grid gap-3">
        {checkoutAvailability === "available" ? (
          <Link
            href="/checkout"
            onClick={() => dispatch(closeCart())}
            className="flex h-13 w-full items-center justify-center rounded-2xl bg-[var(--color-brand-strong)] px-5 text-sm font-semibold text-[var(--color-text-inverse)] transition hover:bg-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2"
          >
            View Cart &amp; Checkout
          </Link>
        ) : (
          <button
            type="button"
            disabled
            aria-describedby="cart-checkout-status"
            className="flex h-13 w-full cursor-not-allowed items-center justify-center rounded-2xl bg-[var(--color-surface-disabled)] px-5 text-sm font-semibold text-[var(--color-text-muted)]"
          >
            {checkoutAvailability === "checking"
              ? "Checking availability…"
              : checkoutAvailability === "paused"
                ? "Ordering paused"
                : "Checkout unavailable"}
          </button>
        )}

        {checkoutAvailability !== "available" ? (
          <p
            id="cart-checkout-status"
            role="status"
            className="text-center text-xs leading-5 text-[var(--color-text-muted)]"
          >
            {checkoutAvailability === "paused"
              ? "You can edit your cart while ordering is paused."
              : checkoutAvailability === "checking"
                ? "Confirming the kitchen is accepting orders."
                : "We couldn’t confirm checkout availability. Close and reopen the cart to try again."}
          </p>
        ) : null}

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClearCart}
          className="text-[var(--color-text-muted)] hover:text-[var(--color-danger-strong)]"
        >
          Clear cart
        </Button>
      </div>
    </div>
  );
}
