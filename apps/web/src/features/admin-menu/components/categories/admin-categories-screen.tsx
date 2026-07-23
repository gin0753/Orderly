"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { useAdminCategoriesFilters } from "../../hooks/use-admin-categories-filters";
import { useAdminCategoryActions } from "../../hooks/use-admin-category-actions";
import { adminMenuQueryOptions } from "../../queries/admin-menu-query-options";
import { AdminCategoryArchiveDialog } from "./admin-category-archive-dialog";
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
import { AdminCategoryFormDialog } from "./form/admin-category-form-dialog";
import { AdminCategoriesReorderSection } from "./reorder/admin-categories-reorder-section";

export function AdminCategoriesScreen() {
  const filters = useAdminCategoriesFilters();
  const actions = useAdminCategoryActions();

  const [isReorderMode, setIsReorderMode] = useState(false);

  const categoriesQuery = useQuery(
    adminMenuQueryOptions.categories({
      search: filters.search || undefined,
      status: filters.status,
    }),
  );

  function handleStartReorder() {
    actions.clearFeedback();
    setIsReorderMode(true);
  }

  function handleCancelReorder() {
    setIsReorderMode(false);
  }

  function handleReorderSuccess() {
    setIsReorderMode(false);

    actions.showSuccessMessage("Category order saved successfully.");
  }

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

  const isPageBusy = categoriesQuery.isFetching || actions.isMutationPending;

  return (
    <div aria-busy={isPageBusy} className="space-y-5">
      <AdminCategoriesSummary summary={response.summary} />

      {actions.successMessage ? (
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
          {actions.successMessage}
        </div>
      ) : null}

      {actions.availabilityErrorMessage ? (
        <div
          role="alert"
          className={[
            "rounded-lg px-4 py-3",
            "border border-[var(--color-danger-border)]",
            "bg-[var(--color-danger-surface)]",
          ].join(" ")}
        >
          <p className="text-sm font-medium text-[var(--color-danger-strong)]">
            Category availability could not be updated
          </p>

          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            {actions.availabilityErrorMessage}
          </p>
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
            onCreateCategory={actions.openCreateCategory}
          />

          <AdminCategoriesTable
            categories={response.data}
            hasActiveFilters={filters.hasActiveFilters}
            pendingCategoryId={actions.pendingCategoryId}
            onEdit={actions.openEditCategory}
            onToggleStatus={(category) => {
              void actions.toggleCategoryAvailability(category);
            }}
            onArchive={actions.openArchiveCategory}
          />
        </>
      )}

      {actions.categoryForm ? (
        <AdminCategoryFormDialog
          key={
            actions.categoryForm.mode === "edit"
              ? actions.categoryForm.category.id
              : "create-category"
          }
          mode={actions.categoryForm.mode}
          initialValues={
            actions.categoryForm.mode === "edit"
              ? {
                  name: actions.categoryForm.category.name,
                  description: actions.categoryForm.category.description ?? "",
                }
              : undefined
          }
          isSubmitting={actions.categoryFormIsSubmitting}
          errorMessage={actions.categoryFormErrorMessage}
          onClose={actions.closeCategoryForm}
          onSubmit={actions.submitCategoryForm}
        />
      ) : null}

      {actions.archiveTarget ? (
        <AdminCategoryArchiveDialog
          key={actions.archiveTarget.id}
          categoryName={actions.archiveTarget.name}
          isArchiving={actions.archiveIsPending}
          errorMessage={actions.archiveErrorMessage}
          onCancel={actions.closeArchiveDialog}
          onConfirm={actions.confirmArchiveCategory}
        />
      ) : null}
    </div>
  );
}
