"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

import { ProductImage } from "@/components/ui/product-image";
import { Button } from "@/components/ui/button";
import { containDialogFocus } from "@/components/ui/dialog-focus";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { addItem, openCart } from "@/features/cart/cart-slice";
import { createCartItem } from "@/features/cart/cart-utils";
import { setCartOpener } from "@/features/cart/utils/cart-focus";
import type { MenuProduct } from "@/features/menu/types";
import { useScrollLock } from "@/hooks/use-scroll-lock";
import { formatMoneyFromCents } from "@/lib/format-money";
import { useAppDispatch } from "@/store/hooks";

import { ProductOptionGroup } from "./product-option-group";
import { useProductConfigurator } from "./hooks/use-product-configurator";

type ProductModalProps = {
  product: MenuProduct;
  isAcceptingOrders: boolean;
  opener: HTMLElement | null;
  onClose: () => void;
  onAddedToCart?: (name: string, quantity: number) => void;
};

export function ProductModal({
  product,
  isAcceptingOrders,
  opener,
  onClose,
  onAddedToCart,
}: ProductModalProps) {
  const dispatch = useAppDispatch();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const shouldRestoreFocusRef = useRef(true);
  const titleId = useId();
  const validationId = useId();

  const {
    selectedOptionIdsByGroup,
    selectedOptions,
    quantity,
    setQuantity,
    itemTotalCents,
    hasValidOptionSelections,
    selectOption,
  } = useProductConfigurator(product);

  useScrollLock();

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog?.isConnected) {
      return;
    }

    if (!dialog.open) {
      dialog.showModal();
    }

    closeRef.current?.focus();

    return () => {
      if (dialog.open) {
        dialog.close();
      }

      if (shouldRestoreFocusRef.current && opener?.isConnected) {
        opener.focus();
      }
    };
  }, [opener]);

  function handleAddToCart() {
    if (!hasValidOptionSelections || !isAcceptingOrders) {
      return;
    }

    const cartItem = createCartItem({
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        imageUrl: product.imageUrl,
        priceCents: product.priceCents,
      },
      selectedOptions,
      quantity,
    });

    shouldRestoreFocusRef.current = false;
    setCartOpener(opener);
    dispatch(addItem(cartItem));
    onAddedToCart?.(product.name, quantity);
    onClose();
    dispatch(openCart());
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={
        !isAcceptingOrders || !hasValidOptionSelections
          ? validationId
          : undefined
      }
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      onKeyDown={containDialogFocus}
      className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none border-0 bg-transparent p-0 text-[var(--color-text-primary)] backdrop:bg-[var(--color-overlay)] backdrop:backdrop-blur-sm"
    >
      <div
        className="flex h-full items-end justify-center md:items-center md:px-4 md:py-6"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            onClose();
          }
        }}
      >
        <div className="storefront-configurator relative flex h-[calc(100dvh-1rem)] w-full max-w-4xl flex-col overflow-hidden rounded-t-[var(--radius-overlay)] bg-[var(--color-background)] shadow-[var(--shadow-overlay)] md:grid md:h-[calc(100dvh-3rem)] md:max-h-[680px] md:grid-cols-2 md:rounded-[var(--radius-overlay)]">
          <Button
            ref={closeRef}
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute right-3 top-3 z-10 size-11 bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-sm"
            aria-label="Close product details"
          >
            <X className="h-5 w-5" />
          </Button>
          <div className="storefront-configurator-photo relative h-28 shrink-0 overflow-hidden bg-[var(--color-surface-muted)] md:h-full max-[359px]:h-24">
            <ProductImage
              src={product.imageUrl}
              alt={product.name}
              sizes="(min-width: 928px) 448px, (min-width: 768px) calc((100vw - 32px) / 2), 100vw"
              className="object-contain"
              priority
            />
          </div>

          <div className="flex min-h-0 flex-1 flex-col md:h-full">
            <div className="storefront-configurator-content min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 md:p-8">
              <div className="storefront-product-heading sticky -top-5 z-[1] -mx-5 border-b border-[var(--color-border)] bg-[var(--color-background)] px-5 pb-3 md:static md:mx-0 md:border-0 md:px-0 md:pr-10">
                <p className="hidden text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-brand-text)] md:block">
                  Customize your item
                </p>
                <h2
                  id={titleId}
                  className="text-[length:var(--text-section-title)] font-bold leading-tight tracking-tight text-[var(--color-text-primary)] md:mt-2"
                >
                  {product.name}
                </h2>
                <p className="mt-1 text-base font-semibold text-[var(--color-text-primary)] md:mt-2 md:text-lg">
                  <span className="mr-2 text-sm font-normal text-[var(--color-text-secondary)]">Base price</span>
                  {formatMoneyFromCents(product.priceCents)}
                </p>
              </div>
              {product.description ? (
                <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">
                  {product.description}
                </p>
              ) : null}

              {product.optionGroups.map((group) => (
                <ProductOptionGroup
                  key={group.id}
                  group={group}
                  selectedOptionIds={selectedOptionIdsByGroup[group.id] ?? []}
                  onSelect={(optionId) => selectOption(group, optionId)}
                />
              ))}

              <section className="mt-6 border-t border-[var(--color-border-soft)] pt-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                      Quantity
                    </h3>
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                      Choose how many you would like to add.
                    </p>
                  </div>
                  <QuantityStepper value={quantity} onChange={setQuantity} />
                </div>
              </section>
            </div>

            <div className="storefront-purchase-footer shrink-0 border-t border-[var(--color-border)] bg-[var(--color-surface)] p-5 md:p-6">
              <div role="status" aria-live="polite" aria-atomic="true" className="mb-3 flex items-center justify-between gap-4">
                <span className="text-sm text-[var(--color-text-secondary)]">
                  Item total
                </span>
                <span key={itemTotalCents} className="storefront-price-feedback text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
                  {formatMoneyFromCents(itemTotalCents)}
                </span>
              </div>

              <Button
                type="button"
                variant="brand"
                size="lg"
                disabled={!hasValidOptionSelections || !isAcceptingOrders}
                onClick={handleAddToCart}
                className="w-full rounded-2xl"
              >
                {isAcceptingOrders ? (
                  <>
                    Add to cart
                    <span className="mx-1">·</span>
                    {formatMoneyFromCents(itemTotalCents)}
                  </>
                ) : (
                  "Ordering paused"
                )}
              </Button>

              {!isAcceptingOrders ? (
                <p
                  id={validationId}
                  role="status"
                  className="mt-3 text-center text-xs text-[var(--color-warning-strong)]"
                >
                  You can inspect this item while ordering is paused.
                </p>
              ) : !hasValidOptionSelections ? (
                <p
                  id={validationId}
                  role="status"
                  className="mt-3 text-center text-xs text-[var(--color-text-muted)]"
                >
                  Complete all required selections before adding this item.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}
