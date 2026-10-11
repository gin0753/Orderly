import type { FulfillmentType } from "../checkout-types";
import { DELIVERY_FEE_CENTS } from "../checkout-utils";
import { formatMoneyFromCents } from "@/lib/format-money";
import { Check, ShoppingBag, Truck } from "lucide-react";

type FulfillmentSelectorProps = {
  value: FulfillmentType;
  onChange: (value: FulfillmentType) => void;
  deliveryFeeCents?: number;
  pickupEnabled?: boolean;
  deliveryEnabled?: boolean;
};

const options: Array<{
  value: FulfillmentType;
  title: string;
  description: string;
  price: string;
}> = [
  {
    value: "pickup",
    title: "Pickup",
    description: "Collect your order from the restaurant",
    price: "Free",
  },
  {
    value: "delivery",
    title: "Delivery",
    description: "Have your order delivered to your address",
    price: "",
  },
];

export function FulfillmentSelector({
  value,
  onChange,
  deliveryFeeCents = DELIVERY_FEE_CENTS,
  pickupEnabled = true,
  deliveryEnabled = true,
}: FulfillmentSelectorProps) {
  return (
    <section className="rounded-[var(--radius-card)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-surface)] sm:p-6">
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
          Fulfillment
        </h2>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          How would you like to receive your order?
        </p>
      </div>

      <div role="group" aria-label="Fulfillment method" className="mt-5 grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const isSelected = value === option.value;
          const isEnabled = option.value === "pickup" ? pickupEnabled : deliveryEnabled;

          return (
            <button
              key={option.value}
              type="button"
              disabled={!isEnabled}
              aria-pressed={isSelected && isEnabled}
              onClick={() => onChange(option.value)}
              className={[
                "flex min-w-0 items-center gap-3 rounded-[var(--radius-control)] border p-4 text-left transition cursor-pointer disabled:cursor-not-allowed",
                isSelected
                  ? "border-[var(--color-brand-strong)] bg-[var(--color-brand-soft)] shadow-[inset_0_0_0_1px_var(--color-brand-strong)]"
                  : "border-[var(--color-control-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-muted)]",
              ].join(" ")}
            >
              <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-[var(--color-surface-muted)] text-[var(--color-brand-text)]">
                {option.value === "pickup" ? <ShoppingBag className="size-5" /> : <Truck className="size-5" />}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-[var(--color-text-primary)]">
                  {option.title}
                </span>
                <span className="mt-1 block text-sm text-[var(--color-text-secondary)]">
                  {isEnabled ? option.description : "Currently unavailable"}
                </span>
                <span
                  className={[
                    "mt-1 block text-sm font-semibold",
                    option.value === "pickup"
                      ? "text-[var(--color-success-strong)]"
                      : "text-[var(--color-text-primary)]",
                  ].join(" ")}
                >
                  {option.value === "delivery"
                    ? formatMoneyFromCents(deliveryFeeCents)
                    : option.price}
                </span>
              </span>

              <span
                aria-hidden="true"
                className={[
                  "flex size-5 shrink-0 items-center justify-center rounded-full border",
                  isSelected
                    ? "border-[var(--color-brand-strong)] bg-[var(--color-brand-strong)] text-[var(--color-text-inverse)]"
                    : "border-[var(--color-control-border)]",
                ].join(" ")}
              >{isSelected ? <Check className="size-3.5" /> : null}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
