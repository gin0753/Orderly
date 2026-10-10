import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Ref } from "react";

type CartDrawerHeaderProps = {
  itemCount: number;
  isEmpty: boolean;
  onClose: () => void;
  closeButtonRef?: Ref<HTMLButtonElement>;
};

export function CartDrawerHeader({
  itemCount,
  isEmpty,
  onClose,
  closeButtonRef,
}: CartDrawerHeaderProps) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-4 bg-[var(--color-brand-surface)] px-5 py-4 text-[var(--color-on-brand)]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-ring-on-brand)]">
          Orderly
        </p>

        <h2
          id="cart-drawer-title"
          className="mt-1 text-[length:var(--text-section-title)] font-bold tracking-tight"
        >
          Your Cart
        </h2>

        {!isEmpty ? (
          <p className="mt-1 text-xs text-[var(--color-on-brand-secondary)]">
            {itemCount} {itemCount === 1 ? "item" : "items"} ready to review
          </p>
        ) : null}
      </div>

      <Button
        ref={closeButtonRef}
        type="button"
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="transaction-cart-close size-11 shrink-0 bg-[var(--color-brand-surface-raised)] text-[var(--color-on-brand)] hover:bg-[var(--color-brand-surface-raised)]"
        aria-label="Close cart"
      >
        <X className="h-5 w-5" />
      </Button>
    </div>
  );
}
