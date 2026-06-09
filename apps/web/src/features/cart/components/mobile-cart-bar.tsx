"use client";

import {
  openCart,
  selectCartItemCount,
  selectCartSubtotalCents,
  selectIsCartEmpty,
} from "@/features/cart/cart-slice";
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
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-orange-600 bg-[#ff4d00] px-4 py-3 text-white shadow-2xl md:hidden">
      <button
        type="button"
        onClick={() => dispatch(openCart())}
        className="flex w-full items-center justify-between gap-4"
      >
        <span className="flex items-center gap-3 text-sm font-semibold">
          <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-white/20 px-2">
            {itemCount}
          </span>
          View Cart
        </span>

        <span className="text-sm font-bold">
          {formatMoneyFromCents(subtotalCents)}
        </span>
      </button>
    </div>
  );
}
