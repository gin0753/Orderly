"use client";

import { ProductImage } from "@/components/ui/product-image";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatMoneyFromCents } from "@/lib/format-money";

import type { MenuProduct } from "../types";

type ProductCardProps = {
  product: MenuProduct;
  onProductSelect: (product: MenuProduct, opener: HTMLElement) => void;
  onQuickAdd: (product: MenuProduct, opener: HTMLElement) => void;
  isAcceptingOrders?: boolean;
};

export function ProductCard({
  product,
  onProductSelect,
  onQuickAdd,
  isAcceptingOrders = true,
}: ProductCardProps) {
  const price = formatMoneyFromCents(product.priceCents);

  return (
    <Card variant="surface" className="storefront-product-card group overflow-hidden">
      <article>
        <button
          type="button"
          onClick={(event) => onProductSelect(product, event.currentTarget)}
          className="block w-full cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-inset"
          aria-label={`View ${product.name}`}
        >
          <div className="relative aspect-[3/2] overflow-hidden bg-[var(--color-surface-muted)] sm:aspect-[4/3]">
            <ProductImage
              src={product.imageUrl}
              alt={product.name}
              sizes="(min-width: 1152px) 255px, (min-width: 1024px) calc((100vw - 132px) / 4), (min-width: 640px) calc((100vw - 72px) / 2), calc(100vw - 34px)"
              className="storefront-product-image object-cover"
            />
          </div>

          <div className="space-y-1.5 px-4 pb-2 pt-3 sm:space-y-2 sm:pb-3 sm:pt-4">
            <h3 className="line-clamp-2 text-[length:var(--text-card-title)] font-bold leading-[var(--leading-card-title)] text-[var(--color-text-primary)]">
              {product.name}
            </h3>

            {product.description ? (
              <p className="line-clamp-2 text-sm leading-5 text-[var(--color-text-secondary)] sm:min-h-10">
                {product.description}
              </p>
            ) : (
              <p className="text-sm leading-5 text-[var(--color-text-muted)] sm:min-h-10">
                View details and customize your order.
              </p>
            )}
          </div>
        </button>

        <div className="flex items-center justify-between gap-4 px-4 pb-3 sm:pb-4">
          <p className="text-base font-bold tracking-tight text-[var(--color-text-primary)]">
            {product.optionGroups.length > 0 ? <span className="mr-1 text-xs font-medium text-[var(--color-text-secondary)]">Base</span> : null}
            {price}
          </p>

          <Button
            type="button"
            variant="outlineBrand"
            size="sm"
            onClick={(event) => onQuickAdd(product, event.currentTarget)}
            disabled={!isAcceptingOrders}
            className="hidden sm:inline-flex"
          >
            {isAcceptingOrders ? "Add" : "Paused"}
          </Button>

          <Button
            type="button"
            variant="brand"
            size="icon"
            onClick={(event) => onQuickAdd(product, event.currentTarget)}
            disabled={!isAcceptingOrders}
            className="sm:hidden"
            aria-label={
              isAcceptingOrders
                ? `Quick add ${product.name}`
                : `Ordering paused for ${product.name}`
            }
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </article>
    </Card>
  );
}
