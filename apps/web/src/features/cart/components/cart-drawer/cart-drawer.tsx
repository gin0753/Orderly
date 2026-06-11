"use client";

import { useEffect } from "react";

import {
  clearCart,
  closeCart,
  removeItem,
  selectCartItems,
  selectCartSubtotalCents,
  selectIsCartEmpty,
  selectIsCartOpen,
  updateQuantity,
} from "@/features/cart/cart-slice";
import { useScrollLock } from "@/hooks/use-scroll-lock";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

import { CartDrawerFooter } from "./cart-drawer-footer";
import { CartDrawerHeader } from "./cart-drawer-header";
import { CartEmptyState } from "./cart-empty-state";
import { CartItemRow } from "./cart-item-row";

export function CartDrawer() {
  const dispatch = useAppDispatch();

  const isOpen = useAppSelector(selectIsCartOpen);
  const items = useAppSelector(selectCartItems);
  const isEmpty = useAppSelector(selectIsCartEmpty);
  const subtotalCents = useAppSelector(selectCartSubtotalCents);

  useScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        dispatch(closeCart());
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => window.removeEventListener("keydown", handleEscape);
  }, [dispatch, isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="animate-orderly-fade-in fixed inset-0 z-50 overflow-hidden bg-[var(--color-overlay)] backdrop-blur-sm">
      <button
        type="button"
        aria-label="Close cart drawer"
        className="absolute inset-0 cursor-default"
        onClick={() => dispatch(closeCart())}
      />

      <aside className="animate-orderly-slide-left absolute right-0 top-0 flex h-dvh w-full max-w-md flex-col bg-[var(--color-surface)] shadow-2xl">
        <CartDrawerHeader
          itemCount={items.length}
          isEmpty={isEmpty}
          onClose={() => dispatch(closeCart())}
        />

        {isEmpty ? (
          <CartEmptyState onBrowseMenu={() => dispatch(closeCart())} />
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <div className="space-y-3">
                {items.map((item) => (
                  <CartItemRow
                    key={item.key}
                    item={item}
                    onRemove={() => dispatch(removeItem({ key: item.key }))}
                    onQuantityChange={(quantity) =>
                      dispatch(
                        updateQuantity({
                          key: item.key,
                          quantity,
                        }),
                      )
                    }
                  />
                ))}
              </div>
            </div>

            <CartDrawerFooter
              subtotalCents={subtotalCents}
              onClearCart={() => dispatch(clearCart())}
            />
          </>
        )}
      </aside>
    </div>
  );
}
