import { Button } from "@/components/ui/button";
import { SkeletonLine } from "@/components/ui/skeleton/skeleton-parts";

import type { AdminCategoryListItem } from "../../types/admin-category.types";
import { AdminCategoryStatusBadge } from "./admin-category-status-badge";

interface AdminCategoriesTableProps {
  categories: AdminCategoryListItem[];
  hasActiveFilters: boolean;
  pendingCategoryId?: string;
  onEdit: (category: AdminCategoryListItem) => void;
  onToggleStatus: (category: AdminCategoryListItem) => void;
  onArchive: (category: AdminCategoryListItem) => void;
}

export function AdminCategoriesTable({
  categories,
  hasActiveFilters,
  pendingCategoryId,
  onEdit,
  onToggleStatus,
  onArchive,
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
        <table className="w-full min-w-[960px] table-fixed border-collapse">
          <thead className="bg-[var(--color-surface-muted)]">
            <tr className="border-b border-[var(--color-border)]">
              <th
                scope="col"
                className={[
                  "w-[22%] px-4 py-3",
                  "text-left text-xs font-semibold",
                  "text-[var(--color-text-secondary)]",
                ].join(" ")}
              >
                Name
              </th>

              <th
                scope="col"
                className={[
                  "hidden w-[28%] px-4 py-3",
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
                  "w-[11%] px-4 py-3",
                  "text-left text-xs font-semibold",
                  "text-[var(--color-text-secondary)]",
                ].join(" ")}
              >
                Products
              </th>

              <th
                scope="col"
                className={[
                  "w-[13%] px-4 py-3",
                  "text-left text-xs font-semibold",
                  "text-[var(--color-text-secondary)]",
                ].join(" ")}
              >
                Status
              </th>

              <th
                scope="col"
                className={[
                  "w-[8%] px-4 py-3",
                  "text-left text-xs font-semibold",
                  "text-[var(--color-text-secondary)]",
                ].join(" ")}
              >
                Order
              </th>

              <th
                scope="col"
                className={[
                  "w-[26%] px-4 py-3",
                  "text-right text-xs font-semibold",
                  "text-[var(--color-text-secondary)]",
                  "lg:w-[18%]",
                ].join(" ")}
              >
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {categories.length > 0 ? (
              categories.map((category) => {
                const isPending = pendingCategoryId === category.id;

                return (
                  <tr
                    key={category.id}
                    aria-busy={isPending}
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

                    <td className="px-4 py-3">
                      <div
                        className={[
                          "grid items-center justify-end gap-2",
                          "grid-cols-[72px_112px_96px]",
                        ].join(" ")}
                      >
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          disabled={isPending}
                          onClick={() => onEdit(category)}
                        >
                          Edit
                        </Button>

                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          disabled={isPending}
                          onClick={() => onToggleStatus(category)}
                        >
                          {category.isActive ? "Deactivate" : "Activate"}
                        </Button>

                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          disabled={isPending}
                          onClick={() => onArchive(category)}
                          className={[
                            "border-[var(--color-danger-border)]",
                            "bg-[var(--color-danger-surface)]",
                            "text-[var(--color-danger-strong)]",
                            "hover:border-[var(--color-danger)]",
                            "hover:bg-[var(--color-danger-surface)]",
                            "hover:text-[var(--color-danger-strong)]",
                          ].join(" ")}
                        >
                          Archive
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center">
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
        "overflow-hidden rounded-lg",
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
            className={[
              "grid min-w-[960px]",
              "grid-cols-[1.2fr_1.6fr_0.6fr_0.75fr_0.45fr_1.35fr]",
              "gap-6 px-4 py-5",
            ].join(" ")}
          >
            {Array.from({ length: 6 }).map((_, cellIndex) => (
              <SkeletonLine key={cellIndex} className="h-4 w-full rounded" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
