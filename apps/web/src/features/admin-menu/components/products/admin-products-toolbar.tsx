import type { ChangeEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import type {
  AdminProductAvailabilityFilter,
  AdminProductCategoryFilterOption,
} from "../../types/admin-product.types";
import { SkeletonBlock } from "@/components/ui/skeleton/skeleton-parts";

interface AdminProductsToolbarProps {
  searchValue: string;
  categoryId: string | undefined;
  availability: AdminProductAvailabilityFilter | undefined;
  categoryOptions: AdminProductCategoryFilterOption[];
  hasActiveFilters: boolean;
  isUpdating: boolean;
  isLoadingCategoryOptions: boolean;
  categoryOptionsError: boolean;

  onSearchChange: (value: string) => void;
  onCategoryChange: (categoryId: string | undefined) => void;
  onAvailabilityChange: (
    availability: AdminProductAvailabilityFilter | undefined,
  ) => void;
  onReset: () => void;
}

export function AdminProductsToolbar({
  searchValue,
  categoryId,
  availability,
  categoryOptions,
  hasActiveFilters,
  isUpdating,
  isLoadingCategoryOptions,
  categoryOptionsError,
  onSearchChange,
  onCategoryChange,
  onAvailabilityChange,
  onReset,
}: AdminProductsToolbarProps) {
  function handleCategoryChange(event: ChangeEvent<HTMLSelectElement>) {
    onCategoryChange(event.target.value || undefined);
  }

  function handleAvailabilityChange(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;

    onAvailabilityChange(
      value === "AVAILABLE" || value === "UNAVAILABLE" ? value : undefined,
    );
  }

  const categorySelectLabel = isLoadingCategoryOptions
    ? "Loading categories…"
    : categoryOptionsError
      ? "Categories unavailable"
      : "All categories";

  return (
    <div
      className={[
        "flex flex-col gap-3",
        "xl:flex-row xl:items-center",
        "xl:justify-between",
      ].join(" ")}
    >
      <div
        className={[
          "grid flex-1 gap-3",
          "sm:grid-cols-2",
          "xl:grid-cols-[minmax(16rem,1fr)_13rem_13rem]",
        ].join(" ")}
      >
        <div>
          <label htmlFor="product-search" className="sr-only">
            Search products
          </label>

          <Input
            id="product-search"
            type="search"
            autoComplete="off"
            value={searchValue}
            placeholder="Search products..."
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="product-category-filter" className="sr-only">
            Filter products by category
          </label>

          <select
            id="product-category-filter"
            value={categoryId ?? ""}
            disabled={isLoadingCategoryOptions || categoryOptionsError}
            onChange={handleCategoryChange}
            className={[
              "h-10 w-full rounded-md px-3",
              "text-sm",
              "border border-[var(--color-border)]",
              "bg-[var(--color-surface)]",
              "text-[var(--color-text-primary)]",
              "transition-colors",
              "hover:border-[var(--color-border-hover)]",
              "focus-visible:outline-none",
              "focus-visible:ring-2",
              "focus-visible:ring-[var(--color-ring)]",
              "disabled:cursor-not-allowed",
              "disabled:bg-[var(--color-surface-disabled)]",
              "disabled:text-[var(--color-text-muted)]",
            ].join(" ")}
          >
            <option value="">{categorySelectLabel}</option>

            {categoryOptions.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
                {category.isActive ? "" : " (Inactive)"}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="product-availability-filter" className="sr-only">
            Filter products by availability
          </label>

          <select
            id="product-availability-filter"
            value={availability ?? ""}
            onChange={handleAvailabilityChange}
            className={[
              "h-10 w-full rounded-md px-3",
              "text-sm",
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
            <option value="">All availability</option>
            <option value="AVAILABLE">Available</option>
            <option value="UNAVAILABLE">Unavailable</option>
          </select>
        </div>
      </div>

      <div className="flex min-h-10 items-center justify-between gap-3 xl:justify-end">
        <span
          aria-live="polite"
          aria-hidden={!isUpdating}
          className={[
            "block w-20 text-right text-xs",
            "text-[var(--color-text-muted)]",
            "transition-opacity duration-150",
            isUpdating ? "opacity-100" : "opacity-0",
          ].join(" ")}
        >
          Updating…
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

export function AdminProductsToolbarSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(16rem,1fr)_13rem_13rem]">
      <SkeletonBlock className="h-10 rounded-md" />
      <SkeletonBlock className="h-10 rounded-md" />
      <SkeletonBlock className="h-10 rounded-md" />
    </div>
  );
}
