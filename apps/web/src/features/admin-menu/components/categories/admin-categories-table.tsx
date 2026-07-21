import { SkeletonLine } from "@/components/ui/skeleton/skeleton-parts";

import type { AdminCategoryListItem } from "../../types/admin-category.types";
import { AdminCategoryStatusBadge } from "./admin-category-status-badge";

interface AdminCategoriesTableProps {
  categories: AdminCategoryListItem[];
  hasActiveFilters: boolean;
}

export function AdminCategoriesTable({
  categories,
  hasActiveFilters,
}: AdminCategoriesTableProps) {
  return (
    <div
      className={[
        "overflow-hidden rounded-lg",
        "border border-[var(--color-border)]",
        "bg-[var(--color-surface)]",
      ].join(" ")}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] table-fixed border-collapse">
          <thead className="bg-[var(--color-surface-muted)]">
            <tr className="border-b border-[var(--color-border)]">
              <th
                scope="col"
                className={[
                  "w-[36%] px-4 py-3",
                  "text-left text-xs font-semibold",
                  "text-[var(--color-text-secondary)]",
                  "lg:w-[22%]",
                ].join(" ")}
              >
                Name
              </th>

              <th
                scope="col"
                className={[
                  "hidden w-[38%] px-4 py-3",
                  "text-left text-xs font-semibold",
                  "text-[var(--color-text-secondary)]",
                  "lg:table-cell",
                ].join(" ")}
              >
                Description
              </th>

              <th
                scope="col"
                className={[
                  "w-[18%] px-4 py-3",
                  "text-left text-xs font-semibold",
                  "text-[var(--color-text-secondary)]",
                  "lg:w-[12%]",
                ].join(" ")}
              >
                Products
              </th>

              <th
                scope="col"
                className={[
                  "w-[26%] px-4 py-3",
                  "text-left text-xs font-semibold",
                  "text-[var(--color-text-secondary)]",
                  "lg:w-[16%]",
                ].join(" ")}
              >
                Status
              </th>

              <th
                scope="col"
                className={[
                  "w-[20%] px-4 py-3",
                  "text-left text-xs font-semibold",
                  "text-[var(--color-text-secondary)]",
                  "lg:w-[12%]",
                ].join(" ")}
              >
                Order
              </th>
            </tr>
          </thead>

          <tbody>
            {categories.length > 0 ? (
              categories.map((category) => (
                <tr
                  key={category.id}
                  className={[
                    "border-b border-[var(--color-border-soft)]",
                    "transition-colors",
                    "last:border-b-0",
                    "hover:bg-[var(--color-surface-hover)]",
                  ].join(" ")}
                >
                  <td className="px-4 py-3">
                    <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
                      {category.name}
                    </p>

                    <p className="mt-0.5 truncate text-xs text-[var(--color-text-muted)]">
                      {category.slug}
                    </p>
                  </td>

                  <td className="hidden px-4 py-3 lg:table-cell">
                    <p className="truncate text-sm text-[var(--color-text-secondary)]">
                      {category.description ?? "—"}
                    </p>
                  </td>

                  <td className="px-4 py-3 text-sm text-[var(--color-text-strong)]">
                    {category.productCount}
                  </td>

                  <td className="px-4 py-3">
                    <AdminCategoryStatusBadge isActive={category.isActive} />
                  </td>

                  <td className="px-4 py-3 text-sm text-[var(--color-text-strong)]">
                    {category.sortOrder}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                    {hasActiveFilters
                      ? "No categories match your filters"
                      : "No categories yet"}
                  </p>

                  <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                    {hasActiveFilters
                      ? "Try changing or clearing the current filters."
                      : "Create your first category to organize menu products."}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminCategoriesTableSkeleton() {
  return (
    <div
      aria-label="Loading categories"
      className={[
        "overflow-hidden rounded-xl",
        "border border-[var(--color-border)]",
        "bg-[var(--color-surface)]",
      ].join(" ")}
    >
      <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3">
        <SkeletonLine className="h-4 w-full rounded" />
      </div>

      <div className="divide-y divide-[var(--color-border-soft)]">
        {Array.from({ length: 5 }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="grid min-w-[720px] grid-cols-[1.4fr_2fr_0.7fr_0.8fr_0.5fr] gap-6 px-4 py-5"
          >
            {Array.from({ length: 5 }).map((_, cellIndex) => (
              <SkeletonLine key={cellIndex} className="h-4 w-full rounded" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
