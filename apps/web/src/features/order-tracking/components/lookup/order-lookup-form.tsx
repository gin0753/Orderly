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
  GuestOrderLookupRequest,
  SubmitStatus,
} from "../../types/order-tracking.types";
import { saveTrackingLookup } from "../../utils/order-tracking-storage";

const normalizeOrderNumber = (value: string) => {
  return value.trim().replace(/^#/, "");
};

const normalizePhone = (value: string) => {
  return value.replace(/\D/g, "");
};

const isEmail = (value: string) => {
  return /\S+@\S+\.\S+/.test(value);
};

const buildLookupPayload = (
  orderNumber: string,
  contact: string,
): GuestOrderLookupRequest => {
  const cleanOrderNumber = normalizeOrderNumber(orderNumber);
  const cleanContact = contact.trim();

  if (isEmail(cleanContact)) {
    return {
      orderNumber: cleanOrderNumber,
      email: cleanContact.toLowerCase(),
    };
  }

  return {
    orderNumber: cleanOrderNumber,
    phone: normalizePhone(cleanContact),
  };
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
  const [contact, setContact] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [invalidField, setInvalidField] = useState<"orderNumber" | "contact" | null>(null);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const errorRef = useRef<HTMLDivElement>(null);

  const isBusy = submitStatus !== "idle";

  function showError(message: string, field: "orderNumber" | "contact" | null = null) {
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
    const cleanContact = contact.trim();

    if (!cleanOrderNumber) {
      showError("Please enter your order number.", "orderNumber");
      return;
    }

    if (!cleanContact) {
      showError("Please enter the email or phone number used at checkout.", "contact");
      return;
    }

    const payload = buildLookupPayload(orderNumber, contact);

    if (!payload.email && (!payload.phone || payload.phone.length < 6)) {
      showError("Please enter a valid phone number.", "contact");
      return;
    }

    setError(null);
    setInvalidField(null);
    setSubmitStatus("submitting");

    try {
      const order = await lookupGuestOrder(payload);

      saveTrackingLookup({
        orderNumber: order.orderNumber,
        email: payload.email,
        phone: payload.phone,
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
          htmlFor="contact"
          className="text-sm font-medium text-[var(--color-text-primary)]"
        >
          Email or phone
        </label>

        <Input
          id="contact"
          value={contact}
          onChange={(event) => { setContact(event.target.value); if (invalidField === "contact") { setError(null); setInvalidField(null); } }}
          placeholder="you@email.com or phone number"
          autoComplete="off"
          disabled={isBusy}
          aria-invalid={invalidField === "contact"}
          aria-describedby={`tracking-contact-help${invalidField === "contact" ? " tracking-contact-error" : ""}`}
        />

        <p id="tracking-contact-help" className="text-sm text-[var(--color-text-muted)]">
          Use the same contact detail you entered at checkout.
        </p>
        {invalidField === "contact" ? <p id="tracking-contact-error" className="text-sm text-[var(--color-danger-strong)]">{error}</p> : null}
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
