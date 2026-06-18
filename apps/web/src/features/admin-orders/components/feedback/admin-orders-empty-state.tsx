import { Inbox, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

type AdminOrdersEmptyStateProps = {
  isFiltered: boolean;
  onClearFilters: () => void;
};

export function AdminOrdersEmptyState({
  isFiltered,
  onClearFilters,
}: AdminOrdersEmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-[var(--color-surface-soft)] text-[var(--color-text-secondary)]">
        <Inbox className="size-5" />
      </span>

      <h3 className="mt-4 font-bold">
        {isFiltered ? "No matching orders" : "No orders yet"}
      </h3>

      <p className="mx-auto mt-2 max-w-sm text-sm text-[var(--color-text-secondary)]">
        {isFiltered
          ? "No orders match your current search or filters. Try adjusting them to see more results."
          : "New customer orders will appear here once they are submitted."}
      </p>

      {isFiltered ? (
        <Button
          variant="secondary"
          size="sm"
          onClick={onClearFilters}
          className="mt-5"
        >
          <RotateCcw className="size-4" />
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}
