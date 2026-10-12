"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  lookupGuestOrder,
  OrderTrackingLookupError,
  TRACKING_UNAVAILABLE_MESSAGE,
} from "../../api/order-tracking-api";
import type {
  SubmitStatus,
} from "../../types/order-tracking.types";
import { saveTrackingLookup } from "../../utils/order-tracking-storage";

const normalizeOrderNumber = (value: string) => {
  return value.trim().replace(/^#/, "");
};

const getSubmitButtonLabel = (status: SubmitStatus) => {
  if (status === "submitting") {
    return "Finding order...";
  }

  if (status === "navigating") {
    return "Opening tracking page...";
  }

  return "Track Order";
};

type OrderLookupFormProps = {
  initialOrderNumber?: string;
};

export function OrderLookupForm({
  initialOrderNumber = "",
}: OrderLookupFormProps) {
  const router = useRouter();

  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [receiptCode, setReceiptCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [invalidField, setInvalidField] = useState<"orderNumber" | "receiptCode" | null>(null);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const errorRef = useRef<HTMLDivElement>(null);

  const isBusy = submitStatus !== "idle";

  function showError(message: string, field: "orderNumber" | "receiptCode" | null = null) {
    setError(message);
    setInvalidField(field);
    requestAnimationFrame(() => {
      const target = field ? document.getElementById(field) : errorRef.current;
      target?.focus();
      target?.scrollIntoView?.({ block: "center", behavior: "instant" });
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanOrderNumber = normalizeOrderNumber(orderNumber);
    const cleanReceiptCode = receiptCode.trim();

    if (!cleanOrderNumber) {
      showError("Please enter your order number.", "orderNumber");
      return;
    }

    if (cleanReceiptCode && !/^[A-Za-z0-9_-]{43}$/.test(cleanReceiptCode)) {
      showError("Please enter the complete receipt code.", "receiptCode");
      return;
    }
    const payload = { orderNumber: cleanOrderNumber, ...(cleanReceiptCode ? { receiptCode: cleanReceiptCode } : {}) };

    setError(null);
    setInvalidField(null);
    setSubmitStatus("submitting");

    try {
      const order = await lookupGuestOrder(payload);

      saveTrackingLookup({
        orderNumber: order.orderNumber,
        receiptCode: payload.receiptCode,
        expiresAt: new Date(Date.parse(order.createdAt) + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      setSubmitStatus("navigating");

      router.push(`/track-order/${encodeURIComponent(order.orderNumber)}`);
    } catch (err) {
      setSubmitStatus("idle");

      showError(
        err instanceof OrderTrackingLookupError
          ? err.message
          : TRACKING_UNAVAILABLE_MESSAGE,
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Find your order" className="space-y-5" aria-busy={isBusy}>
      <div className="space-y-2">
        <label
          htmlFor="orderNumber"
          className="text-sm font-medium text-[var(--color-text-primary)]"
        >
          Order number
        </label>

        <Input
          id="orderNumber"
          value={orderNumber}
          onChange={(event) => { setOrderNumber(event.target.value); if (invalidField === "orderNumber") { setError(null); setInvalidField(null); } }}
          placeholder="e.g. #10045"
          autoComplete="off"
          disabled={isBusy}
          aria-invalid={invalidField === "orderNumber"}
          aria-describedby={invalidField === "orderNumber" ? "tracking-number-error" : undefined}
        />
        {invalidField === "orderNumber" ? <p id="tracking-number-error" className="text-sm text-[var(--color-danger-strong)]">{error}</p> : null}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="receiptCode"
          className="text-sm font-medium text-[var(--color-text-primary)]"
        >
          Receipt code
        </label>

        <Input
          id="receiptCode"
          value={receiptCode}
          onChange={(event) => { setReceiptCode(event.target.value); if (invalidField === "receiptCode") { setError(null); setInvalidField(null); } }}
          placeholder="Code from your order confirmation"
          autoComplete="off"
          spellCheck={false}
          data-private="true"
          disabled={isBusy}
          aria-invalid={invalidField === "receiptCode"}
          aria-describedby={`tracking-receiptCode-help${invalidField === "receiptCode" ? " tracking-receiptCode-error" : ""}`}
        />

        <p id="tracking-receiptCode-help" className="text-sm text-[var(--color-text-muted)]">
          Use the saved code from confirmation, or leave blank to use your signed-in account. Codes expire after 30 days. Lost, expired, revoked and legacy guest receipts cannot be recovered online.
        </p>
        {invalidField === "receiptCode" ? <p id="tracking-receiptCode-error" className="text-sm text-[var(--color-danger-strong)]">{error}</p> : null}
      </div>

      {error && !invalidField ? (
        <div
          ref={errorRef}
          tabIndex={-1}
          className="rounded-2xl border border-[var(--color-danger-border)] bg-[var(--color-danger-background)] px-4 py-3 text-sm text-[var(--color-danger-foreground)]"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={isBusy}>
        <span className="inline-flex items-center justify-center gap-2">
          {isBusy ? (
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-text-inverse)] border-t-transparent"
              aria-hidden="true"
            />
          ) : null}

          {getSubmitButtonLabel(submitStatus)}
        </span>
      </Button>
      <p role="status" className="sr-only">{isBusy ? getSubmitButtonLabel(submitStatus) : ""}</p>

      {submitStatus === "navigating" ? (
        <p className="text-center text-xs text-[var(--color-text-muted)]">
          Preparing your order status...
        </p>
      ) : null}
    </form>
  );
}
