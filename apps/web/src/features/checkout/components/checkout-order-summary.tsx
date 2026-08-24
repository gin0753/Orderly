import Link from "next/link";
import Image from "next/image";
import { formatMoneyFromCents } from "@/lib/format-money";
import type { CartItem } from "@/features/cart/cart-types";
import { getCartItemOptionSummary } from "@/features/cart/cart-utils";

import {
  FREE_DELIVERY_THRESHOLD_CENTS,
  getCheckoutTotalCents,
  getDeliveryFeeCents,
  SERVICE_FEE_CENTS,
} from "../checkout-utils";
import type { FulfillmentType } from "../checkout-types";
import { Button } from "@/components/ui/button";

type CheckoutOrderSummaryProps = {
  items: CartItem[];
  subtotalCents: number;
  fulfillmentType: FulfillmentType;
  validationErrors?: string[];
  onSubmitLabel?: string;
  disabled?: boolean;
  onSubmit?: () => void;
};

export function CheckoutOrderSummary({
  items,
  subtotalCents,
  fulfillmentType,
  validationErrors = [],
  onSubmitLabel = "Continue to Review",
  disabled = false,
  onSubmit,
}: CheckoutOrderSummaryProps) {
  const deliveryFeeCents = getDeliveryFeeCents(subtotalCents, fulfillmentType);
  const totalCents = getCheckoutTotalCents({
    subtotalCents,
    fulfillmentType,
  });

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  const amountAwayFromFreeDelivery = Math.max(
    FREE_DELIVERY_THRESHOLD_CENTS - subtotalCents,
    0,
  );

  return (
    <aside className="sticky top-6 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
            Your Order
          </h2>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </p>
        </div>

        <Link
          href="/"
          className="text-sm font-semibold text-[var(--color-brand-text)] hover:text-[var(--color-brand-text-hover)]"
        >
          Edit cart
        </Link>
      </div>

      <div className="mt-6 divide-y divide-[var(--color-border)]">
        {items.map((item) => {
          const itemTotalCents = item.unitPriceCents * item.quantity;

          const optionSummary = getCartItemOptionSummary(item);

          return (
            <div key={item.key} className="flex gap-4 py-4 first:pt-0">
              <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-[var(--color-surface-hover)]">
                {item.product.imageUrl ? (
                  <Image
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                ) : null}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="line-clamp-1 font-semibold text-[var(--color-text-primary)]">
                      {item.product.name}
                    </h3>

                    {optionSummary ? (
                      <p className="mt-1 line-clamp-2 text-sm text-[var(--color-text-secondary)]">
                        {optionSummary}
                      </p>
                    ) : null}
                  </div>

                  <p className="shrink-0 font-semibold text-[var(--color-text-primary)]">
                    {formatMoneyFromCents(itemTotalCents)}
                  </p>
                </div>

                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                  Qty: {item.quantity}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 space-y-3 border-t border-[var(--color-border)] pt-5 text-sm">
        <SummaryRow
          label="Subtotal"
          value={formatMoneyFromCents(subtotalCents)}
        />

        <SummaryRow
          label="Delivery fee"
          value={
            fulfillmentType === "pickup"
              ? "Free"
              : formatMoneyFromCents(deliveryFeeCents)
          }
        />

        <SummaryRow
          label="Service fee"
          value={formatMoneyFromCents(SERVICE_FEE_CENTS)}
        />

        <div className="border-t border-[var(--color-border)] pt-4">
          <SummaryRow
            label="Total"
            value={formatMoneyFromCents(totalCents)}
            strong
          />
        </div>
      </div>

      {fulfillmentType === "delivery" && amountAwayFromFreeDelivery > 0 ? (
        <div className="mt-5 rounded-2xl bg-[var(--color-danger-surface)] p-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            You&apos;re{" "}
            <span className="font-semibold text-[var(--color-brand-text)]">
              {formatMoneyFromCents(amountAwayFromFreeDelivery)}
            </span>{" "}
            away from free delivery.
          </p>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--color-brand-soft)]">
            <div
              className="h-full rounded-full bg-[var(--color-brand)]"
              style={{
                width: `${Math.min(
                  (subtotalCents / FREE_DELIVERY_THRESHOLD_CENTS) * 100,
                  100,
                )}%`,
              }}
            />
          </div>
        </div>
      ) : null}

      {validationErrors.length > 0 ? (
        <div className="mt-5 rounded-2xl border border-[var(--color-danger-border)] bg-[var(--color-danger-surface)] p-4">
          <p className="text-sm font-semibold text-[var(--color-danger-strong)]">
            Please complete the required fields.
          </p>

          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--color-danger-strong)]">
            {validationErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <Button
        type="button"
        disabled={disabled}
        onClick={onSubmit}
        className="mt-6 h-[52px] w-full rounded-2xl bg-[var(--color-brand)] px-5 text-sm font-semibold text-[var(--color-text-inverse)] transition hover:bg-[var(--color-brand-hover)] disabled:cursor-not-allowed disabled:bg-[var(--color-surface-disabled)] disabled:text-[var(--color-text-disabled)]"
      >
        {onSubmitLabel}
      </Button>

      <p className="mt-4 text-center text-xs text-[var(--color-text-muted)]">
        🔒 Your information is secure and encrypted
      </p>
    </aside>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className={[
        "flex items-center justify-between gap-4",
        strong ? "text-lg font-bold" : "",
      ].join(" ")}
    >
      <span className="text-[var(--color-text-secondary)]">{label}</span>
      <span className="font-semibold text-[var(--color-text-primary)]">
        {value}
      </span>
    </div>
  );
}
