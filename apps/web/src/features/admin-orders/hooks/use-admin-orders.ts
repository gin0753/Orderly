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

function getSearchableOrderText(order: AdminOrder) {
  return [
    order.id,
    order.customerName,
    order.customerPhone,
    order.customerEmail,
    order.orderType,
    order.status,
    order.deliveryAddress,
    order.deliverySuburb,
    order.deliveryPostcode,
    order.notes,
    ...order.items.map((item) => item.productNameSnapshot),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function useAdminOrders() {
  const [allOrders, setAllOrders] = useState<AdminOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [filters, setFilters] = useState<AdminOrderFilters>({});
  const [searchTerm, setSearchTerm] = useState("");

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const reloadOrders = useCallback(async () => {
    try {
      setError(null);
      setIsRefreshing(true);

      const data = await getAdminOrders({});
      setAllOrders(data);
    } catch {
      setError("Unable to load orders. Please try again.");
    } finally {
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void reloadOrders();
  }, [reloadOrders]);

  const visibleOrders = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    return allOrders.filter((order) => {
      const matchesOrderType = filters.orderType
        ? order.orderType === filters.orderType
        : true;

      const matchesStatus = filters.status
        ? order.status === filters.status
        : true;

      const matchesSearch = normalizedSearchTerm
        ? getSearchableOrderText(order).includes(normalizedSearchTerm)
        : true;

      return matchesOrderType && matchesStatus && matchesSearch;
    });
  }, [allOrders, filters, searchTerm]);

  useEffect(() => {
    setSelectedOrderId((currentSelectedId) => {
      if (
        currentSelectedId &&
        visibleOrders.some((order) => order.id === currentSelectedId)
      ) {
        return currentSelectedId;
      }

      return visibleOrders[0]?.id ?? null;
    });
  }, [visibleOrders]);

  const selectedOrder = useMemo(() => {
    return visibleOrders.find((order) => order.id === selectedOrderId) ?? null;
  }, [visibleOrders, selectedOrderId]);

  function handleOrderTypeChange(orderType?: AdminOrderType) {
    setFilters((currentFilters) => ({
      ...currentFilters,
      orderType,
    }));
  }

  function handleStatusChange(status?: AdminOrderStatus) {
    setFilters((currentFilters) => ({
      ...currentFilters,
      status,
    }));
  }

  function handleClearFilters() {
    setFilters({});
    setSearchTerm("");
  }

  async function handleUpdateStatus(orderId: string, status: AdminOrderStatus) {
    try {
      setIsUpdatingStatus(true);
      setError(null);

      const updatedOrder = await updateAdminOrderStatus(orderId, status);

      setAllOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === updatedOrder.id ? updatedOrder : order,
        ),
      );
    } catch {
      setError("Unable to update order status. Please try again.");
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  const shouldShowFullPageError =
    Boolean(error) && allOrders.length === 0 && !isInitialLoading;

  return {
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
  };
}
