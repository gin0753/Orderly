import { useId } from "react";
import { Input } from "@/components/ui/input";
import type { CheckoutFieldErrors, CheckoutFormState } from "../checkout-types";

type CustomerDetailsFormProps = {
  form: CheckoutFormState;
  errors: CheckoutFieldErrors;
  onChange: (patch: Partial<CheckoutFormState>) => void;
};

export function CustomerDetailsForm({
  form,
  errors,
  onChange,
}: CustomerDetailsFormProps) {
  const prefix = useId();
  return (
    <section className="rounded-[var(--radius-card)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-surface)] sm:p-6">
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
          Customer Details
        </h2>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          We&apos;ll use this to send updates about your order.
        </p>
      </div>

      <div className="mt-5 grid gap-4">
        <div className="grid gap-2">
          <label htmlFor={`${prefix}-fullName`} className="text-sm font-medium text-[var(--color-text-primary)]">
            Full name
          </label>
          <Input
            id={`${prefix}-fullName`}
            aria-describedby={errors.fullName ? `${prefix}-fullName-error` : undefined}
            value={form.fullName}
            onChange={(event) => onChange({ fullName: event.target.value })}
            placeholder="Enter your full name"
            autoComplete="name"
            aria-invalid={Boolean(errors.fullName)}
            className={
              errors.fullName
                ? "border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-[var(--color-danger)]/15"
                : undefined
            }
          />
          {errors.fullName ? <FieldError id={`${prefix}-fullName-error`}>{errors.fullName}</FieldError> : null}
        </div>

        <div className="grid gap-2">
          <label htmlFor={`${prefix}-phone`} className="text-sm font-medium text-[var(--color-text-primary)]">
            Phone number
          </label>
          <Input
            id={`${prefix}-phone`}
            aria-describedby={errors.phone ? `${prefix}-phone-error` : undefined}
            type="tel"
            value={form.phone}
            onChange={(event) => onChange({ phone: event.target.value })}
            placeholder="(+61) 123–456789"
            autoComplete="tel"
            aria-invalid={Boolean(errors.phone)}
            className={
              errors.phone
                ? "border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-[var(--color-danger)]/15"
                : undefined
            }
          />
          {errors.phone ? <FieldError id={`${prefix}-phone-error`}>{errors.phone}</FieldError> : null}
        </div>

        <div className="grid gap-2">
          <label htmlFor={`${prefix}-email`} className="text-sm font-medium text-[var(--color-text-primary)]">
            Email address
          </label>
          <Input
            id={`${prefix}-email`}
            aria-describedby={errors.email ? `${prefix}-email-error` : undefined}
            type="email"
            value={form.email}
            onChange={(event) => onChange({ email: event.target.value })}
            placeholder="you@email.com"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            className={
              errors.email
                ? "border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-[var(--color-danger)]/15"
                : undefined
            }
          />
          {errors.email ? <FieldError id={`${prefix}-email-error`}>{errors.email}</FieldError> : null}
        </div>
      </div>
    </section>
  );
}

function FieldError({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <span id={id} className="text-sm font-medium text-[var(--color-danger-strong)]">
      {children}
    </span>
  );
}
