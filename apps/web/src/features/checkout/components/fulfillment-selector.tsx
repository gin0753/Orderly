import type { FulfillmentType } from "../checkout-types";
import { DELIVERY_FEE_CENTS } from "../checkout-utils";
import { formatMoneyFromCents } from "@/lib/format-money";

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
  icon: string;
}> = [
  {
    value: "pickup",
    title: "Pickup",
    description: "Collect your order from the restaurant",
    price: "Free",
    icon: "🛍️",
  },
  {
    value: "delivery",
    title: "Delivery",
    description: "Have your order delivered to your address",
    price: "",
    icon: "🚗",
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
    <section className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
          1. Fulfillment
        </h2>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          How would you like to receive your order?
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
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
                "flex items-center gap-4 rounded-2xl border p-4 text-left transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
                isSelected
                  ? "border-[var(--color-brand)] bg-[var(--color-brand-soft)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-hover)]",
              ].join(" ")}
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-[var(--color-surface-hover)] text-xl">
                {option.icon}
              </span>

              <span className="flex-1">
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
                className={[
                  "size-5 rounded-full border",
                  isSelected
                    ? "border-[var(--color-brand)] bg-[var(--color-brand)]"
                    : "border-[var(--color-border-hover)]",
                ].join(" ")}
              />
            </button>
          );
        })}
      </div>
    </section>
  );
}
