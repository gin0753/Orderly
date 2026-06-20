"use client";

import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useAdminOrders } from "../hooks/use-admin-orders";
import { AdminOrderDetail } from "./admin-order-detail/admin-order-detail";
import { AdminOrderList } from "./admin-order-list/admin-order-list";
import { AdminOrdersFilters } from "./admin-orders-filters";
import { AdminOrdersSummary } from "./admin-orders-summary";
import {
  AdminOrdersInlineError,
  AdminOrdersLoadErrorState,
} from "./feedback/admin-orders-error-states";

export function AdminOrdersPage() {
  const {
    orders,
    summary,
    meta,
    selectedOrder,
    selectedOrderId,
    filters,
    searchTerm,
    isLoadingOrders,
    isRefreshing,
    isUpdatingStatus,
    error,
    shouldShowFullPageError,
    setSelectedOrderId,
    setSearchTerm,
    reloadOrders,
    handleOrderTypeChange,
    handleStatusChange,
    handleClearFilters,
    handleUpdateStatus,
    handlePageChange,
    handlePageSizeChange,
  } = useAdminOrders();

  const isRetrying = isLoadingOrders || isRefreshing;

  const isFiltered =
    Boolean(filters.orderType) ||
    Boolean(filters.status) ||
    searchTerm.trim().length > 0;

  return (
    <main className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)]">
      <div className="mx-auto max-w-7xl px-4 py-4 md:px-8 md:py-6">
        <section className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-brand)]">
              Admin dashboard
            </p>

            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Orders
            </h1>

            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Manage and update incoming orders in real time.
            </p>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={reloadOrders}
            disabled={isRetrying}
            className="w-fit"
          >
            <RefreshCw
              className={isRefreshing ? "size-4 animate-spin" : "size-4"}
            />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </section>

        {shouldShowFullPageError ? (
          <AdminOrdersLoadErrorState
            message={error ?? "Unable to load orders. Please try again."}
            isRetrying={isRetrying}
            onRetry={reloadOrders}
          />
        ) : (
          <>
            <AdminOrdersSummary summary={summary} />

            <AdminOrdersFilters
              filters={filters}
              searchTerm={searchTerm}
              visibleOrderCount={meta.total}
              totalOrderCount={summary.total}
              onSearchTermChange={setSearchTerm}
              onOrderTypeChange={handleOrderTypeChange}
              onStatusChange={handleStatusChange}
              onClearFilters={handleClearFilters}
            />

            {error ? (
              <AdminOrdersInlineError
                message={error}
                isRetrying={isRefreshing}
                onRetry={reloadOrders}
              />
            ) : null}

            <section className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.85fr)]">
              <AdminOrderList
                orders={orders}
                meta={meta}
                selectedOrderId={selectedOrderId}
                isLoading={isLoadingOrders}
                isFiltered={isFiltered}
                onSelectOrder={setSelectedOrderId}
                onClearFilters={handleClearFilters}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />

              <AdminOrderDetail
                order={selectedOrder}
                isLoading={isLoadingOrders}
                isUpdatingStatus={isUpdatingStatus}
                onUpdateStatus={handleUpdateStatus}
                onClose={() => setSelectedOrderId(null)}
              />
            </section>
          </>
        )}
      </div>
    </main>
  );
}
