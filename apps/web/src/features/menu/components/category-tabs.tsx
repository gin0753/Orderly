import type { MenuCategory } from "../types";

type CategoryTabsProps = {
  categories: MenuCategory[];
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
};

export function CategoryTabs({
  categories,
  selectedCategoryId,
  onSelectCategory,
}: CategoryTabsProps) {
  const totalProductCount = categories.reduce(
    (total, category) => total + category.products.length,
    0,
  );

  return (
    <div
      className="sticky top-16 z-30 -mx-4 border-b border-slate-200 bg-slate-50/95 px-4 py-4 
      backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
    >
      <div className="flex gap-2 overflow-x-auto">
        <CategoryTab
          label="All"
          count={totalProductCount}
          isActive={selectedCategoryId === "all"}
          onClick={() => onSelectCategory("all")}
        />

        {categories.map((category) => (
          <CategoryTab
            key={category.id}
            label={category.name}
            count={category.products.length}
            isActive={selectedCategoryId === category.id}
            onClick={() => onSelectCategory(category.id)}
          />
        ))}
      </div>
    </div>
  );
}

type CategoryTabProps = {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
};

function CategoryTab({ label, count, isActive, onClick }: CategoryTabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition",
        isActive
          ? "bg-slate-950 text-white"
          : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100",
      ].join(" ")}
    >
      {label}
      <span className="ml-2 text-xs opacity-70">{count}</span>
    </button>
  );
}
