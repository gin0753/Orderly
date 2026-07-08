"use client";

import { useMemo, useState } from "react";
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

export function CheckoutPageClient() {
  const [form, setForm] = useState<CheckoutFormState>(initialFormState);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isRedirectingToSuccess, setIsRedirectingToSuccess] = useState(false);

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

  const subtotalCents = useMemo(() => {
    return getCartSubtotalCents(cartItems);
  }, [cartItems]);

  const totalCents = getCheckoutTotalCents({
    subtotalCents,
    fulfillmentType: form.fulfillmentType,
  });

  const isCartEmpty = cartItems.length === 0;

  function updateForm(patch: Partial<CheckoutFormState>) {
    setForm((current) => ({
      ...current,
      ...patch,
    }));
  }

  async function handleContinue() {
    setHasSubmitted(true);
    setSubmitError(null);

    if (hasFieldErrors || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const order = await createOrder(
        buildCreateOrderRequest({
          form,
          cartItems,
        }),
      );

      setIsRedirectingToSuccess(true);
      dispatch(clearCart());

      router.push(
        `/order-success?orderId=${order.orderId}&totalCents=${order.totalCents}&orderType=${order.orderType}`,
      );
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Something went wrong while placing your order.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!hasHydrated) {
    return <CheckoutSkeleton />;
  }

  if (isRedirectingToSuccess) {
    return <CheckoutTransition />;
  }

  if (isCartEmpty) {
    return (
      <main className="min-h-screen bg-[var(--color-background)] px-4 py-8 sm:px-6 lg:px-8">
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
            className="mt-8 inline-flex h-12 items-center justify-center rounded-2xl bg-[var(--color-brand)] px-6 text-sm font-semibold text-[var(--color-text-inverse)] transition hover:bg-[var(--color-brand-hover)]"
          >
            Browse menu
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--color-background)] px-4 py-6 pb-28 sm:px-6 lg:px-8 lg:pb-10">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-5 shadow-sm sm:px-8">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/"
              className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]"
            >
              Orderly
              <span className="text-[var(--color-brand)]">.</span>
            </Link>

            <div className="hidden items-center gap-2 text-sm text-[var(--color-text-secondary)] sm:flex">
              <span>🔒</span>
              <span>Secure checkout</span>
            </div>
          </div>

          <div className="mt-8">
            <CheckoutStepIndicator />
          </div>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
          <div className="grid gap-5">
            {submitError ? (
              <div className="rounded-2xl border border-[var(--color-danger-border)] bg-[var(--color-danger-surface)] p-4 text-sm font-medium text-[var(--color-danger-strong)]">
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

            <DeliveryAddressForm
              form={form}
              errors={visibleErrors}
              onChange={updateForm}
              disabled={form.fulfillmentType === "pickup"}
            />

            <OrderNotesField form={form} onChange={updateForm} />
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
            />
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[0_-12px_30px_rgba(0,0,0,0.08)] lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-[var(--color-text-secondary)]">Total</p>
            <p className="text-xl font-bold text-[var(--color-text-primary)]">
              {formatMoneyFromCents(totalCents)}
            </p>
          </div>

          <Button
            type="button"
            disabled={isSubmitting}
            onClick={handleContinue}
            className="h-12 rounded-2xl bg-[var(--color-brand)] px-6 text-sm font-semibold text-[var(--color-text-inverse)] transition hover:bg-[var(--color-brand-hover)] disabled:cursor-not-allowed disabled:bg-[var(--color-surface-disabled)] disabled:text-[var(--color-text-disabled)]"
          >
            {isSubmitting ? "Placing..." : "Place Order →"}
          </Button>
        </div>
      </div>
    </main>
  );
}
