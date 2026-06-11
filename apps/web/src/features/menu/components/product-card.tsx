"use client";

import Image from "next/image";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatMoneyFromCents } from "@/lib/format-money";

import type { MenuProduct } from "../types";

type ProductCardProps = {
  product: MenuProduct;
  onProductSelect: (product: MenuProduct) => void;
  onQuickAdd: (product: MenuProduct) => void;
};

export function ProductCard({
  product,
  onProductSelect,
  onQuickAdd,
}: ProductCardProps) {
  const price = formatMoneyFromCents(product.priceCents);

  return (
    <Card className="group overflow-hidden transition hover:-translate-y-0.5 hover:border-[var(--color-border-hover)] hover:shadow-md">
      <article>
        <button
          type="button"
          onClick={() => onProductSelect(product)}
          className="block w-full cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-inset"
          aria-label={`View ${product.name}`}
        >
          <div className="relative aspect-[4/3] overflow-hidden bg-[var(--color-surface-muted)]">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-[var(--color-text-muted)]">
                No image
              </div>
            )}
          </div>

          <div className="space-y-2 p-4 pb-3">
            <h3 className="line-clamp-1 text-sm font-bold text-[var(--color-text-primary)]">
              {product.name}
            </h3>

            {product.description ? (
              <p className="line-clamp-2 min-h-10 text-sm leading-5 text-[var(--color-text-secondary)]">
                {product.description}
              </p>
            ) : (
              <p className="min-h-10 text-sm leading-5 text-[var(--color-text-muted)]">
                View details and customize your order.
              </p>
            )}
          </div>
        </button>

        <div className="flex items-center justify-between gap-4 px-4 pb-4">
          <p className="text-sm font-bold text-[var(--color-text-primary)]">
            {price}
          </p>

          <Button
            type="button"
            variant="outlineBrand"
            size="sm"
            onClick={() => onQuickAdd(product)}
            className="hidden sm:inline-flex"
          >
            Add
          </Button>

          <Button
            type="button"
            variant="brand"
            size="icon"
            onClick={() => onQuickAdd(product)}
            className="sm:hidden"
            aria-label={`Quick add ${product.name}`}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </article>
    </Card>
  );
}
