"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { addItem, openCart } from "@/features/cart/cart-slice";
import type {
  CartProductSnapshot,
  CartSelectedSize,
} from "@/features/cart/cart-types";
import {
  createCartItem,
  PRODUCT_ADD_ON_OPTIONS,
  PRODUCT_SIZE_OPTIONS,
} from "@/features/cart/cart-utils";
import { useScrollLock } from "@/hooks/use-scroll-lock";
import { formatMoneyFromCents } from "@/lib/format-money";
import { useAppDispatch } from "@/store/hooks";

import { ProductSizeOptions } from "./product-size-options";
import { ProductAddOnOptions } from "./product-add-on-options";

type ProductModalProps = {
  product: CartProductSnapshot;
  onClose: () => void;
};

export function ProductModal({ product, onClose }: ProductModalProps) {
  const dispatch = useAppDispatch();

  const [selectedSize, setSelectedSize] = useState<CartSelectedSize>("medium");
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);

  const imageUrl = product.imageUrl;

  useScrollLock();

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const selectedAddOns = useMemo(() => {
    return PRODUCT_ADD_ON_OPTIONS.filter((addOn) =>
      selectedAddOnIds.includes(addOn.id),
    );
  }, [selectedAddOnIds]);

  const unitPriceCents = useMemo(() => {
    const sizeDeltaCents =
      PRODUCT_SIZE_OPTIONS.find((option) => option.id === selectedSize)
        ?.priceDeltaCents ?? 0;

    const addOnsDeltaCents = selectedAddOns.reduce(
      (total, addOn) => total + addOn.priceDeltaCents,
      0,
    );

    return Math.max(0, product.priceCents + sizeDeltaCents + addOnsDeltaCents);
  }, [product.priceCents, selectedAddOns, selectedSize]);

  const itemTotalCents = unitPriceCents * quantity;

  function toggleAddOn(addOnId: string) {
    setSelectedAddOnIds((currentIds) => {
      if (currentIds.includes(addOnId)) {
        return currentIds.filter((id) => id !== addOnId);
      }

      return [...currentIds, addOnId];
    });
  }

  function handleAddToCart() {
    const cartItem = createCartItem({
      product,
      selectedSize,
      selectedAddOns,
      quantity,
    });

    dispatch(addItem(cartItem));
    dispatch(openCart());
    onClose();
  }

  return (
    <div className="animate-orderly-fade-in fixed inset-0 z-50 flex items-end justify-center bg-[var(--color-overlay)] px-4 py-6 backdrop-blur-sm md:items-center">
      <button
        type="button"
        aria-label="Close product modal"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />

      <div className="animate-orderly-slide-up relative z-10 flex h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl bg-[var(--color-surface)] shadow-2xl md:grid md:h-[calc(100vh-3rem)] md:max-h-[760px] md:grid-cols-[0.95fr_1.05fr] md:rounded-3xl">
        <div className="relative h-56 overflow-hidden bg-[var(--color-surface-muted)] md:h-full">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-[var(--color-text-subtle)]">
              No image
            </div>
          )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col md:h-full">
          <div className="min-h-0 flex-1 overflow-y-auto p-5 md:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-brand-text)]">
                  Customize your item
                </p>

                <h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
                  {product.name}
                </h2>

                <p className="mt-2 text-lg font-semibold text-[var(--color-text-primary)]">
                  {formatMoneyFromCents(product.priceCents)}
                </p>

                {product.description ? (
                  <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
                    {product.description}
                  </p>
                ) : null}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="-mr-2 -mt-2 shrink-0 bg-[var(--color-surface-glass)] text-[var(--color-text-muted)] backdrop-blur hover:text-[var(--color-text-primary)]"
                aria-label="Close product details"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <ProductSizeOptions
              selectedSize={selectedSize}
              onChange={setSelectedSize}
            />

            <ProductAddOnOptions
              selectedAddOnIds={selectedAddOnIds}
              onToggle={toggleAddOn}
            />

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

          <div className="shrink-0 border-t border-[var(--color-border-soft)] bg-[var(--color-surface)] p-5 md:p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <span className="text-sm text-[var(--color-text-secondary)]">
                Item total
              </span>

              <span className="text-lg font-bold text-[var(--color-text-primary)]">
                {formatMoneyFromCents(itemTotalCents)}
              </span>
            </div>

            <Button
              type="button"
              variant="brand"
              size="lg"
              onClick={handleAddToCart}
              className="w-full rounded-2xl"
            >
              Add to cart
              <span className="mx-1">·</span>
              {formatMoneyFromCents(itemTotalCents)}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
