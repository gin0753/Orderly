"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { lookupGuestOrder } from "../../api/order-tracking-api";
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
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");

  const isBusy = submitStatus !== "idle";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanOrderNumber = normalizeOrderNumber(orderNumber);
    const cleanContact = contact.trim();

    if (!cleanOrderNumber) {
      setError("Please enter your order number.");
      return;
    }

    if (!cleanContact) {
      setError("Please enter the email or phone number used at checkout.");
      return;
    }

    const payload = buildLookupPayload(orderNumber, contact);

    if (!payload.email && (!payload.phone || payload.phone.length < 6)) {
      setError("Please enter a valid phone number.");
      return;
    }

    setError(null);
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

      setError(
        err instanceof Error
          ? err.message
          : "Unable to track this order. Please try again.",
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" aria-busy={isBusy}>
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
          onChange={(event) => setOrderNumber(event.target.value)}
          placeholder="e.g. #10045"
          autoComplete="off"
          disabled={isBusy}
        />
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
          onChange={(event) => setContact(event.target.value)}
          placeholder="you@email.com or phone number"
          autoComplete="off"
          disabled={isBusy}
        />

        <p className="text-xs text-[var(--color-text-muted)]">
          Use the same contact detail you entered at checkout.
        </p>
      </div>

      {error ? (
        <div
          className="rounded-2xl border border-[var(--color-danger-border)] bg-[var(--color-danger-background)] px-4 py-3 text-sm text-[var(--color-danger-foreground)]"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <Button type="submit" className="w-full" disabled={isBusy}>
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

      {submitStatus === "navigating" ? (
        <p className="text-center text-xs text-[var(--color-text-muted)]">
          Preparing your live order status...
        </p>
      ) : null}
    </form>
  );
}
