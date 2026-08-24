"use client";

import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { useReorderAdminCategories } from "../../../mutations/use-reorder-admin-categories";
import { adminMenuQueryOptions } from "../../../queries/admin-menu-query-options";
import { AdminCategoriesReorderList } from "./admin-categories-reorder-list";
import {
  SkeletonBlock,
  SkeletonCircle,
  SkeletonLine,
} from "@/components/ui/skeleton/skeleton-parts";

interface AdminCategoriesReorderSectionProps {
  fallbackItemCount: number;
  onCancel: () => void;
  onSuccess: () => void;
}

interface AdminCategoriesReorderSkeletonProps {
  itemCount: number;
}

function AdminCategoriesReorderSkeleton({
  itemCount,
}: AdminCategoriesReorderSkeletonProps) {
  const visibleItemCount = Math.min(Math.max(itemCount, 5), 8);

  return (
    <div
      aria-label="Loading category order"
      aria-busy="true"
      className={[
        "space-y-3 rounded-xl p-5",
        "border border-[var(--color-border)]",
        "bg-[var(--color-surface)]",
      ].join(" ")}
    >
      {Array.from({
        length: visibleItemCount,
      }).map((_, index) => (
        <SkeletonBlock
          key={index}
          className="flex h-16 items-center gap-3 rounded-lg px-4"
        >
          <SkeletonCircle className="h-8 w-8 shrink-0" />

          <SkeletonCircle className="h-8 w-8 shrink-0 rounded-md" />

          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonLine className="h-3.5 w-32" />
            <SkeletonLine className="h-3 w-20" />
          </div>

          <SkeletonLine className="h-6 w-16" />
        </SkeletonBlock>
      ))}
    </div>
  );
}

export function AdminCategoriesReorderSection({
  fallbackItemCount,
  onCancel,
  onSuccess,
}: AdminCategoriesReorderSectionProps) {
  const categoriesQuery = useQuery({
    ...adminMenuQueryOptions.categories(),
    staleTime: 0,
  });

  const reorderMutation = useReorderAdminCategories();

  async function handleSave(categoryIds: string[]) {
    await reorderMutation.mutateAsync({
      categoryIds,
    });

    onSuccess();
  }

  function handleCancel() {
    reorderMutation.reset();
    onCancel();
  }

  const errorMessage =
    reorderMutation.error instanceof Error
      ? reorderMutation.error.message
      : reorderMutation.isError
        ? "Unable to save the category order."
        : null;

  if (categoriesQuery.isPending) {
    return <AdminCategoriesReorderSkeleton itemCount={fallbackItemCount} />;
  }

  if (categoriesQuery.isError) {
    const queryErrorMessage =
      categoriesQuery.error instanceof Error
        ? categoriesQuery.error.message
        : "Unable to load all categories.";

    return (
      <Card
        className={[
          "border border-[var(--color-danger-border)]",
          "bg-[var(--color-danger-surface)]",
          "px-6 py-12 text-center",
        ].join(" ")}
      >
        <h2 className="text-base font-semibold text-[var(--color-danger-strong)]">
          Category order could not be loaded
        </h2>

        <p className="mx-auto mt-2 max-w-lg text-sm text-[var(--color-text-secondary)]">
          {queryErrorMessage}
        </p>

        <div className="mt-5 flex justify-center gap-3">
          <Button type="button" variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>

          <Button
            type="button"
            onClick={() => {
              void categoriesQuery.refetch();
            }}
          >
            Try again
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <AdminCategoriesReorderList
      categories={categoriesQuery.data.data}
      isSaving={reorderMutation.isPending}
      errorMessage={errorMessage}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
}
