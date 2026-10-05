"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAppDispatch, useAppSelector } from "@/store/hooks";

import { CheckoutStepIndicator } from "./checkout-step-indicator";
import { FulfillmentSelector } from "./fulfillment-selector";
import { CustomerDetailsForm } from "./customer-details-form";
import { DeliveryAddressForm } from "./delivery-address-form";
import { OrderNotesField } from "./order-notes-field";
import { CheckoutOrderSummary } from "./checkout-order-summary";
import type { CheckoutFormState } from "../checkout-types";
import {
  getCheckoutFieldErrors,
  getCheckoutTotalCents,
  hasCheckoutFieldErrors,
} from "../checkout-utils";
import { buildCreateOrderRequest } from "../checkout-mappers";
import { formatMoneyFromCents } from "@/lib/format-money";
import { getCartSubtotalCents } from "@/features/cart/cart-utils";
import { selectCartHasHydrated, clearCart } from "@/features/cart/cart-slice";
import { CheckoutSkeleton } from "@/features/checkout/components/checkout-skeleton";
import { createOrder } from "@/features/checkout/api/create-order";
import { CheckoutTransition } from "./checkout-transition";
import { Button } from "@/components/ui/button";
import { saveTrackingLookup } from "@/features/order-tracking/utils/order-tracking-storage";
import { ApiError } from "@/lib/api-fetch";
import { useHasHydrated } from "@/hooks/use-has-hydrated";

const initialFormState: CheckoutFormState = {
  fulfillmentType: "pickup",
  fullName: "",
  phone: "",
  email: "",
  address: "",
  apartment: "",
  city: "",
  state: "",
  postcode: "",
  orderNotes: "",
};

type CheckoutPageClientProps = {
  initialIsAcceptingOrders?: boolean;
};

export function CheckoutPageClient({
  initialIsAcceptingOrders = true,
}: CheckoutPageClientProps) {
  const [form, setForm] = useState<CheckoutFormState>(initialFormState);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isRedirectingToSuccess, setIsRedirectingToSuccess] = useState(false);
  const [isAcceptingOrders, setIsAcceptingOrders] = useState(
    initialIsAcceptingOrders,
  );
  const submitErrorRef = useRef<HTMLDivElement>(null);

  const fieldErrors = getCheckoutFieldErrors(form);
  const hasFieldErrors = hasCheckoutFieldErrors(fieldErrors);
  const visibleErrors = hasSubmitted ? fieldErrors : {};
  const summaryErrors = [
    ...(hasSubmitted ? Object.values(fieldErrors) : []),
    submitError,
  ].filter((message): message is string => Boolean(message));
  const router = useRouter();
  const dispatch = useAppDispatch();

  const cartItems = useAppSelector((state) => state.cart.items);
  const hasHydrated = useAppSelector(selectCartHasHydrated);
  const hasClientHydrated = useHasHydrated();

  const subtotalCents = useMemo(() => {
    return getCartSubtotalCents(cartItems);
  }, [cartItems]);

  const totalCents = getCheckoutTotalCents({
    subtotalCents,
    fulfillmentType: form.fulfillmentType,
  });

  const isCartEmpty = cartItems.length === 0;

  useEffect(() => {
    if (submitError) {
      submitErrorRef.current?.focus();
    }
  }, [submitError]);

  function updateForm(patch: Partial<CheckoutFormState>) {
    setForm((current) => ({
      ...current,
      ...patch,
    }));
  }

  async function handleContinue() {
    setHasSubmitted(true);
    setSubmitError(null);

    if (hasFieldErrors) {
      window.requestAnimationFrame(() => {
        document
          .querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus();
      });
      return;
    }

    if (isSubmitting || !isAcceptingOrders) {
      return;
    }

    setIsSubmitting(true);

    try {
      const createOrderRequest = buildCreateOrderRequest({
        form,
        cartItems,
      });

      const order = await createOrder(createOrderRequest);

      saveTrackingLookup({
        orderNumber: order.orderNumber,
        email: createOrderRequest.customer.email,
        phone: createOrderRequest.customer.phone,
      });

      setIsRedirectingToSuccess(true);
      dispatch(clearCart());

      router.push(
        `/order-success?orderNumber=${encodeURIComponent(
          order.orderNumber,
        )}&totalCents=${order.totalCents}&orderType=${order.orderType}`,
      );
    } catch (error) {
      const availabilityChanged =
        error instanceof ApiError &&
        error.status === 400 &&
        /not currently (accepting|available)/i.test(error.message);

      if (availabilityChanged) {
        setIsAcceptingOrders(false);
        setSubmitError(
          "Ordering is paused. Your details are still here, and you can try again when the kitchen is accepting orders.",
        );
      } else {
        setSubmitError(
          "We couldn’t place your order. Please check your details and try again.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!hasClientHydrated || !hasHydrated) {
    return <CheckoutSkeleton />;
  }

  if (isRedirectingToSuccess) {
    return <CheckoutTransition />;
  }

  if (isCartEmpty) {
    return (
      <div className="bg-[var(--color-background)] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-2xl flex-col items-center justify-center rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-16 text-center shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-brand-text)]">
            Checkout
          </p>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Your cart is empty
          </h1>

          <p className="mt-3 max-w-md text-[var(--color-text-secondary)]">
            Add a few favourites from the menu before starting checkout.
          </p>

          <Link
            href="/"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-2xl bg-[var(--color-brand-strong)] px-6 text-sm font-semibold text-[var(--color-text-inverse)] transition hover:bg-[var(--color-text-primary)]"
          >
            Browse menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-background)] px-4 py-6 pb-28 sm:px-6 lg:px-8 lg:pb-10">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-5 shadow-sm sm:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Checkout
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Review your order and enter your details.
          </p>

          <div className="mt-6">
            <CheckoutStepIndicator />
          </div>
        </div>

        {!isAcceptingOrders ? (
          <section
            role="status"
            className="mt-6 rounded-2xl border border-[var(--color-warning-border)] bg-[var(--color-warning-surface)] p-4"
          >
            <h2 className="font-bold text-[var(--color-warning-strong)]">
              Ordering is paused
            </h2>
            <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">
              Your cart and details are preserved. Checkout will be available
              when the kitchen is accepting orders again.
            </p>
          </section>
        ) : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
          <div className="grid gap-5">
            {submitError ? (
              <div
                ref={submitErrorRef}
                tabIndex={-1}
                role="alert"
                className="rounded-2xl border border-[var(--color-danger-border)] bg-[var(--color-danger-surface)] p-4 text-sm font-medium text-[var(--color-danger-strong)]"
              >
                {submitError}
              </div>
            ) : null}
            <FulfillmentSelector
              value={form.fulfillmentType}
              onChange={(fulfillmentType) => updateForm({ fulfillmentType })}
            />

            <CustomerDetailsForm
              form={form}
              errors={visibleErrors}
              onChange={updateForm}
            />

            {form.fulfillmentType === "delivery" ? (
              <DeliveryAddressForm
                form={form}
                errors={visibleErrors}
                onChange={updateForm}
                disabled={false}
              />
            ) : null}

            <OrderNotesField form={form} onChange={updateForm} />
            <div className="lg:hidden">
              <CheckoutOrderSummary
                compact
                items={cartItems}
                subtotalCents={subtotalCents}
                fulfillmentType={form.fulfillmentType}
                isAcceptingOrders={isAcceptingOrders}
              />
            </div>
          </div>

          <div className="hidden lg:block">
            <CheckoutOrderSummary
              items={cartItems}
              subtotalCents={subtotalCents}
              fulfillmentType={form.fulfillmentType}
              validationErrors={summaryErrors}
              disabled={isSubmitting}
              onSubmitLabel={isSubmitting ? "Placing order..." : "Place Order"}
              onSubmit={handleContinue}
              isAcceptingOrders={isAcceptingOrders}
            />
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-border)] bg-[var(--color-surface)] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-12px_30px_rgba(0,0,0,0.08)] lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-[var(--color-text-secondary)]">Total</p>
            <p className="text-xl font-bold text-[var(--color-text-primary)]">
              {formatMoneyFromCents(totalCents)}
            </p>
          </div>

          <Button
            type="button"
            disabled={isSubmitting || !isAcceptingOrders}
            onClick={handleContinue}
            className="h-12 rounded-2xl px-6 text-sm font-semibold"
          >
            {!isAcceptingOrders
              ? "Ordering paused"
              : isSubmitting
                ? "Placing..."
                : "Place Order →"}
          </Button>
        </div>
      </div>
    </div>
  );
}
