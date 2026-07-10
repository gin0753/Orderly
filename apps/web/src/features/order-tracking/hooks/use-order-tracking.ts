"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { lookupGuestOrder } from "../api/order-tracking-api";
import { TRACKING_LOOKUP_STORAGE_KEY } from "../constants/order-tracking-storage";
import type {
  GuestOrderLookupRequest,
  OrderTrackingResponse,
} from "../types/order-tracking.types";
import { isTerminalOrderStatus } from "../utils/order-status-copy";
import { normaliseOrderNumber } from "../utils/order-tracking-utils";

type StoredTrackingLookup = {
  orderNumber: string;
  email?: string;
  phone?: string;
  verifiedAt?: number;
};

export function useOrderTracking(orderNumber: string) {
  const [order, setOrder] = useState<OrderTrackingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const isPollingRef = useRef(false);

  const normalisedOrderNumber = useMemo(
    () => normaliseOrderNumber(orderNumber),
    [orderNumber],
  );

  const getStoredLookupPayload =
    useCallback((): GuestOrderLookupRequest | null => {
      const rawValue = window.sessionStorage.getItem(
        TRACKING_LOOKUP_STORAGE_KEY,
      );

      if (!rawValue) {
        return null;
      }

      try {
        const parsed = JSON.parse(rawValue) as StoredTrackingLookup;
        const storedOrderNumber = normaliseOrderNumber(
          parsed.orderNumber ?? "",
        );

        if (storedOrderNumber !== normalisedOrderNumber) {
          return null;
        }

        if (!parsed.email && !parsed.phone) {
          return null;
        }

        return {
          orderNumber: normalisedOrderNumber,
          email: parsed.email,
          phone: parsed.phone,
        };
      } catch {
        return null;
      }
    }, [normalisedOrderNumber]);

  const loadOrder = useCallback(
    async (mode: "initial" | "refresh" = "initial") => {
      const payload = getStoredLookupPayload();

      if (!payload) {
        setNeedsVerification(true);
        setIsInitialLoading(false);
        setIsRefreshing(false);
        return;
      }

      if (mode === "initial") {
        setIsInitialLoading(true);
      } else {
        setIsRefreshing(true);
      }

      setError(null);

      try {
        const nextOrder = await lookupGuestOrder(payload);
        setOrder(nextOrder);
        setNeedsVerification(false);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load this order. Please try again.",
        );
      } finally {
        setIsInitialLoading(false);
        setIsRefreshing(false);
      }
    },
    [getStoredLookupPayload],
  );

  const refreshOrder = useCallback(() => {
    void loadOrder("refresh");
  }, [loadOrder]);

  useEffect(() => {
    void loadOrder("initial");
  }, [loadOrder]);

  useEffect(() => {
    if (!order || isTerminalOrderStatus(order.status)) {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (isPollingRef.current) {
        return;
      }

      isPollingRef.current = true;

      void loadOrder("refresh").finally(() => {
        isPollingRef.current = false;
      });
    }, 30_000);

    return () => window.clearInterval(intervalId);
  }, [loadOrder, order]);

  return {
    order,
    error,
    isInitialLoading,
    isRefreshing,
    needsVerification,
    refreshOrder,
  };
}
