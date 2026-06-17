"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getAdminOrders,
  updateAdminOrderStatus,
} from "../api/admin-orders-api";
import {
  AdminOrder,
  AdminOrderFilters,
  AdminOrderStatus,
  AdminOrderType,
} from "../types";
import { AdminOrderDetail } from "./admin-order-detail/admin-order-detail";
import { AdminOrderList } from "./admin-order-list";
import { AdminOrdersFilters } from "./admin-orders-filters";
import { AdminOrdersSummary } from "./admin-orders-summary";
import { Button } from "@/components/ui/button";

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [filters, setFilters] = useState<AdminOrderFilters>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyOrders = useCallback((data: AdminOrder[]) => {
    setOrders(data);

    setSelectedOrderId((currentSelectedId) => {
      if (
        currentSelectedId &&
        data.some((order) => order.id === currentSelectedId)
      ) {
        return currentSelectedId;
      }

      return data[0]?.id ?? null;
    });
  }, []);

  async function reloadOrders(nextFilters: AdminOrderFilters) {
    try {
      setIsLoading(true);
      setError(null);

      const data = await getAdminOrders(nextFilters);
      applyOrders(data);
    } catch {
      setError("Unable to load orders. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let ignore = false;

    async function loadInitialOrders() {
      try {
        const data = await getAdminOrders({});

        if (ignore) return;

        applyOrders(data);
      } catch {
        if (ignore) return;

        setError("Unable to load orders. Please try again.");
      } finally {
        if (ignore) return;

        setIsLoading(false);
      }
    }

    void loadInitialOrders();

    return () => {
      ignore = true;
    };
  }, [applyOrders]);

  const selectedOrder = useMemo(() => {
    return orders.find((order) => order.id === selectedOrderId) ?? null;
  }, [orders, selectedOrderId]);

  async function handleOrderTypeChange(orderType?: AdminOrderType) {
    const nextFilters = {
      ...filters,
      orderType,
    };

    setFilters(nextFilters);
    await reloadOrders(nextFilters);
  }

  async function handleStatusChange(status?: AdminOrderStatus) {
    const nextFilters = {
      ...filters,
      status,
    };

    setFilters(nextFilters);
    await reloadOrders(nextFilters);
  }

  async function handleUpdateStatus(orderId: string, status: AdminOrderStatus) {
    try {
      setIsUpdatingStatus(true);

      const updatedOrder = await updateAdminOrderStatus(orderId, status);

      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === updatedOrder.id ? updatedOrder : order,
        ),
      );

      setSelectedOrderId(updatedOrder.id);
    } finally {
      setIsUpdatingStatus(false);
    }
  }

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

          <Button variant="secondary" size="md" className="w-fit">
            Export
          </Button>
        </section>

        <AdminOrdersSummary orders={orders} />

        <AdminOrdersFilters
          filters={filters}
          onOrderTypeChange={handleOrderTypeChange}
          onStatusChange={handleStatusChange}
        />

        {error ? (
          <div className="rounded-3xl border border-[var(--color-danger-border)] bg-[var(--color-danger-surface)] p-6">
            <p className="text-sm font-bold text-[var(--color-danger-strong)]">
              {error}
            </p>

            <Button
              type="button"
              onClick={() => reloadOrders(filters)}
              className="mt-4 bg-[var(--color-danger-strong)] text-[var(--color-text-inverse)] hover:opacity-90"
            >
              Try again
            </Button>
          </div>
        ) : (
          <section className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.85fr)]">
            <AdminOrderList
              orders={orders}
              selectedOrderId={selectedOrderId}
              isLoading={isLoading}
              onSelectOrder={setSelectedOrderId}
            />

            <AdminOrderDetail
              order={selectedOrder}
              isUpdatingStatus={isUpdatingStatus}
              onUpdateStatus={handleUpdateStatus}
            />
          </section>
        )}
      </div>
    </main>
  );
}
