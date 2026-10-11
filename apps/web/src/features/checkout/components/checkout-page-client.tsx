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
  DELIVERY_FEE_CENTS,
  getDeliveryFeeCents,
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
import { logoutCustomer } from "@/features/customer-auth/store/customer-auth-slice";
import { clearCheckoutReturnDraft, readCheckoutReturnDraft, saveCheckoutReturnDraft, withCustomerPrefill, type ContactField } from "../checkout-customer";

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
  configuredDeliveryFeeCents?: number;
  pickupEnabled?: boolean;
  deliveryEnabled?: boolean;
  minimumOrderAmountCents?: number;
};

export function CheckoutPageClient({
  initialIsAcceptingOrders = true,
  configuredDeliveryFeeCents = DELIVERY_FEE_CENTS,
  pickupEnabled = true,
  deliveryEnabled = true,
  minimumOrderAmountCents = 0,
}: CheckoutPageClientProps) {
  const [checkout, setCheckout] = useState(() => readCheckoutReturnDraft() ?? {
    form: initialFormState,
    touched: { fullName: false, email: false, phone: false },
  });
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [needsSessionRecovery, setNeedsSessionRecovery] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [isRedirectingToSuccess, setIsRedirectingToSuccess] = useState(false);
  const [isAcceptingOrders, setIsAcceptingOrders] = useState(
    initialIsAcceptingOrders,
  );
  const submitErrorRef = useRef<HTMLDivElement>(null);
  const checkoutRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<HTMLDivElement>(null);

  const customer = useAppSelector((state) => state.customerAuth.customer);
  const authNotice = useAppSelector((state) => state.customerAuth.notice);
  const requiresSessionRecovery = needsSessionRecovery || authNotice === "Your session expired. Sign in again to continue.";
  const [unavailableMethods, setUnavailableMethods] = useState({
    pickup: false,
    delivery: false,
  });
  const canPickup = pickupEnabled && !unavailableMethods.pickup;
  const canDeliver = deliveryEnabled && !unavailableMethods.delivery;
  const prefilledForm = withCustomerPrefill(checkout.form, checkout.touched, customer);
  const selectedMethodEnabled =
    prefilledForm.fulfillmentType === "pickup" ? canPickup : canDeliver;
  const form = {
    ...prefilledForm,
    fulfillmentType: selectedMethodEnabled
      ? prefilledForm.fulfillmentType
      : canPickup
        ? "pickup" as const
        : canDeliver
          ? "delivery" as const
          : prefilledForm.fulfillmentType,
  };
  const orderingAvailable = isAcceptingOrders && (canPickup || canDeliver);
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
    configuredDeliveryFeeCents,
  });

  const isCartEmpty = cartItems.length === 0;
  const minimumRemainingCents = Math.max(minimumOrderAmountCents - subtotalCents, 0);

  useEffect(() => {
    const action = actionRef.current;
    const checkoutElement = checkoutRef.current;
    if (!action || !checkoutElement) return;
    const measure = () => checkoutElement.style.setProperty("--checkout-action-height", `${action.getBoundingClientRect().height}px`);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(action);
    return () => observer.disconnect();
  }, [hasClientHydrated, hasHydrated, isCartEmpty, isRedirectingToSuccess]);

  useEffect(() => {
    if (submitError) {
      submitErrorRef.current?.focus({ preventScroll: true });
      submitErrorRef.current?.scrollIntoView?.({ block: "center", behavior: "instant" });
    }
  }, [submitError]);

  useEffect(() => { clearCheckoutReturnDraft(); }, []);

  function updateForm(patch: Partial<CheckoutFormState>) {
    setCheckout((current) => ({
      ...current,
      form: { ...current.form, ...patch },
    }));
  }

  function updateContactForm(patch: Partial<CheckoutFormState>) {
    setCheckout((current) => {
      const touched = { ...current.touched };
      for (const field of ["fullName", "email", "phone"] as ContactField[]) {
        if (Object.hasOwn(patch, field)) touched[field] = true;
      }
      return { form: { ...current.form, ...patch }, touched };
    });
  }

  async function continueAsGuest() {
    if (isRecovering) return;
    setIsRecovering(true);
    try {
      await dispatch(logoutCustomer()).unwrap();
      setNeedsSessionRecovery(false);
      setSubmitError("Your customer session has been cleared. Review your details, then place the order as a guest.");
    } catch {
      setSubmitError("We couldn’t clear your session. Please try again or sign in again.");
    } finally { setIsRecovering(false); }
  }

  async function handleContinue() {
    setHasSubmitted(true);
    setSubmitError(null);

    if (hasFieldErrors) {
      window.requestAnimationFrame(() => {
        const invalidField = document.querySelector<HTMLElement>('[aria-invalid="true"]');
        invalidField?.focus({ preventScroll: true });
        invalidField?.scrollIntoView?.({ block: "center", behavior: "instant" });
      });
      return;
    }

    if (
      isSubmitting ||
      !orderingAvailable ||
      minimumRemainingCents > 0 ||
      requiresSessionRecovery
    ) {
      return;
    }

    setIsSubmitting(true);

    try {
      const createOrderRequest = buildCreateOrderRequest({
        form,
        cartItems,
      });

      const order = await createOrder(createOrderRequest, { expectCustomer: Boolean(customer) });

      saveTrackingLookup({
        orderNumber: order.orderNumber,
        email: createOrderRequest.customer.email,
        phone: createOrderRequest.customer.phone,
      });

      clearCheckoutReturnDraft();

      setIsRedirectingToSuccess(true);
      dispatch(clearCart());

      router.push(
        `/order-success?orderNumber=${encodeURIComponent(
          order.orderNumber,
        )}&totalCents=${order.totalCents}&orderType=${order.orderType}`,
      );
    } catch (error) {
      const storePaused =
        error instanceof ApiError &&
        error.status === 400 &&
        /store is not currently accepting orders/i.test(error.message);
      const restrictedMethod =
        error instanceof ApiError && error.status === 400
          ? /^(Pickup|Delivery) is not currently available\./i
              .exec(error.message)?.[1]?.toLowerCase() as CheckoutFormState["fulfillmentType"] | undefined
          : undefined;

      if (error instanceof ApiError && error.status === 401) {
        setNeedsSessionRecovery(true);
        setSubmitError("Your customer session expired before this order was placed. Your cart and entered details are still here.");
      } else if (restrictedMethod) {
        setUnavailableMethods((current) => ({ ...current, [restrictedMethod]: true }));
        setSubmitError(`${restrictedMethod === "delivery" ? "Delivery" : "Pickup"} is currently unavailable. Review the available fulfillment method before trying again.`);
      } else if (storePaused) {
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
    <div ref={checkoutRef} className="transaction-checkout bg-[var(--color-background)] px-[var(--page-gutter)] py-6 lg:py-10">
      <div className="mx-auto max-w-[var(--customer-content-width)]">
        <div className="mb-8">
          <h1 className="text-[length:var(--text-page-title)] font-bold leading-[var(--leading-page-title)] tracking-tight text-[var(--color-text-primary)]">
            Checkout
          </h1>
          <p className="mt-3 text-base leading-6 text-[var(--color-text-secondary)]">
            Review your order and enter your details.
          </p>
          <p className="mt-2 break-words text-sm leading-6 text-[var(--color-text-secondary)]">
            {customer ? <>Signed in as <span className="font-semibold text-[var(--color-text-primary)]">{customer.email}</span>. You can use different contact details for this order.</> : <>Checking out as a guest. <Link href="/login?returnTo=%2Fcheckout" onClick={() => saveCheckoutReturnDraft(checkout)} className="font-semibold text-[var(--color-brand-text)] underline underline-offset-2">Sign in</Link> if you have an account.</>}
          </p>

          <div className="mt-6">
            <CheckoutStepIndicator />
          </div>
        </div>
        <p role="status" aria-live="polite" className="sr-only">{isSubmitting ? "Placing your order. Please wait." : ""}</p>

        {!orderingAvailable ? (
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

        {minimumRemainingCents > 0 ? (
          <section role="status" className="mt-6 rounded-2xl border border-[var(--color-warning-border)] bg-[var(--color-warning-surface)] p-4">
            <h2 className="font-bold text-[var(--color-warning-strong)]">Minimum order {formatMoneyFromCents(minimumOrderAmountCents)}</h2>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Add {formatMoneyFromCents(minimumRemainingCents)} more to your cart to order. The minimum applies to the subtotal for pickup and delivery, before fees.</p>
          </section>
        ) : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
          <div className="grid gap-5">
            {submitError || requiresSessionRecovery ? (
              <div
                ref={submitErrorRef}
                tabIndex={-1}
                role="alert"
                className="scroll-mt-24 rounded-[var(--radius-card)] border border-[var(--color-danger-border)] bg-[var(--color-danger-surface)] p-5 text-sm font-medium leading-6 text-[var(--color-danger-strong)]"
              >
                {submitError ?? "Your customer session ended. Sign in again or explicitly continue as a guest before placing this order."}
              </div>
            ) : null}
            {requiresSessionRecovery ? <div className="flex flex-wrap gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <Link href="/login?returnTo=%2Fcheckout" onClick={() => saveCheckoutReturnDraft(checkout)} className="inline-flex h-10 items-center justify-center rounded-full bg-[var(--color-brand-strong)] px-5 text-sm font-semibold text-[var(--color-text-inverse)]">Sign in again</Link>
              <Button type="button" variant="secondary" disabled={isRecovering} onClick={() => { void continueAsGuest(); }}>{isRecovering ? "Clearing session…" : "Continue as guest"}</Button>
            </div> : null}
            <FulfillmentSelector
              pickupEnabled={canPickup}
              deliveryEnabled={canDeliver}
              deliveryFeeCents={getDeliveryFeeCents(subtotalCents, "delivery", configuredDeliveryFeeCents)}
              value={form.fulfillmentType}
              onChange={(fulfillmentType) => updateForm({ fulfillmentType })}
            />

            <CustomerDetailsForm
              form={form}
              errors={visibleErrors}
              onChange={updateContactForm}
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
                configuredDeliveryFeeCents={configuredDeliveryFeeCents}
                fulfillmentType={form.fulfillmentType}
                isAcceptingOrders={orderingAvailable}
              />
            </div>
          </div>

          <div className="hidden lg:block">
            <CheckoutOrderSummary
              items={cartItems}
              subtotalCents={subtotalCents}
              configuredDeliveryFeeCents={configuredDeliveryFeeCents}
              fulfillmentType={form.fulfillmentType}
              validationErrors={summaryErrors}
              disabled={isSubmitting || minimumRemainingCents > 0 || requiresSessionRecovery}
              onSubmitLabel={isSubmitting ? "Placing order..." : "Place Order"}
              onSubmit={handleContinue}
              isAcceptingOrders={orderingAvailable}
            />
          </div>
        </div>
      </div>

      <div ref={actionRef} className="transaction-checkout-action fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-border)] bg-[var(--color-surface)] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[var(--shadow-overlay)] lg:hidden">
        <div className="mx-auto flex max-w-[var(--customer-content-width)] items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-[var(--color-text-secondary)]">Total</p>
            <p className="text-xl font-bold tabular-nums text-[var(--color-text-primary)]">
              {formatMoneyFromCents(totalCents)}
            </p>
          </div>

          <Button
            type="button"
            aria-busy={isSubmitting}
            disabled={isSubmitting || !orderingAvailable || minimumRemainingCents > 0 || requiresSessionRecovery}
            onClick={handleContinue}
            className="min-h-12 h-auto max-w-[65%] shrink-0 whitespace-normal rounded-[var(--radius-control)] px-5 py-3 text-sm font-semibold"
          >
            {!orderingAvailable
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
