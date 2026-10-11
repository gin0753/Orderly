"use client";

import type { MenuCategory } from "../types";

type CategoryTabsProps = {
  categories: MenuCategory[];
  activeCategoryId: string;
  onCategoryChange: (categoryId: string) => void;
};

export function CategoryTabs({
  categories,
  activeCategoryId,
  onCategoryChange,
}: CategoryTabsProps) {
  const totalProductCount = categories.reduce(
    (total, category) => total + category.products.length,
    0,
  );

  return (
    <div
      id="menu"
      role="group"
      aria-label="Filter menu by category"
      className="sticky top-16 z-30 scroll-mt-16 border-b border-[var(--color-border)] bg-[var(--color-background)] py-3"
    >
      <div className="overflow-x-auto px-1 py-1 [scrollbar-width:thin]">
        <div className="flex min-w-max gap-2.5">
          <button
            type="button"
            aria-pressed={activeCategoryId === "all"}
            onClick={() => onCategoryChange("all")}
            className={`storefront-category min-h-11 cursor-pointer rounded-full px-[1.125rem] text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-text-hover)] focus-visible:ring-offset-2 ${
              activeCategoryId === "all"
                ? "bg-[var(--color-brand-text-hover)] text-[var(--color-text-inverse)] shadow-sm"
                : "bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-disabled)]"
            }`}
          >
            All
            <span className="ml-2 rounded-full bg-[var(--color-surface)]/20 px-2 py-0.5 text-xs">
              {totalProductCount}
            </span>
          </button>

          {categories.map((category) => {
            const isActive = activeCategoryId === category.id;

            return (
              <button
                key={category.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => onCategoryChange(category.id)}
                className={`storefront-category min-h-11 cursor-pointer rounded-full px-[1.125rem] text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-text-hover)] focus-visible:ring-offset-2 ${
                  isActive
                    ? "bg-[var(--color-brand-text-hover)] text-[var(--color-text-inverse)] shadow-sm"
                    : "bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-disabled)]"
                }`}
              >
                {category.name}
                <span className="ml-2 rounded-full bg-[var(--color-surface)]/20 px-2 py-0.5 text-xs">
                  {category.products.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
