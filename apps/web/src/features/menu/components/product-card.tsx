"use client";

import { MenuProduct } from "../types";
import { formatMoneyFromCents } from "@/lib/format-money";
import Image from "next/image";

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
  return (
    <article
      onClick={() => onProductSelect(product)}
      className="group cursor-pointer overflow-hidden rounded-3xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--color-surface-muted)]">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-[var(--color-text-subtle)]">
            No image
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
          {product.name}
        </h3>

        {product.description ? (
          <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-[var(--color-text-secondary)]">
            {product.description}
          </p>
        ) : null}

        <div className="mt-5 flex items-center justify-between gap-4">
          <p className="text-sm font-bold text-[var(--color-text-primary)]">
            {formatMoneyFromCents(product.priceCents)}
          </p>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onQuickAdd(product);
            }}
            className="rounded-xl bg-[var(--color-brand)] px-4 py-2 text-xs font-semibold text-[var(--color-text-inverse)] transition hover:bg-[var(--color-brand-hover)]"
          >
            + Add
          </button>
        </div>
      </div>
    </article>
  );
}
