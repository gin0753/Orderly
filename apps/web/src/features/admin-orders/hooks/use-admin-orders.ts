"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  getAdminOrders,
  updateAdminOrderStatus,
} from "../api/admin-orders-api";
import {
  AdminOrder,
  AdminOrderFilters,
  AdminOrdersMeta,
  AdminOrdersSummary,
  AdminOrderStatus,
  AdminOrderType,
} from "../types";

const DEFAULT_PAGE_SIZE = 10;

const initialSummary: AdminOrdersSummary = {
  total: 0,
  pending: 0,
  preparing: 0,
  ready: 0,
  completed: 0,
  cancelled: 0,
};

const initialMeta: AdminOrdersMeta = {
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

type LoadMode = "initial" | "query" | "refresh" | "silent";

export function useAdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [summary, setSummary] = useState<AdminOrdersSummary>(initialSummary);
  const [meta, setMeta] = useState<AdminOrdersMeta>(initialMeta);

  const [selectedOrderId, setSelectedOrderId] = useState<
    string | null | undefined
  >(undefined);

  const [filters, setFilters] = useState<AdminOrderFilters>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);
  const hasCompletedInitialLoadRef = useRef(false);
  const hasLoadedSuccessfullyRef = useRef(false);

  const loadOrders = useCallback(
    async (mode: LoadMode = "query") => {
      const requestId = ++requestIdRef.current;
      const isInitialRequest = mode === "initial";
      const isRefreshRequest = mode === "refresh";
      const shouldShowListSkeleton = mode === "initial" || mode === "query";

      try {
        if (shouldShowListSkeleton) {
          setIsLoadingOrders(true);
        }

        if (isRefreshRequest) {
          setIsRefreshing(true);
        }

        setError(null);

        const response = await getAdminOrders({
          ...filters,
          search: debouncedSearchTerm || undefined,
          page: meta.page,
          pageSize: meta.pageSize,
        });

        if (requestId !== requestIdRef.current) {
          return;
        }

        setOrders(response.data);
        setSummary(response.summary);
        setMeta(response.meta);

        hasLoadedSuccessfullyRef.current = true;
      } catch {
        if (requestId !== requestIdRef.current) {
          return;
        }

        setError(
          "Unable to load orders. Please check the API server and try again.",
        );
      } finally {
        if (requestId !== requestIdRef.current) {
          return;
        }

        if (shouldShowListSkeleton) {
          setIsLoadingOrders(false);
        }

        if (isRefreshRequest) {
          setIsRefreshing(false);
        }

        if (isInitialRequest || !hasCompletedInitialLoadRef.current) {
          hasCompletedInitialLoadRef.current = true;
          setIsInitialLoading(false);
        }
      }
    },
    [debouncedSearchTerm, filters, meta.page, meta.pageSize],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const nextSearchTerm = searchTerm.trim();

      setDebouncedSearchTerm(nextSearchTerm);

      setMeta((currentMeta) =>
        currentMeta.page === 1
          ? currentMeta
          : {
              ...currentMeta,
              page: 1,
            },
      );
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchTerm]);

  useEffect(() => {
    const loadMode = hasCompletedInitialLoadRef.current ? "query" : "initial";

    void loadOrders(loadMode);
  }, [loadOrders]);

  const selectedOrder = useMemo(() => {
    if (selectedOrderId === null) {
      return null;
    }

    if (selectedOrderId) {
      const selected = orders.find((order) => order.id === selectedOrderId);

      if (selected) {
        return selected;
      }
    }

    return orders[0] ?? null;
  }, [orders, selectedOrderId]);

  const activeSelectedOrderId = selectedOrder?.id ?? null;

  const reloadOrders = useCallback(async () => {
    await loadOrders("refresh");
  }, [loadOrders]);

  function handleOrderTypeChange(orderType?: AdminOrderType) {
    setFilters((currentFilters) => ({
      ...currentFilters,
      orderType,
    }));

    setMeta((currentMeta) => ({
      ...currentMeta,
      page: 1,
    }));
  }

  function handleStatusChange(status?: AdminOrderStatus) {
    setFilters((currentFilters) => ({
      ...currentFilters,
      status,
    }));

    setMeta((currentMeta) => ({
      ...currentMeta,
      page: 1,
    }));
  }

  function handleClearFilters() {
    setFilters({});
    setSearchTerm("");
    setDebouncedSearchTerm("");

    setMeta((currentMeta) => ({
      ...currentMeta,
      page: 1,
    }));
  }

  function handlePageChange(page: number) {
    setMeta((currentMeta) => ({
      ...currentMeta,
      page,
    }));
  }

  function handlePageSizeChange(pageSize: number) {
    setMeta((currentMeta) => ({
      ...currentMeta,
      page: 1,
      pageSize,
    }));
  }

  async function handleUpdateStatus(orderId: string, status: AdminOrderStatus) {
    try {
      setIsUpdatingStatus(true);
      setError(null);

      await updateAdminOrderStatus(orderId, status);

      await loadOrders("silent");
    } catch {
      setError("Unable to update order status. Please try again.");
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  const shouldShowFullPageError =
    Boolean(error) && !hasLoadedSuccessfullyRef.current && !isInitialLoading;

  return {
    orders,
    summary,
    meta,
    selectedOrder,
    selectedOrderId: activeSelectedOrderId,
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
    handlePageChange,
    handlePageSizeChange,
    handleUpdateStatus,
  };
}
