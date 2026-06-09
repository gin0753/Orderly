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
      className="group cursor-pointer overflow-hidden rounded-3xl border border-neutral-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-neutral-400">
            No image
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-sm font-bold text-neutral-950">{product.name}</h3>

        {product.description ? (
          <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-neutral-600">
            {product.description}
          </p>
        ) : null}

        <div className="mt-5 flex items-center justify-between gap-4">
          <p className="text-sm font-bold text-neutral-950">
            {formatMoneyFromCents(product.priceCents)}
          </p>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onQuickAdd(product);
            }}
            className="rounded-xl bg-[#ff4d00] px-4 py-2 text-xs font-semibold text-white transition hover:bg-orange-600"
          >
            + Add
          </button>
        </div>
      </div>
    </article>
  );
}
