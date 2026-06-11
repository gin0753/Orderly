import { ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";

type CartEmptyStateProps = {
  onBrowseMenu: () => void;
};

export function CartEmptyState({ onBrowseMenu }: CartEmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-surface-muted)] text-[var(--color-brand)]">
        <ShoppingBag className="h-7 w-7" />
      </div>

      <h3 className="mt-5 text-lg font-bold text-[var(--color-text-primary)]">
        Your cart is empty
      </h3>

      <p className="mt-2 max-w-xs text-sm leading-6 text-[var(--color-text-muted)]">
        Looks like you have not added anything yet.
      </p>

      <Button
        type="button"
        variant="brand"
        size="lg"
        onClick={onBrowseMenu}
        className="mt-6 rounded-2xl px-6"
      >
        Browse menu
      </Button>
    </div>
  );
}
