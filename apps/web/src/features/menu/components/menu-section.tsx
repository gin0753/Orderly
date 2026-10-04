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
    <section id={sectionId} className="mt-6 scroll-mt-36">
      <div className="mb-4 flex items-center">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            {title}
          </h2>

          {typeof itemCount === "number" ? (
            <span className="text-sm text-[var(--color-text-muted)]">
              {itemCount} items
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
