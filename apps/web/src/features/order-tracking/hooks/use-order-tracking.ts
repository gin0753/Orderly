"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  lookupGuestOrder,
  OrderTrackingLookupError,
  TRACKING_UNAVAILABLE_MESSAGE,
  type OrderTrackingErrorKind,
} from "../api/order-tracking-api";
import { getTrackingLookup } from "../utils/order-tracking-storage";
import type {
  GuestOrderLookupRequest,
  OrderTrackingResponse,
} from "../types/order-tracking.types";
import { isTerminalOrderStatus } from "../utils/order-status-copy";

function normaliseOrderNumber(value: string) {
  return value.trim().replace(/^#/, "");
}

export function useOrderTracking(orderNumber: string) {
  const [order, setOrder] = useState<OrderTrackingResponse | null>(null);
  const [error, setError] = useState<{
    kind: OrderTrackingErrorKind;
    message: string;
  } | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);
  const isPollingRef = useRef(false);

  const normalisedOrderNumber = useMemo(
    () => normaliseOrderNumber(orderNumber),
    [orderNumber],
  );

  const getStoredLookupPayload =
    useCallback((): GuestOrderLookupRequest | null => {
      const receipt = getTrackingLookup();
      if (receipt && normaliseOrderNumber(receipt.orderNumber) === normalisedOrderNumber) {
        return { orderNumber: normalisedOrderNumber, receiptCode: receipt.receiptCode };
      }
      // No receipt: the server may authorize only the authenticated matching owner.
      return { orderNumber: normalisedOrderNumber };
    }, [normalisedOrderNumber]);

  const loadOrder = useCallback(
    async (
      mode: "initial" | "refresh" = "initial",
      announceRefresh = false,
    ) => {
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
      if (announceRefresh) {
        setRefreshMessage(null);
      }

      try {
        const nextOrder = await lookupGuestOrder(payload);
        setOrder(nextOrder);
        setNeedsVerification(false);
        if (announceRefresh) {
          setRefreshMessage("Order status refreshed.");
        }
      } catch (err) {
        setOrder(null);
        if (err instanceof OrderTrackingLookupError && err.kind === "invalid-details") {
          // Retain the submitted proof on retry. Never silently switch to owner access.
          if (payload.receiptCode === undefined) setNeedsVerification(true);
        }
        setError({
          kind:
            err instanceof OrderTrackingLookupError
              ? err.kind
              : "unavailable",
          message:
            err instanceof OrderTrackingLookupError
              ? err.message
              : TRACKING_UNAVAILABLE_MESSAGE,
        });
      } finally {
        setIsInitialLoading(false);
        setIsRefreshing(false);
      }
    },
    [getStoredLookupPayload],
  );

  const refreshOrder = useCallback(() => {
    void loadOrder("refresh", true);
  }, [loadOrder]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadOrder("initial");
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
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
    refreshMessage,
  };
}
