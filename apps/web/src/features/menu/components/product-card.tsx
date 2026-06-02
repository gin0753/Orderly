import { formatMoneyFromCents } from "@/lib/format-money";
import type { MenuProduct } from "../types";

type ProductCardProps = {
  product: MenuProduct;
};

export function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative flex aspect-[4/3] items-center justify-center bg-stone-100">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-4xl shadow-sm">
            🍽️
          </div>
        )}

        {!product.isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
              Unavailable
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-base font-semibold leading-6 text-slate-950">
            {product.name}
          </h3>

          <span className="shrink-0 text-sm font-bold text-orange-600">
            {formatMoneyFromCents(product.priceCents)}
          </span>
        </div>

        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
          {product.description ?? "No description available."}
        </p>

        <button
          type="button"
          disabled={!product.isAvailable}
          className="mt-5 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Add to cart
        </button>
      </div>
    </article>
  );
}
