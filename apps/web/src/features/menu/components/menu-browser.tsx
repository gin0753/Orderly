"use client";

import { useMemo, useState } from "react";
import { CategoryTabs } from "./category-tabs";
import { EmptyMenuState } from "./empty-menu-state";
import { MenuSection } from "./menu-section";
import type { MenuCategory } from "../types";

type MenuBrowserProps = {
  categories: MenuCategory[];
};

export function MenuBrowser({ categories }: MenuBrowserProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");

  const visibleCategories = useMemo(() => {
    if (selectedCategoryId === "all") {
      return categories;
    }

    return categories.filter((category) => category.id === selectedCategoryId);
  }, [categories, selectedCategoryId]);

  if (categories.length === 0) {
    return <EmptyMenuState />;
  }

  return (
    <div className="mt-8">
      <CategoryTabs
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
      />

      <div className="mt-8 space-y-12">
        {visibleCategories.map((category) => (
          <MenuSection key={category.id} category={category} />
        ))}
      </div>
    </div>
  );
}
