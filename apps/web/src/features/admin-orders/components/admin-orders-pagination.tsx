import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

import { AdminOrdersMeta } from "../types";

type AdminOrdersPaginationProps = {
  meta: AdminOrdersMeta;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

const pageSizeOptions = [10, 20, 50];

export function AdminOrdersPagination({
  meta,
  onPageChange,
  onPageSizeChange,
}: AdminOrdersPaginationProps) {
  const firstVisibleOrder = (meta.page - 1) * meta.pageSize + 1;
  const lastVisibleOrder = Math.min(meta.page * meta.pageSize, meta.total);

  return (
    <div className="mt-4 flex flex-col gap-4 border-t border-[var(--color-border-soft)] pt-4 text-sm md:flex-row md:items-center md:justify-between">
      <p className="text-[var(--color-text-secondary)]">
        Showing{" "}
        <span className="font-bold text-[var(--color-text-primary)]">
          {firstVisibleOrder}–{lastVisibleOrder}
        </span>{" "}
        of {meta.total} orders
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-[var(--color-text-secondary)]">
          <span className="whitespace-nowrap">Rows per page</span>

          <Select
            value={meta.pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="h-9 w-[76px] rounded-full px-3"
            aria-label="Orders per page"
          >
            {pageSizeOptions.map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                {pageSize}
              </option>
            ))}
          </Select>
        </label>

        <Button
          variant="secondary"
          size="sm"
          disabled={!meta.hasPreviousPage}
          onClick={() => onPageChange(meta.page - 1)}
        >
          <ChevronLeft className="size-4" />
          Previous
        </Button>

        <Button
          variant="secondary"
          size="sm"
          disabled={!meta.hasNextPage}
          onClick={() => onPageChange(meta.page + 1)}
        >
          Next
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
