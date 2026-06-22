"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  getAdminOrders,
  performAdminOrderAction,
} from "../api/admin-orders-api";
import {
  AdminOrder,
  AdminOrderAction,
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
  accepted: 0,
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

  // undefined = let the hook auto-select the first visible order.
  // null = user explicitly closed the detail panel.
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
  const [hasLoadedSuccessfully, setHasLoadedSuccessfully] = useState(false);

  // Full-page error: initial request has no usable data.
  const [error, setError] = useState<string | null>(null);

  // Inline error: page has existing data, but refresh/action/query failed.
  const [actionError, setActionError] = useState<string | null>(null);

  const requestIdRef = useRef(0);
  const hasCompletedInitialLoadRef = useRef(false);

  const loadOrders = useCallback(
    async (mode: LoadMode = "query") => {
      const requestId = ++requestIdRef.current;

      const isInitialRequest = mode === "initial";
      const isRefreshRequest = mode === "refresh";
      const isSilentRequest = mode === "silent";
      const shouldShowListSkeleton = mode === "initial" || mode === "query";

      try {
        if (shouldShowListSkeleton) {
          setIsLoadingOrders(true);
        }

        if (isRefreshRequest) {
          setIsRefreshing(true);
        }

        setError(null);
        setActionError(null);

        const response = await getAdminOrders({
          ...filters,
          search: debouncedSearchTerm || undefined,
          page: meta.page,
          pageSize: meta.pageSize,
        });

        // Ignore stale requests, such as a slower old search response
        // arriving after a newer search request has finished.
        if (requestId !== requestIdRef.current) {
          return;
        }

        setOrders(response.data);
        setSummary(response.summary);
        setMeta(response.meta);
        setHasLoadedSuccessfully(true);
      } catch {
        if (requestId !== requestIdRef.current) {
          return;
        }

        if (isInitialRequest) {
          setError(
            "Unable to load orders. Please check the API server and try again.",
          );
        } else if (isRefreshRequest) {
          setActionError(
            "Unable to refresh orders. Your current order data is still visible.",
          );
        } else if (isSilentRequest) {
          setActionError(
            "The order was updated, but the latest order list could not be refreshed.",
          );
        } else {
          setActionError(
            "Unable to load the requested orders. Please try again.",
          );
        }
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
    const loadMode = hasLoadedSuccessfully ? "refresh" : "initial";

    await loadOrders(loadMode);
  }, [hasLoadedSuccessfully, loadOrders]);

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

  async function handlePerformOrderAction(
    orderId: string,
    action: AdminOrderAction,
  ) {
    try {
      setIsUpdatingStatus(true);
      setActionError(null);

      await performAdminOrderAction(orderId, action);

      await loadOrders("silent");
    } catch {
      setActionError("Unable to update this order. Please try again.");
    } finally {
      setIsUpdatingStatus(false);
    }
  }

  const shouldShowFullPageError =
    Boolean(error) && !hasLoadedSuccessfully && !isInitialLoading;

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
    actionError,
    shouldShowFullPageError,
    setSelectedOrderId,
    setSearchTerm,
    setActionError,
    reloadOrders,
    handleOrderTypeChange,
    handleStatusChange,
    handleClearFilters,
    handlePageChange,
    handlePageSizeChange,
    handlePerformOrderAction,
  };
}
