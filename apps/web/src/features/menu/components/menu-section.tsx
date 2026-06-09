import { MenuProduct } from "../types";

import { ProductCard } from "./product-card";

type MenuSectionProps = {
  title: string;
  emoji?: string;
  itemCount?: number;
  products: MenuProduct[];
  onProductSelect: (product: MenuProduct) => void;
  onQuickAdd: (product: MenuProduct) => void;
};

export function MenuSection({
  title,
  emoji,
  itemCount,
  products,
  onProductSelect,
  onQuickAdd,
}: MenuSectionProps) {
  return (
    <section className="mt-10">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold tracking-tight text-neutral-950">
            {title} {emoji ? <span>{emoji}</span> : null}
          </h2>

          {typeof itemCount === "number" ? (
            <span className="text-sm text-neutral-500">{itemCount} items</span>
          ) : null}
        </div>

        <button
          type="button"
          className="text-sm font-semibold text-[#ff4d00] transition hover:text-orange-700"
        >
          See all
        </button>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onProductSelect={onProductSelect}
            onQuickAdd={onQuickAdd}
          />
        ))}
      </div>
    </section>
  );
}
