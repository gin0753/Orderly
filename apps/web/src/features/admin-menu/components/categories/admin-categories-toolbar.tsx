import type { ChangeEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import type { AdminCategoryStatusFilter } from "../../types/admin-category.types";

interface AdminCategoriesToolbarProps {
  searchValue: string;
  status: AdminCategoryStatusFilter | undefined;
  hasActiveFilters: boolean;
  isUpdating: boolean;
  onSearchChange: (value: string) => void;
  onStatusChange: (status: AdminCategoryStatusFilter | undefined) => void;
  onReset: () => void;
}

export function AdminCategoriesToolbar({
  searchValue,
  status,
  hasActiveFilters,
  isUpdating,
  onSearchChange,
  onStatusChange,
  onReset,
}: AdminCategoriesToolbarProps) {
  function handleStatusChange(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;

    onStatusChange(
      value === "active" || value === "inactive" ? value : undefined,
    );
  }

  return (
    <div
      className={[
        "flex flex-col gap-3",
        "lg:flex-row lg:items-center lg:justify-between",
      ].join(" ")}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="w-full md:max-w-md">
          <label htmlFor="category-search" className="sr-only">
            Search categories
          </label>

          <Input
            id="category-search"
            type="search"
            value={searchValue}
            placeholder="Search categories..."
            autoComplete="off"
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>

        <div className="w-full md:w-48">
          <label htmlFor="category-status" className="sr-only">
            Filter categories by status
          </label>

          <select
            id="category-status"
            value={status ?? ""}
            onChange={handleStatusChange}
            className={[
              "h-10 w-full rounded-md px-3 text-sm",
              "border border-[var(--color-border)]",
              "bg-[var(--color-surface)]",
              "text-[var(--color-text-primary)]",
              "transition-colors",
              "hover:border-[var(--color-border-hover)]",
              "focus-visible:outline-none",
              "focus-visible:ring-2",
              "focus-visible:ring-[var(--color-ring)]",
            ].join(" ")}
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="flex min-h-10 items-center justify-between gap-3 lg:justify-end">
        <span
          aria-live="polite"
          className="text-xs text-[var(--color-text-muted)]"
        >
          {isUpdating ? "Updating…" : ""}
        </span>

        {hasActiveFilters ? (
          <Button type="button" variant="secondary" size="sm" onClick={onReset}>
            Clear filters
          </Button>
        ) : null}
      </div>
    </div>
  );
}
