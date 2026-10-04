"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { OrderTrackingErrorKind } from "../../api/order-tracking-api";

type OrderTrackingErrorStateProps = {
  orderNumber: string;
  errorKind: OrderTrackingErrorKind;
  message?: string | null;
  onRetry: () => void;
};

export function OrderTrackingErrorState({
  orderNumber,
  errorKind,
  message,
  onRetry,
}: OrderTrackingErrorStateProps) {
  const router = useRouter();
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
        <Card role="alert" className="w-full max-w-xl border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-danger-background)] text-2xl font-bold text-[var(--color-danger-foreground)]">
            !
          </div>

          <h1
            ref={headingRef}
            tabIndex={-1}
            className="mt-5 text-2xl font-bold tracking-tight text-[var(--color-text-primary)]"
          >
            {errorKind === "invalid-details"
              ? "Order not found"
              : "Tracking unavailable"}
          </h1>

          <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">
            {message}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Button type="button" onClick={onRetry}>
              Try again
            </Button>

            <Button
              type="button"
              className="border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
              onClick={() =>
                router.push(`/track-order?orderNumber=${encodeURIComponent(orderNumber)}`)
              }
            >
              Re-enter details
            </Button>
          </div>
        </Card>
    </div>
  );
}
