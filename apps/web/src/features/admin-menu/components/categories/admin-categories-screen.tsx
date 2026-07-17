"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

import { adminMenuQueryOptions } from "../../queries/admin-menu-query-options";
import type { AdminCategoryStatusFilter } from "../../types/admin-category.types";
import {
  AdminCategoriesSummary,
  AdminCategoriesSummarySkeleton,
} from "./admin-categories-summary";
import {
  AdminCategoriesTable,
  AdminCategoriesTableSkeleton,
} from "./admin-categories-table";
import { AdminCategoriesToolbar } from "./admin-categories-toolbar";

const SEARCH_DEBOUNCE_MS = 300;

function parseStatus(
  value: string | null,
): AdminCategoryStatusFilter | undefined {
  return value === "active" || value === "inactive" ? value : undefined;
}

type SearchParamUpdateValue = string | number | null | undefined;

export function AdminCategoriesScreen() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get("search")?.trim() ?? "";
  const status = parseStatus(searchParams.get("status"));

  const [searchInput, setSearchInput] = useState(search);

  const debouncedSearch = useDebouncedValue(
    searchInput.trim(),
    SEARCH_DEBOUNCE_MS,
  );

  const updateSearchParams = useCallback(
    (updates: Record<string, SearchParamUpdateValue>) => {
      const nextSearchParams = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === null || value === "") {
          nextSearchParams.delete(key);
        } else {
          nextSearchParams.set(key, String(value));
        }
      }

      const queryString = nextSearchParams.toString();

      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    if (debouncedSearch === search) {
      return;
    }

    updateSearchParams({
      search: debouncedSearch || null,
    });
  }, [debouncedSearch, search, updateSearchParams]);

  const categoriesQuery = useQuery(
    adminMenuQueryOptions.categories({
      search: search || undefined,
      status,
    }),
  );

  const hasActiveFilters = Boolean(search || status);

  function handleStatusChange(
    nextStatus: AdminCategoryStatusFilter | undefined,
  ) {
    updateSearchParams({
      status: nextStatus,
    });
  }

  function handlePageChange(nextPage: number) {
    updateSearchParams({
      page: nextPage > 1 ? nextPage : null,
    });
  }

  function handleResetFilters() {
    setSearchInput("");

    updateSearchParams({
      search: null,
      status: null,
    });
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
    const errorMessage =
      categoriesQuery.error instanceof Error
        ? categoriesQuery.error.message
        : "Unable to load menu categories.";

    return (
      <Card
        className={[
          "border border-[var(--color-danger-border)]",
          "bg-[var(--color-danger-surface)]",
          "px-6 py-12 text-center",
        ].join(" ")}
      >
        <h2 className="text-base font-semibold text-[var(--color-danger-strong)]">
          Categories could not be loaded
        </h2>

        <p className="mx-auto mt-2 max-w-lg text-sm text-[var(--color-text-secondary)]">
          {errorMessage}
        </p>

        <div className="mt-5">
          <Button type="button" onClick={() => categoriesQuery.refetch()}>
            Try again
          </Button>
        </div>
      </Card>
    );
  }

  const response = categoriesQuery.data;

  if (!response) {
    return null;
  }
  console.log(response, 1);
  return (
    <div aria-busy={categoriesQuery.isFetching} className="space-y-5">
      <AdminCategoriesSummary summary={response.summary} />

      <AdminCategoriesToolbar
        searchValue={searchInput}
        status={status}
        hasActiveFilters={hasActiveFilters}
        isUpdating={categoriesQuery.isFetching && !categoriesQuery.isPending}
        onSearchChange={setSearchInput}
        onStatusChange={handleStatusChange}
        onReset={handleResetFilters}
      />

      <AdminCategoriesTable
        categories={response.data}
        hasActiveFilters={hasActiveFilters}
      />
    </div>
  );
}
