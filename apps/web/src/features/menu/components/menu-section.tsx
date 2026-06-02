import { ProductCard } from "./product-card";
import type { MenuCategory } from "../types";

type MenuSectionProps = {
  category: MenuCategory;
};

export function MenuSection({ category }: MenuSectionProps) {
  return (
    <section>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">
            {category.name}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {category.products.length} items available
          </p>
        </div>
      </div>

      {category.products.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {category.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          No products available in this category.
        </div>
      )}
    </section>
  );
}
