"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { addItem, openCart } from "@/features/cart/cart-slice";
import {
  CartProductSnapshot,
  CartSelectedSize,
} from "@/features/cart/cart-types";
import {
  createCartItem,
  PRODUCT_ADD_ON_OPTIONS,
  PRODUCT_SIZE_OPTIONS,
} from "@/features/cart/cart-utils";
import { formatMoneyFromCents } from "@/lib/format-money";
import { useAppDispatch } from "@/store/hooks";
import { useScrollLock } from "@/hooks/use-scroll-lock";

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

      <div className="animate-orderly-slide-up relative z-10 flex h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-[var(--color-surface)] shadow-2xl md:grid md:grid-cols-[1fr_1.05fr]">
        <div className="relative h-56 overflow-hidden bg-[var(--color-surface-muted)] md:h-full">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-[var(--color-text-subtle)]">
              No image
            </div>
          )}
        </div>

        <div className="flex min-h-0 flex-1 flex-col md:h-full">
          <div className="min-h-0 flex-1 overflow-y-auto p-6 md:p-8">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
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

              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 text-2xl leading-none text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="border-t border-[var(--color-border-soft)] pt-5">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Size
              </h3>

              <div className="mt-3 grid grid-cols-3 gap-3">
                {PRODUCT_SIZE_OPTIONS.map((option) => {
                  const isSelected = selectedSize === option.id;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setSelectedSize(option.id)}
                      className={`rounded-2xl border px-3 py-3 text-center transition ${
                        isSelected
                          ? "border-[#ff4d00] bg-[var(--color-brand-soft)] text-[var(--color-text-primary)]"
                          : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-strong)] hover:border-[var(--color-border-hover)]"
                      }`}
                    >
                      <span className="block text-sm font-semibold">
                        {option.label}
                      </span>
                      <span className="mt-1 block text-xs text-[var(--color-text-muted)]">
                        {option.caption}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 border-t border-[var(--color-border-soft)] pt-5">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Quantity
              </h3>

              <div className="mt-3">
                <QuantityStepper value={quantity} onChange={setQuantity} />
              </div>
            </div>

            <div className="mt-6 border-t border-[var(--color-border-soft)] pt-5">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Add-ons{" "}
                <span className="font-normal text-[var(--color-text-subtle)]">
                  (Optional)
                </span>
              </h3>

              <div className="mt-3 space-y-3">
                {PRODUCT_ADD_ON_OPTIONS.map((addOn) => {
                  const isSelected = selectedAddOnIds.includes(addOn.id);

                  return (
                    <label
                      key={addOn.id}
                      className="flex cursor-pointer items-center justify-between gap-4 rounded-xl py-1 text-sm text-[var(--color-text-strong)] transition hover:text-[var(--color-text-primary)]"
                    >
                      <span className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleAddOn(addOn.id)}
                          className="h-4 w-4 rounded border-neutral-300 accent-[#ff4d00]"
                        />
                        {addOn.name}
                      </span>

                      <span className="text-[var(--color-text-muted)]">
                        +{formatMoneyFromCents(addOn.priceDeltaCents)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="shrink-0 border-t border-[var(--color-border-soft)] bg-[var(--color-surface)] p-6 md:p-8">
            <button
              type="button"
              onClick={handleAddToCart}
              className="flex w-full items-center justify-center rounded-2xl bg-[var(--color-brand)] px-5 py-4 text-sm font-semibold text-[var(--color-text-inverse)] shadow-sm transition hover:bg-[var(--color-brand-hover)]"
            >
              Add to cart
              <span className="mx-2">·</span>
              {formatMoneyFromCents(unitPriceCents * quantity)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
