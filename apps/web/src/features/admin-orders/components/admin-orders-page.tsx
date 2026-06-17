"use client";

import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAdminOrders } from "../hooks/use-admin-orders";
import { AdminOrderDetail } from "./admin-order-detail/admin-order-detail";
import { AdminOrderList } from "./admin-order-list";
import { AdminOrdersFilters } from "./admin-orders-filters";
import { AdminOrdersSummary } from "./admin-orders-summary";

export function AdminOrdersPage() {
  const {
    allOrders,
    visibleOrders,
    selectedOrder,
    selectedOrderId,
    filters,
    searchTerm,
    isInitialLoading,
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
  } = useAdminOrders();

  return (
    <main className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)]">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <section className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-brand)]">
              Admin dashboard
            </p>
            <h1 className="text-4xl font-bold tracking-tight">Orders</h1>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Manage and update incoming orders in real time.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={reloadOrders}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={isRefreshing ? "size-4 animate-spin" : "size-4"}
              />
              Refresh
            </Button>

            <Button type="button" variant="secondary" size="md" disabled>
              Export
            </Button>
          </div>
        </section>

        <AdminOrdersSummary orders={allOrders} />

        <AdminOrdersFilters
          filters={filters}
          searchTerm={searchTerm}
          visibleOrderCount={visibleOrders.length}
          totalOrderCount={allOrders.length}
          onSearchTermChange={setSearchTerm}
          onOrderTypeChange={handleOrderTypeChange}
          onStatusChange={handleStatusChange}
          onClearFilters={handleClearFilters}
        />

        {shouldShowFullPageError ? (
          <div className="rounded-3xl border border-[var(--color-danger-border)] bg-[var(--color-danger-surface)] p-6">
            <p className="text-sm font-bold text-[var(--color-danger-strong)]">
              {error}
            </p>

            <Button
              type="button"
              variant="danger"
              onClick={reloadOrders}
              className="mt-4"
            >
              Try again
            </Button>
          </div>
        ) : (
          <>
            {error ? (
              <div className="mb-5 flex flex-col gap-3 rounded-3xl border border-[var(--color-danger-border)] bg-[var(--color-danger-surface)] p-4 md:flex-row md:items-center md:justify-between">
                <p className="text-sm font-bold text-[var(--color-danger-strong)]">
                  {error}
                </p>

                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={reloadOrders}
                  className="w-fit"
                >
                  Try again
                </Button>
              </div>
            ) : null}

            <section className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.85fr)]">
              <AdminOrderList
                orders={visibleOrders}
                totalOrders={allOrders.length}
                selectedOrderId={selectedOrderId}
                isLoading={isInitialLoading}
                isRefreshing={isRefreshing}
                onSelectOrder={setSelectedOrderId}
              />

              <AdminOrderDetail
                order={selectedOrder}
                isUpdatingStatus={isUpdatingStatus}
                onUpdateStatus={handleUpdateStatus}
              />
            </section>
          </>
        )}
      </div>
    </main>
  );
}
