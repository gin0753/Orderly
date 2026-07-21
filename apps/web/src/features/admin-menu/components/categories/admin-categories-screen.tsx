"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { useAdminCategoriesFilters } from "../../hooks/use-admin-categories-filters";
import { adminMenuQueryOptions } from "../../queries/admin-menu-query-options";
import { AdminCategoriesErrorState } from "./admin-categories-error-state";
import {
  AdminCategoriesSummary,
  AdminCategoriesSummarySkeleton,
} from "./admin-categories-summary";
import {
  AdminCategoriesTable,
  AdminCategoriesTableSkeleton,
} from "./admin-categories-table";
import { AdminCategoriesToolbar } from "./admin-categories-toolbar";
import { AdminCategoriesReorderSection } from "./reorder/admin-categories-reorder-section";

export function AdminCategoriesScreen() {
  const filters = useAdminCategoriesFilters();

  const [isReorderMode, setIsReorderMode] = useState(false);

  const [reorderSuccessMessage, setReorderSuccessMessage] = useState<
    string | null
  >(null);

  const categoriesQuery = useQuery(
    adminMenuQueryOptions.categories({
      search: filters.search || undefined,
      status: filters.status,
    }),
  );

  if (categoriesQuery.isPending && !categoriesQuery.data) {
    return (
      <div className="space-y-6">
        <AdminCategoriesSummarySkeleton />

        <div className="h-10 animate-pulse rounded-md bg-[var(--color-surface-muted)]" />

        <AdminCategoriesTableSkeleton />
      </div>
    );
  }

  if (categoriesQuery.isError && !categoriesQuery.data) {
    const message =
      categoriesQuery.error instanceof Error
        ? categoriesQuery.error.message
        : "Unable to load menu categories.";

    return (
      <AdminCategoriesErrorState
        message={message}
        onRetry={() => {
          void categoriesQuery.refetch();
        }}
      />
    );
  }

  const response = categoriesQuery.data;

  if (!response) {
    return null;
  }

  function handleStartReorder() {
    setReorderSuccessMessage(null);
    setIsReorderMode(true);
  }

  function handleCancelReorder() {
    setIsReorderMode(false);
  }

  function handleReorderSuccess() {
    setIsReorderMode(false);

    setReorderSuccessMessage("Category order saved successfully.");
  }

  return (
    <div aria-busy={categoriesQuery.isFetching} className="space-y-5">
      <AdminCategoriesSummary summary={response.summary} />

      {reorderSuccessMessage ? (
        <div
          role="status"
          className={[
            "rounded-lg px-4 py-3",
            "border border-[var(--color-success)]",
            "bg-[var(--color-success-surface)]",
            "text-sm font-medium",
            "text-[var(--color-success-strong)]",
          ].join(" ")}
        >
          {reorderSuccessMessage}
        </div>
      ) : null}

      {isReorderMode ? (
        <AdminCategoriesReorderSection
          fallbackItemCount={response.summary.total}
          onCancel={handleCancelReorder}
          onSuccess={handleReorderSuccess}
        />
      ) : (
        <>
          <AdminCategoriesToolbar
            searchValue={filters.searchInput}
            status={filters.status}
            hasActiveFilters={filters.hasActiveFilters}
            isUpdating={
              categoriesQuery.isFetching && !categoriesQuery.isPending
            }
            canReorder={response.summary.total > 1}
            onSearchChange={filters.setSearchInput}
            onStatusChange={filters.setStatus}
            onReset={filters.resetFilters}
            onStartReorder={handleStartReorder}
          />

          <AdminCategoriesTable
            categories={response.data}
            hasActiveFilters={filters.hasActiveFilters}
          />
        </>
      )}
    </div>
  );
}
