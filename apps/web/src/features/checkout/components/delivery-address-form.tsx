import type { ReactNode } from "react";

import type { CheckoutFieldErrors, CheckoutFormState } from "../checkout-types";

type DeliveryAddressFormProps = {
  form: CheckoutFormState;
  errors: CheckoutFieldErrors;
  onChange: (patch: Partial<CheckoutFormState>) => void;
  disabled: boolean;
};

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

          <input
            value={form.address}
            onChange={(event) => onChange({ address: event.target.value })}
            placeholder="Enter street address"
            autoComplete="street-address"
            aria-invalid={Boolean(errors.address)}
            className={getInputClassName(errors.address)}
          />

          {errors.address ? <FieldError>{errors.address}</FieldError> : null}
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-[var(--color-text-primary)]">
              Apt, suite, etc. optional
            </span>

            <input
              value={form.apartment}
              onChange={(event) => onChange({ apartment: event.target.value })}
              placeholder="Apartment, suite, unit, etc."
              autoComplete="address-line2"
              className={getInputClassName()}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-[var(--color-text-primary)]">
              City
            </span>

            <input
              value={form.city}
              onChange={(event) => onChange({ city: event.target.value })}
              placeholder="Enter city"
              autoComplete="address-level2"
              aria-invalid={Boolean(errors.city)}
              className={getInputClassName(errors.city)}
            />

            {errors.city ? <FieldError>{errors.city}</FieldError> : null}
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-[var(--color-text-primary)]">
              State
            </span>

            <input
              value={form.state}
              onChange={(event) => onChange({ state: event.target.value })}
              placeholder="Select state"
              autoComplete="address-level1"
              aria-invalid={Boolean(errors.state)}
              className={getInputClassName(errors.state)}
            />

            {errors.state ? <FieldError>{errors.state}</FieldError> : null}
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-[var(--color-text-primary)]">
              Postcode
            </span>

            <input
              value={form.postcode}
              onChange={(event) => onChange({ postcode: event.target.value })}
              placeholder="Enter postcode"
              autoComplete="postal-code"
              inputMode="numeric"
              aria-invalid={Boolean(errors.postcode)}
              className={getInputClassName(errors.postcode)}
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

function getInputClassName(error?: string) {
  return [
    "h-12 rounded-xl border bg-white px-4 text-sm outline-none transition placeholder:text-[var(--color-text-disabled)] focus:ring-4 disabled:cursor-not-allowed disabled:bg-[var(--color-surface-disabled)] disabled:text-[var(--color-text-muted)]",
    error
      ? "border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-[var(--color-danger-surface)]"
      : "border-[var(--color-border)] focus:border-[var(--color-brand)] focus:ring-[var(--color-brand-soft)]",
  ].join(" ");
}

function FieldError({ children }: { children: ReactNode }) {
  return (
    <span className="text-sm font-medium text-[var(--color-danger)]">
      {children}
    </span>
  );
}
