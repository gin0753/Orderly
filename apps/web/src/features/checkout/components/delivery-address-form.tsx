import type { ReactNode } from "react";

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
  return (
    <section
      className={[
        "rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition",
        disabled ? "opacity-60" : "",
      ].join(" ")}
    >
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            3. Delivery Address
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
        <label className="grid gap-2">
          <span className="text-sm font-medium text-[var(--color-text-primary)]">
            Address
          </span>

          <Input
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

          {errors.address ? <FieldError>{errors.address}</FieldError> : null}
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-[var(--color-text-primary)]">
              Apt, suite, etc. optional
            </span>

            <Input
              value={form.apartment}
              onChange={(event) => onChange({ apartment: event.target.value })}
              placeholder="Apartment, suite, unit, etc."
              autoComplete="address-line2"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-[var(--color-text-primary)]">
              City
            </span>

            <Input
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

            {errors.city ? <FieldError>{errors.city}</FieldError> : null}
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-[var(--color-text-primary)]">
              State
            </span>

            <Select
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

            {errors.state ? <FieldError>{errors.state}</FieldError> : null}
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-[var(--color-text-primary)]">
              Postcode
            </span>

            <Input
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
              <FieldError>{errors.postcode}</FieldError>
            ) : null}
          </label>
        </div>
      </fieldset>
    </section>
  );
}

function FieldError({ children }: { children: ReactNode }) {
  return (
    <span className="text-sm font-medium text-[var(--color-danger)]">
      {children}
    </span>
  );
}
