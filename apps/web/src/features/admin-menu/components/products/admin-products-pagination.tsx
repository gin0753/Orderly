import { Button } from "@/components/ui/button";
import { AdminMenuPaginationMeta } from "../../types/admin-menu.types";

interface AdminProductsPaginationProps {
  meta: AdminMenuPaginationMeta;
  isUpdating?: boolean;
  onPageChange: (page: number) => void;
}

export function AdminProductsPagination({
  meta,
  isUpdating = false,
  onPageChange,
}: AdminProductsPaginationProps) {
  const { page, pageSize, total, totalPages } = meta;
  if (total === 0) {
    return null;
  }

  const safeTotalPages = Math.max(totalPages, 1);

  const firstVisibleItem = (page - 1) * pageSize + 1;
  const lastVisibleItem = Math.min(page * pageSize, total);

  const canGoPrevious = page > 1;
  const canGoNext = page < safeTotalPages;

  return (
    <div
      className={[
        "flex flex-col gap-3",
        "border-t border-[var(--color-border)] px-4 py-4",
        "sm:flex-row sm:items-center sm:justify-between",
      ].join(" ")}
    >
      <p className="text-sm text-[var(--color-text-secondary)]">
        Showing{" "}
        <span className="font-medium text-[var(--color-text-primary)]">
          {firstVisibleItem}–{lastVisibleItem}
        </span>{" "}
        of{" "}
        <span className="font-medium text-[var(--color-text-primary)]">
          {total}
        </span>{" "}
        products
      </p>

      <nav aria-label="Product pagination" className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={!canGoPrevious || isUpdating}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </Button>

        <span
          aria-live="polite"
          className="min-w-24 text-center text-sm font-medium text-[var(--color-text-secondary)]"
        >
          Page {page} of {safeTotalPages}
        </span>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={!canGoNext || isUpdating}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </nav>
    </div>
  );
}
