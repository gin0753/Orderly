import { MenuProduct } from "../types";

import { ProductCard } from "./product-card";

type MenuSectionProps = {
  sectionId: string;
  title: string;
  itemCount?: number;
  products: MenuProduct[];
  onProductSelect: (product: MenuProduct, opener: HTMLElement) => void;
  onQuickAdd: (product: MenuProduct, opener: HTMLElement) => void;
  isAcceptingOrders?: boolean;
};

export function MenuSection({
  sectionId,
  title,
  itemCount,
  products,
  onProductSelect,
  onQuickAdd,
  isAcceptingOrders = true,
}: MenuSectionProps) {
  return (
    <section id={sectionId} className="mt-8 scroll-mt-36">
      <div className="mb-5 flex items-center">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="text-[length:var(--text-section-title)] font-bold tracking-tight text-[var(--color-text-primary)]">
            {title}
          </h2>

          {typeof itemCount === "number" ? (
            <span className="text-sm text-[var(--color-text-muted)]">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onProductSelect={onProductSelect}
            onQuickAdd={onQuickAdd}
            isAcceptingOrders={isAcceptingOrders}
          />
        ))}
      </div>
    </section>
  );
}
