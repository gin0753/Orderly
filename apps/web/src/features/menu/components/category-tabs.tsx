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
          className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
            activeCategoryId === "all"
              ? "bg-[#ff4d00] text-white shadow-sm"
              : "bg-neutral-100 text-neutral-800 hover:bg-neutral-200"
          }`}
        >
          All
          <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">
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
              className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
                isActive
                  ? "bg-[#ff4d00] text-white shadow-sm"
                  : "bg-neutral-100 text-neutral-800 hover:bg-neutral-200"
              }`}
            >
              {category.name}
              <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">
                {category.products.length}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
