import { Textarea } from "@/components/ui/textarea";
import type { CheckoutFormState } from "../checkout-types";

type OrderNotesFieldProps = {
  form: CheckoutFormState;
  onChange: (patch: Partial<CheckoutFormState>) => void;
};

const MAX_NOTES_LENGTH = 200;

export function OrderNotesField({ form, onChange }: OrderNotesFieldProps) {
  const value = form.orderNotes;

  return (
    <section className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
          4. Order Notes{" "}
          <span className="font-normal text-[var(--color-text-muted)]">
            (Optional)
          </span>
        </h2>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Add any special instructions for the restaurant.
        </p>
      </div>

      <label className="mt-5 block">
        <Textarea
          value={value}
          maxLength={MAX_NOTES_LENGTH}
          onChange={(event) => onChange({ orderNotes: event.target.value })}
          placeholder="e.g. No onions, extra sauce on the side"
          className="min-h-32 p-4"
        />

        <span className="mt-2 block text-right text-xs text-[var(--color-text-muted)]">
          {value.length}/{MAX_NOTES_LENGTH}
        </span>
      </label>
    </section>
  );
}
