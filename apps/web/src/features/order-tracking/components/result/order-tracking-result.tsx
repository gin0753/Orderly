"use client";

import type { ReactNode } from "react";

import { useOrderTracking } from "../../hooks/use-order-tracking";
import { OrderStatusTimeline } from "./order-status-timeline";
import { OrderTrackingDetails } from "./order-tracking-details";
import { OrderTrackingErrorState } from "./order-tracking-error-state";
import { OrderTrackingHeader } from "./order-tracking-header";
import { OrderTrackingLoadingState } from "./order-tracking-loading-state";
import { OrderTrackingVerificationState } from "./order-tracking-verification-state";
import { TrackingOrderSummary } from "./tracking-order-summary";

type OrderTrackingResultProps = {
  orderNumber: string;
};

type OrderTrackingPageShellProps = {
  children: ReactNode;
};

function OrderTrackingPageShell({ children }: OrderTrackingPageShellProps) {
  return (
    <main className="min-h-screen bg-[var(--color-page-background)] px-4 py-6 text-[var(--color-text-primary)] md:px-8 md:py-10">
      <div className="mx-auto max-w-6xl">
        {children}
      </div>
    </main>
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
  } = useOrderTracking(orderNumber);

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
          error={error}
          onRetry={refreshOrder}
        />
      </OrderTrackingPageShell>
    );
  }

  return (
    <OrderTrackingPageShell>
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
