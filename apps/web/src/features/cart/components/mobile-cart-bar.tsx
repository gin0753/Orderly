"use client";

import { ShoppingCart } from "lucide-react";

import {
  openCart,
  selectCartItemCount,
  selectCartSubtotalCents,
  selectIsCartEmpty,
} from "@/features/cart/cart-slice";
import { Button } from "@/components/ui/button";
import { formatMoneyFromCents } from "@/lib/format-money";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export function MobileCartBar() {
  const dispatch = useAppDispatch();

  const itemCount = useAppSelector(selectCartItemCount);
  const subtotalCents = useAppSelector(selectCartSubtotalCents);
  const isEmpty = useAppSelector(selectIsCartEmpty);

  if (isEmpty) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_30px_rgba(0,0,0,0.08)] md:hidden">
      <Button
        type="button"
        variant="brand"
        size="lg"
        onClick={() => dispatch(openCart())}
        className="w-full justify-between rounded-2xl px-5"
      >
        <span className="flex items-center gap-3">
          <span className="relative">
            <ShoppingCart className="h-5 w-5" />

            <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-text-primary)] px-1 text-xs font-bold text-[var(--color-text-inverse)]">
              {itemCount}
            </span>
          </span>

          <span>View cart</span>
        </span>

        <span>{formatMoneyFromCents(subtotalCents)}</span>
      </Button>
    </div>
  );
}
