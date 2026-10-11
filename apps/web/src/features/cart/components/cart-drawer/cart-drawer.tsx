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
import type { MenuResponse } from "@/features/menu/types";
import { CART_FEEDBACK_EVENT, type CartFeedback } from "../../utils/cart-feedback";

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
  const [notice, setNotice] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [latestMenu, setLatestMenu] = useState<MenuResponse | null>(null);
  const [checkoutAvailability, setCheckoutAvailability] =
    useState<CheckoutAvailability>("checking");

  const isOpen = useAppSelector(selectIsCartOpen);
  const items = useAppSelector(selectCartItems);
  const isEmpty = useAppSelector(selectIsCartEmpty);
  const subtotalCents = useAppSelector(selectCartSubtotalCents);

  function handleClose() {
    setNotice("");
    setAnnouncement("");
    setLatestMenu(null);
    setCheckoutAvailability("checking");
    dispatch(closeCart());
  }

  useScrollLock(isOpen);

  useEffect(() => {
    function receiveFeedback(event: Event) {
      const feedback = (event as CustomEvent<CartFeedback>).detail;
      if (feedback.kind === "add" || dialogRef.current?.open) setNotice(feedback.message);
    }
    window.addEventListener(CART_FEEDBACK_EVENT, receiveFeedback);
    return () => window.removeEventListener(CART_FEEDBACK_EVENT, receiveFeedback);
  }, []);

  useEffect(() => {
    // Mount an empty region in the active modal before changing its text.
    // Cancel pending updates on dismissal; ordinary reopen does not replay an add.
    let frame = window.requestAnimationFrame(() => {
      frame = window.requestAnimationFrame(() => {
        setAnnouncement(isOpen ? notice : "");
        if (!isOpen) setNotice("");
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isOpen, notice]);

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
        setLatestMenu(menu);
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
        <aside className="transaction-cart-panel absolute right-0 top-0 flex h-dvh w-full max-w-md flex-col bg-[var(--color-background)] shadow-[var(--shadow-overlay)]">
          <CartDrawerHeader
            itemCount={items.reduce((total, item) => total + item.quantity, 0)}
            isEmpty={isEmpty}
            closeButtonRef={closeRef}
            onClose={handleClose}
          />
          <p role="status" aria-live="polite" aria-atomic="true" className="transaction-cart-feedback min-h-12 shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3 text-sm leading-5 text-[var(--color-text-secondary)]">
            {announcement || <span aria-hidden="true">Review your items before checkout.</span>}
          </p>

          {isEmpty ? (
            <CartEmptyState
              onBrowseMenu={() => {
                handleClose();
                router.push("/");
              }}
            />
          ) : (
            <>
              <div className="transaction-cart-items min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
                <div className="space-y-3">
                  {items.map((item) => {
                    const currentProduct = latestMenu?.categories
                      .flatMap((category) => category.products)
                      .find((product) => product.id === item.product.id);
                    const unavailable = latestMenu !== null && (
                      !currentProduct?.isAvailable || item.selectedOptions.some((option) =>
                        !currentProduct.optionGroups.flatMap((group) => group.options)
                          .some((current) => current.id === option.id && current.isAvailable),
                      )
                    );
                    return (
                      <CartItemRow
                        key={item.key}
                        item={item}
                        unavailable={unavailable}
                        onRemove={() => {
                          dispatch(removeItem({ key: item.key }));
                          closeRef.current?.focus();
                        }}
                        onQuantityChange={(quantity) =>
                          dispatch(
                            updateQuantity({
                              key: item.key,
                              quantity,
                            }),
                          )
                        }
                      />
                    );
                  })}
                </div>
              </div>

              <CartDrawerFooter
                subtotalCents={subtotalCents}
                checkoutAvailability={checkoutAvailability}
                onClearCart={() => {
                  dispatch(clearCart());
                  closeRef.current?.focus();
                }}
              />
            </>
          )}
        </aside>
      ) : null}
    </dialog>
  );
}
