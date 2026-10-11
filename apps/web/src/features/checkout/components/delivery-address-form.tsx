import { useId, type ReactNode } from "react";

import type { CheckoutFieldErrors, CheckoutFormState } from "../checkout-types";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type DeliveryAddressFormProps = {
  form: CheckoutFormState;
  errors: CheckoutFieldErrors;
  onChange: (patch: Partial<CheckoutFormState>) => void;
  disabled: boolean;
};

const australianStates = [
  { label: "VIC", value: "VIC" },
  { label: "NSW", value: "NSW" },
  { label: "QLD", value: "QLD" },
  { label: "WA", value: "WA" },
  { label: "SA", value: "SA" },
  { label: "TAS", value: "TAS" },
  { label: "ACT", value: "ACT" },
  { label: "NT", value: "NT" },
];

export function DeliveryAddressForm({
  form,
  errors,
  onChange,
  disabled,
}: DeliveryAddressFormProps) {
  const prefix = useId();
  return (
    <section
      className={[
        "rounded-[var(--radius-card)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-surface)] transition sm:p-6",
        disabled ? "opacity-60" : "",
      ].join(" ")}
    >
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Delivery Address
          </h2>

          {disabled ? (
            <span className="rounded-full bg-[var(--color-surface-hover)] px-3 py-1 text-xs font-medium text-[var(--color-text-muted)]">
              For delivery orders only
            </span>
          ) : null}
        </div>

        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Enter where your order should be delivered.
        </p>
      </div>

      <fieldset disabled={disabled} className="mt-5 grid gap-4">
        <div className="grid gap-2">
          <label htmlFor={`${prefix}-address`} className="text-sm font-medium text-[var(--color-text-primary)]">
            Address
          </label>

          <Input
            id={`${prefix}-address`}
            aria-describedby={errors.address ? `${prefix}-address-error` : undefined}
            value={form.address}
            onChange={(event) => onChange({ address: event.target.value })}
            placeholder="Enter street address"
            autoComplete="street-address"
            aria-invalid={Boolean(errors.address)}
            className={
              errors.address
                ? "border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-[var(--color-danger)]/15"
                : undefined
            }
          />

          {errors.address ? <FieldError id={`${prefix}-address-error`}>{errors.address}</FieldError> : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <label htmlFor={`${prefix}-apartment`} className="text-sm font-medium text-[var(--color-text-primary)]">
              Apt, suite, etc. optional
            </label>

            <Input
              id={`${prefix}-apartment`}
              value={form.apartment}
              onChange={(event) => onChange({ apartment: event.target.value })}
              placeholder="Apartment, suite, unit, etc."
              autoComplete="address-line2"
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor={`${prefix}-city`} className="text-sm font-medium text-[var(--color-text-primary)]">
              City
            </label>

            <Input
              id={`${prefix}-city`}
              aria-describedby={errors.city ? `${prefix}-city-error` : undefined}
              value={form.city}
              onChange={(event) => onChange({ city: event.target.value })}
              placeholder="Enter city"
              autoComplete="address-level2"
              aria-invalid={Boolean(errors.city)}
              className={
                errors.city
                  ? "border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-[var(--color-danger)]/15"
                  : undefined
              }
            />

            {errors.city ? <FieldError id={`${prefix}-city-error`}>{errors.city}</FieldError> : null}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <label htmlFor={`${prefix}-state`} className="text-sm font-medium text-[var(--color-text-primary)]">
              State
            </label>

            <Select
              id={`${prefix}-state`}
              aria-describedby={errors.state ? `${prefix}-state-error` : undefined}
              value={form.state}
              onChange={(event) => onChange({ state: event.target.value })}
              autoComplete="address-level1"
              aria-invalid={Boolean(errors.state)}
              className={
                errors.state
                  ? "border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-[var(--color-danger)]/15"
                  : undefined
              }
            >
              <option value="">Select state</option>

              {australianStates.map((state) => (
                <option key={state.value} value={state.value}>
                  {state.label}
                </option>
              ))}
            </Select>

            {errors.state ? <FieldError id={`${prefix}-state-error`}>{errors.state}</FieldError> : null}
          </div>

          <div className="grid gap-2">
            <label htmlFor={`${prefix}-postcode`} className="text-sm font-medium text-[var(--color-text-primary)]">
              Postcode
            </label>

            <Input
              id={`${prefix}-postcode`}
              aria-describedby={errors.postcode ? `${prefix}-postcode-error` : undefined}
              value={form.postcode}
              onChange={(event) => onChange({ postcode: event.target.value })}
              placeholder="Enter postcode"
              autoComplete="postal-code"
              inputMode="numeric"
              aria-invalid={Boolean(errors.postcode)}
              className={
                errors.postcode
                  ? "border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-[var(--color-danger)]/15"
                  : undefined
              }
            />

            {errors.postcode ? (
              <FieldError id={`${prefix}-postcode-error`}>{errors.postcode}</FieldError>
            ) : null}
          </div>
        </div>
      </fieldset>
    </section>
  );
}

function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <span id={id} className="text-sm font-medium text-[var(--color-danger-strong)]">
      {children}
    </span>
  );
}
