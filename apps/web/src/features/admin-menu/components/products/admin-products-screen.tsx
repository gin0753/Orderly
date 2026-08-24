"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { useAdminProductsFilters } from "../../hooks/use-admin-products-filters";
import { adminMenuQueryOptions } from "../../queries/admin-menu-query-options";
import { AdminProductsErrorState } from "./admin-products-error-state";
import { AdminProductsPagination } from "./admin-products-pagination";
import {
  AdminProductsSummary,
  AdminProductsSummarySkeleton,
} from "./admin-products-summary";
import {
  AdminProductsTable,
  AdminProductsTableSkeleton,
} from "./admin-products-table";
import {
  AdminProductsToolbar,
  AdminProductsToolbarSkeleton,
} from "./admin-products-toolbar";

const PRODUCTS_PAGE_SIZE = 10;

export function AdminProductsScreen() {
  const {
    page,
    search,
    searchInput,
    categoryId,
    availability,
    hasActiveFilters,
    setSearchInput,
    setCategoryId,
    setAvailability,
    setPage,
    resetFilters,
  } = useAdminProductsFilters();

  const router = useRouter();

  const productsQuery = useQuery(
    adminMenuQueryOptions.products({
      page,
      pageSize: PRODUCTS_PAGE_SIZE,
      search: search || undefined,
      categoryId,
      availability,
    }),
  );

  const categoryOptionsQuery = useQuery(
    adminMenuQueryOptions.categoryOptions(),
  );

  const response = productsQuery.data;

  useEffect(() => {
    if (!response) {
      return;
    }

    const maximumPage = Math.max(response.meta.totalPages, 1);

    if (page > maximumPage) {
      setPage(maximumPage);
    }
  }, [page, response, setPage]);

  if (productsQuery.isPending && !productsQuery.data) {
    return (
      <div className="space-y-6">
        <AdminProductsSummarySkeleton />
        <AdminProductsToolbarSkeleton />
        <AdminProductsTableSkeleton />
      </div>
    );
  }

  if (productsQuery.isError && !productsQuery.data) {
    const message =
      productsQuery.error instanceof Error
        ? productsQuery.error.message
        : "Unable to load menu products.";

    return (
      <AdminProductsErrorState
        message={message}
        onRetry={() => {
          void productsQuery.refetch();
        }}
      />
    );
  }

  if (!response) {
    return null;
  }

  const isUpdating = productsQuery.isFetching && !productsQuery.isPending;

  return (
    <div
      aria-busy={productsQuery.isFetching || categoryOptionsQuery.isFetching}
      className="space-y-5"
    >
      <AdminProductsSummary summary={response.summary} />

      <AdminProductsToolbar
        searchValue={searchInput}
        categoryId={categoryId}
        availability={availability}
        categoryOptions={categoryOptionsQuery.data ?? []}
        hasActiveFilters={hasActiveFilters}
        isUpdating={isUpdating}
        isLoadingCategoryOptions={categoryOptionsQuery.isPending}
        categoryOptionsError={categoryOptionsQuery.isError}
        onSearchChange={setSearchInput}
        onCategoryChange={setCategoryId}
        onAvailabilityChange={setAvailability}
        onReset={resetFilters}
        onCreateProduct={() => router.push("/admin/menu/products/new")}
      />

      <AdminProductsTable
        products={response.data}
        hasActiveFilters={hasActiveFilters}
        onEdit={(product) =>
          router.push(`/admin/menu/products/${product.id}/edit`)
        }
      />

      <AdminProductsPagination
        meta={response.meta}
        isUpdating={isUpdating}
        onPageChange={setPage}
      />
    </div>
  );
}
