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
  return (
    <section className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
          2. Customer Details
        </h2>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          We&apos;ll use this to send updates about your order.
        </p>
      </div>

      <div className="mt-5 grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-[var(--color-text-primary)]">
            Full name
          </span>
          <Input
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
          {errors.fullName ? <FieldError>{errors.fullName}</FieldError> : null}
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-[var(--color-text-primary)]">
            Phone number
          </span>
          <Input
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
          {errors.phone ? <FieldError>{errors.phone}</FieldError> : null}
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-[var(--color-text-primary)]">
            Email address
          </span>
          <Input
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
          {errors.email ? <FieldError>{errors.email}</FieldError> : null}
        </label>
      </div>
    </section>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-sm font-medium text-[var(--color-danger)]">
      {children}
    </span>
  );
}
