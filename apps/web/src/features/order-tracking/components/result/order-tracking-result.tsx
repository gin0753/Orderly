"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { useOrderTracking } from "../../hooks/use-order-tracking";
import { OrderStatusTimeline } from "./order-status-timeline";
import { OrderTrackingDetails } from "./order-tracking-details";
import { OrderTrackingErrorState } from "./order-tracking-error-state";
import { OrderTrackingHeader } from "./order-tracking-header";
import { OrderTrackingLoadingState } from "./order-tracking-loading-state";
import { OrderTrackingVerificationState } from "./order-tracking-verification-state";
import { TrackingOrderSummary } from "./tracking-order-summary";
import { TRACKING_UNAVAILABLE_MESSAGE } from "../../api/order-tracking-api";

type OrderTrackingResultProps = {
  orderNumber: string;
};

type OrderTrackingPageShellProps = {
  children: ReactNode;
};

function OrderTrackingPageShell({ children }: OrderTrackingPageShellProps) {
  return (
    <div className="bg-[var(--color-page-background)] px-4 py-8 text-[var(--color-text-primary)] sm:px-6 sm:py-12">
      <div className="mx-auto max-w-6xl">
        {children}
      </div>
    </div>
  );
}

export function OrderTrackingResult({ orderNumber }: OrderTrackingResultProps) {
  const {
    order,
    error,
    isInitialLoading,
    isRefreshing,
    needsVerification,
    refreshOrder,
    refreshMessage,
  } = useOrderTracking(orderNumber);
  const focusedResult = useRef(false);
  useEffect(() => {
    if (order && !error && !isInitialLoading && !focusedResult.current) {
      focusedResult.current = true;
      document.getElementById("tracking-order-heading")?.focus({ preventScroll: true });
    }
  }, [order, error, isInitialLoading]);

  if (isInitialLoading) {
    return (
      <OrderTrackingPageShell>
        <OrderTrackingLoadingState />
      </OrderTrackingPageShell>
    );
  }

  if (needsVerification) {
    return (
      <OrderTrackingPageShell>
        <OrderTrackingVerificationState orderNumber={orderNumber} />
      </OrderTrackingPageShell>
    );
  }

  if (error || !order) {
    return (
      <OrderTrackingPageShell>
        <OrderTrackingErrorState
          orderNumber={orderNumber}
          errorKind={error?.kind ?? "unavailable"}
          message={error?.message ?? TRACKING_UNAVAILABLE_MESSAGE}
          onRetry={refreshOrder}
        />
      </OrderTrackingPageShell>
    );
  }

  return (
    <OrderTrackingPageShell>
      <p role="status" className="sr-only">
        {refreshMessage}
      </p>
      <OrderTrackingHeader
        order={order}
        isRefreshing={isRefreshing}
        onRefresh={refreshOrder}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_0.78fr]">
        <div className="space-y-6">
          <OrderStatusTimeline
            status={order.status}
            orderType={order.orderType}
            createdAt={order.createdAt}
            updatedAt={order.updatedAt}
          />

          <OrderTrackingDetails order={order} />
        </div>

        <div className="space-y-6">
          <TrackingOrderSummary order={order} />
        </div>
      </div>
    </OrderTrackingPageShell>
  );
}
