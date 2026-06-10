"use client";

import { useEffect } from "react";
import Image from "next/image";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
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
import { formatMoneyFromCents } from "@/lib/format-money";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useScrollLock } from "@/hooks/use-scroll-lock";

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
        <div className="flex items-center justify-between border-b border-[var(--color-border-soft)] px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
              Your Cart ({items.length})
            </h2>

            {!isEmpty ? (
              <button
                type="button"
                onClick={() => dispatch(clearCart())}
                className="mt-1 text-xs font-medium text-[var(--color-text-subtle)] transition hover:text-[var(--color-text-strong)]"
              >
                Clear cart
              </button>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => dispatch(closeCart())}
            className="rounded-full p-2 text-2xl leading-none text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {isEmpty ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-surface-muted)] text-2xl">
              🛒
            </div>

            <h3 className="mt-5 text-lg font-bold text-[var(--color-text-primary)]">
              Your cart is empty
            </h3>

            <p className="mt-2 max-w-xs text-sm leading-6 text-[var(--color-text-muted)]">
              Looks like you have not added anything yet.
            </p>

            <button
              type="button"
              onClick={() => dispatch(closeCart())}
              className="mt-6 rounded-2xl bg-[var(--color-brand)] px-5 py-3 text-sm font-semibold text-[var(--color-text-inverse)] transition hover:bg-[var(--color-brand-hover)]"
            >
              Browse Menu
            </button>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.key}
                    className="grid grid-cols-[72px_1fr] gap-4 rounded-2xl border border-[var(--color-border-soft)] p-3"
                  >
                    <div className="relative h-[72px] w-[72px] overflow-hidden rounded-xl bg-[var(--color-surface-muted)]">
                      {item.product.imageUrl ? (
                        <Image
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="h-full w-full object-cover"
                        />
                      ) : null}
                    </div>

                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                            {item.product.name}
                          </h3>

                          <p className="mt-1 text-xs capitalize text-[var(--color-text-muted)]">
                            {item.selectedSize}
                            {item.selectedAddOns.length > 0
                              ? ` · ${item.selectedAddOns
                                  .map((addOn) => addOn.name)
                                  .join(", ")}`
                              : ""}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            dispatch(removeItem({ key: item.key }))
                          }
                          className="text-xs text-[var(--color-text-subtle)] transition hover:text-[var(--color-danger)]"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <QuantityStepper
                          value={item.quantity}
                          onChange={(nextQuantity) =>
                            dispatch(
                              updateQuantity({
                                key: item.key,
                                quantity: nextQuantity,
                              }),
                            )
                          }
                        />

                        <p className="text-sm font-bold text-[var(--color-text-primary)]">
                          {formatMoneyFromCents(
                            item.unitPriceCents * item.quantity,
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-[var(--color-border-soft)] px-5 py-5">
              <div className="flex items-center justify-between text-sm text-[var(--color-text-secondary)]">
                <span>Subtotal</span>
                <span className="font-semibold text-[var(--color-text-primary)]">
                  {formatMoneyFromCents(subtotalCents)}
                </span>
              </div>

              <p className="mt-2 text-xs text-[var(--color-text-subtle)]">
                Delivery fee and final total will be calculated at checkout.
              </p>

              <button
                type="button"
                className="mt-5 w-full rounded-2xl bg-[var(--color-brand)] px-5 py-4 text-sm font-semibold text-[var(--color-text-inverse)] transition hover:bg-[var(--color-brand-hover)]"
              >
                View Cart & Checkout
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
