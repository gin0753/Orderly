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
    <div className="mt-8 overflow-x-auto pb-2">
      <div className="flex min-w-max gap-3">
        <button
          type="button"
          onClick={() => onCategoryChange("all")}
          className={`cursor-pointer rounded-full px-5 py-3 text-sm font-semibold transition ${
            activeCategoryId === "all"
              ? "bg-[var(--color-brand)] text-[var(--color-text-inverse)] shadow-sm"
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
              onClick={() => onCategoryChange(category.id)}
              className={`cursor-pointer rounded-full px-5 py-3 text-sm font-semibold transition ${
                isActive
                  ? "bg-[var(--color-brand)] text-[var(--color-text-inverse)] shadow-sm"
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
  );
}
