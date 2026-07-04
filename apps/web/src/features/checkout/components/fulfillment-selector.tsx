import type { FulfillmentType } from "../checkout-types";

type FulfillmentSelectorProps = {
  value: FulfillmentType;
  onChange: (value: FulfillmentType) => void;
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
    description: "20–30 min",
    price: "Free",
    icon: "🛍️",
  },
  {
    value: "delivery",
    title: "Delivery",
    description: "30–45 min",
    price: "$3.99",
    icon: "🚗",
  },
];

export function FulfillmentSelector({
  value,
  onChange,
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

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={[
                "flex items-center gap-4 rounded-2xl border p-4 text-left transition cursor-pointer",
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
                  {option.description}
                </span>
                <span
                  className={[
                    "mt-1 block text-sm font-semibold",
                    option.value === "pickup"
                      ? "text-[var(--color-success)]"
                      : "text-[var(--color-text-primary)]",
                  ].join(" ")}
                >
                  {option.price}
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
