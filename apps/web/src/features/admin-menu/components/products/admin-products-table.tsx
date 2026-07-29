import { Button } from "@/components/ui/button";
import {
  SkeletonBlock,
  SkeletonLine,
} from "@/components/ui/skeleton/skeleton-parts";
import { formatDateTime } from "@/lib/format-date-time";
import { formatMoneyFromCents } from "@/lib/format-money";

import type { AdminProductListItem } from "../../types/admin-product.types";
import { AdminProductThumbnail } from "./admin-product-thumbnail";

interface AdminProductsTableProps {
  products: AdminProductListItem[];
  hasActiveFilters: boolean;
  onEdit: (product: AdminProductListItem) => void;
}

interface ProductAvailabilityBadgeProps {
  isAvailable: boolean;
}

function ProductAvailabilityBadge({
  isAvailable,
}: ProductAvailabilityBadgeProps) {
  return (
    <span
      className={[
        "inline-flex rounded-full px-2 py-1",
        "text-xs font-medium",
        isAvailable
          ? [
              "bg-[var(--color-success-surface)]",
              "text-[var(--color-success-strong)]",
            ].join(" ")
          : [
              "bg-[var(--color-warning-surface)]",
              "text-[var(--color-warning-strong)]",
            ].join(" "),
      ].join(" ")}
    >
      {isAvailable ? "Available" : "Unavailable"}
    </span>
  );
}

export function AdminProductsTable({
  products,
  hasActiveFilters,
  onEdit,
}: AdminProductsTableProps) {
  return (
    <div
      className={[
        "overflow-hidden rounded-xl",
        "border border-[var(--color-border)]",
        "bg-[var(--color-surface)]",
      ].join(" ")}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[940px] border-collapse">
          <thead className="bg-[var(--color-surface-muted)]">
            <tr className="border-b border-[var(--color-border)]">
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-secondary)]"
              >
                Product
              </th>

              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-secondary)]"
              >
                Category
              </th>

              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-secondary)]"
              >
                Price
              </th>

              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-secondary)]"
              >
                Status
              </th>

              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-secondary)]"
              >
                Updated
              </th>

              <th
                scope="col"
                className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-text-secondary)]"
              >
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {products.length > 0 ? (
              products.map((product) => (
                <tr
                  key={product.id}
                  className={[
                    "border-b border-[var(--color-border-soft)]",
                    "transition-colors",
                    "last:border-b-0",
                    "hover:bg-[var(--color-surface-hover)]",
                  ].join(" ")}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <AdminProductThumbnail imageUrl={product.imageUrl} />

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
                          {product.name}
                        </p>

                        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                          {product.optionGroupCount}{" "}
                          {product.optionGroupCount === 1
                            ? "option group"
                            : "option groups"}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <p className="text-sm text-[var(--color-text-strong)]">
                      {product.category.name}
                    </p>

                    {!product.category.isActive ? (
                      <p className="mt-1 text-xs text-[var(--color-warning-strong)]">
                        Inactive category
                      </p>
                    ) : null}
                  </td>

                  <td className="px-4 py-3 text-sm font-medium text-[var(--color-text-primary)]">
                    {formatMoneyFromCents(product.basePriceCents)}
                  </td>

                  <td className="px-4 py-3">
                    <ProductAvailabilityBadge
                      isAvailable={product.isAvailable}
                    />
                  </td>

                  <td className="px-4 py-3">
                    <time
                      dateTime={product.updatedAt}
                      className="text-sm text-[var(--color-text-secondary)]"
                    >
                      {formatDateTime(product.updatedAt)}
                    </time>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => onEdit(product)}
                    >
                      Edit
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                    {hasActiveFilters
                      ? "No products match your filters"
                      : "No products yet"}
                  </p>

                  <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                    {hasActiveFilters
                      ? "Try changing or clearing the current filters."
                      : "Create your first product to start building the menu."}
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

export function AdminProductsTableSkeleton() {
  return (
    <div
      aria-label="Loading products"
      aria-busy="true"
      className={[
        "overflow-hidden rounded-xl",
        "border border-[var(--color-border)]",
        "bg-[var(--color-surface)]",
      ].join(" ")}
    >
      <div
        className={[
          "border-b border-[var(--color-border)]",
          "bg-[var(--color-surface-muted)]",
          "px-4 py-3",
        ].join(" ")}
      >
        <SkeletonLine className="h-4 w-full rounded" />
      </div>

      <div className="divide-y divide-[var(--color-border-soft)]">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className={[
              "grid min-w-[940px]",
              "grid-cols-[2fr_1fr_0.8fr_0.9fr_1.2fr_0.6fr]",
              "items-center gap-6 px-4 py-4",
            ].join(" ")}
          >
            <div className="flex items-center gap-3">
              <SkeletonBlock className="h-12 w-12 shrink-0 rounded-lg" />

              <div className="flex-1 space-y-2">
                <SkeletonLine className="h-4 w-full rounded" />
                <SkeletonLine className="h-3 w-24 rounded" />
              </div>
            </div>

            <SkeletonLine className="h-4 w-full rounded" />
            <SkeletonLine className="h-4 w-full rounded" />
            <SkeletonLine className="h-4 w-full rounded" />
            <SkeletonLine className="h-4 w-full rounded" />

            <div className="flex justify-end">
              <SkeletonBlock className="h-8 w-14 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
