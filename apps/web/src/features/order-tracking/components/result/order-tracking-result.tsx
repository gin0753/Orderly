"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { OrderlyLogo } from "@/components/brand/orderly-logo";
import { Card } from "@/components/ui/card";

import { useOrderTracking } from "../../hooks/use-order-tracking";
import { formatMoneyFromCents } from "../../utils/order-tracking-utils";
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
        <header className="mb-8 flex items-center justify-between gap-4">
          <Link href="/" aria-label="Go to Orderly menu">
            <OrderlyLogo size="md" />
          </Link>

          <Link
            href="/"
            className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
          >
            Back to menu
          </Link>
        </header>

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
        <OrderTrackingVerificationState />
      </OrderTrackingPageShell>
    );
  }

  if (error || !order) {
    return (
      <OrderTrackingPageShell>
        <OrderTrackingErrorState error={error} onRetry={refreshOrder} />
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

          <Card className="border-[var(--color-brand-soft)] bg-[var(--color-notice-background)] p-6">
            <p className="text-sm font-semibold text-[var(--color-notice-foreground)]">
              Need help with this order?
            </p>

            <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
              Keep your order number ready when contacting support.
            </p>

            <p className="mt-4 text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
              {formatMoneyFromCents(order.totalCents)}
            </p>
          </Card>
        </div>
      </div>
    </OrderTrackingPageShell>
  );
}
