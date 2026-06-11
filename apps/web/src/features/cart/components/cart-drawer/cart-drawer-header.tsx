import { X } from "lucide-react";

import { Button } from "@/components/ui/button";

type CartDrawerHeaderProps = {
  itemCount: number;
  isEmpty: boolean;
  onClose: () => void;
};

export function CartDrawerHeader({
  itemCount,
  isEmpty,
  onClose,
}: CartDrawerHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-[var(--color-border-soft)] px-5 py-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-brand-text)]">
          Orderly
        </p>

        <h2 className="mt-1 text-lg font-bold text-[var(--color-text-primary)]">
          Your Cart
        </h2>

        {!isEmpty ? (
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            {itemCount} {itemCount === 1 ? "item" : "items"} ready to review
          </p>
        ) : null}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
        aria-label="Close cart"
      >
        <X className="h-5 w-5" />
      </Button>
    </header>
  );
}
