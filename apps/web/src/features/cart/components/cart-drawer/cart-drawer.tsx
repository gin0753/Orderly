"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

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
import { getCartOpener } from "@/features/cart/utils/cart-focus";
import { getMenu } from "@/features/menu/api/get-menu";
import { containDialogFocus } from "@/components/ui/dialog-focus";
import { useScrollLock } from "@/hooks/use-scroll-lock";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

import { CartDrawerFooter } from "./cart-drawer-footer";
import { CartDrawerHeader } from "./cart-drawer-header";
import { CartEmptyState } from "./cart-empty-state";
import { CartItemRow } from "./cart-item-row";

type CheckoutAvailability =
  | "checking"
  | "available"
  | "paused"
  | "unavailable";

export function CartDrawer() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const [checkoutAvailability, setCheckoutAvailability] =
    useState<CheckoutAvailability>("checking");

  const isOpen = useAppSelector(selectIsCartOpen);
  const items = useAppSelector(selectCartItems);
  const isEmpty = useAppSelector(selectIsCartEmpty);
  const subtotalCents = useAppSelector(selectCartSubtotalCents);

  function handleClose() {
    setCheckoutAvailability("checking");
    dispatch(closeCart());
  }

  useScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const dialog = dialogRef.current;

    if (!dialog?.isConnected) {
      return;
    }

    openerRef.current = getCartOpener();

    if (!dialog.open) {
      dialog.showModal();
    }

    closeRef.current?.focus();

    return () => {
      if (dialog.open) {
        dialog.close();
      }

      const opener = openerRef.current;

      if (opener?.isConnected) {
        opener.focus();
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || isEmpty) {
      return;
    }

    let isCurrent = true;
    void getMenu()
      .then((menu) => {
        if (!isCurrent) {
          return;
        }

        setCheckoutAvailability(
          menu.store?.isAcceptingOrders ? "available" : "paused",
        );
      })
      .catch(() => {
        if (isCurrent) {
          setCheckoutAvailability("unavailable");
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [isEmpty, isOpen]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="cart-drawer-title"
      onCancel={(event) => {
        event.preventDefault();
        handleClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
      onKeyDown={containDialogFocus}
      className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden border-0 bg-transparent p-0 text-[var(--color-text-primary)] backdrop:bg-[var(--color-overlay)] backdrop:backdrop-blur-sm"
    >
      {isOpen ? (
        <aside className="absolute right-0 top-0 flex h-dvh w-full max-w-md flex-col bg-[var(--color-surface)] shadow-2xl">
          <CartDrawerHeader
            itemCount={items.length}
            isEmpty={isEmpty}
            closeButtonRef={closeRef}
            onClose={handleClose}
          />

          {isEmpty ? (
            <CartEmptyState
              onBrowseMenu={() => {
                handleClose();
                router.push("/");
              }}
            />
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
                checkoutAvailability={checkoutAvailability}
                onClearCart={() => dispatch(clearCart())}
              />
            </>
          )}
        </aside>
      ) : null}
    </dialog>
  );
}
