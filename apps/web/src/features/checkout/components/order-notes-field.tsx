import { Textarea } from "@/components/ui/textarea";
import { useId } from "react";
import type { CheckoutFormState } from "../checkout-types";

type OrderNotesFieldProps = {
  form: CheckoutFormState;
  onChange: (patch: Partial<CheckoutFormState>) => void;
};

const MAX_NOTES_LENGTH = 200;

export function OrderNotesField({ form, onChange }: OrderNotesFieldProps) {
  const value = form.orderNotes;
  const notesId = useId();

  return (
    <section className="rounded-[var(--radius-card)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-surface)] sm:p-6">
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
          Order Notes{" "}
          <span className="font-normal text-[var(--color-text-muted)]">
            (Optional)
          </span>
        </h2>
        <p id={`${notesId}-help`} className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Add any special instructions for the restaurant.
        </p>
      </div>

      <div className="mt-5 grid gap-2">
        <label htmlFor={notesId} className="sr-only">Order notes</label>
        <Textarea
          id={notesId}
          aria-describedby={`${notesId}-help ${notesId}-count`}
          value={value}
          maxLength={MAX_NOTES_LENGTH}
          onChange={(event) => onChange({ orderNotes: event.target.value })}
          placeholder="e.g. No onions, extra sauce on the side"
          className="min-h-32 p-4"
        />

        <span id={`${notesId}-count`} className="block text-right text-xs text-[var(--color-text-muted)]">
          {value.length}/{MAX_NOTES_LENGTH} characters
        </span>
      </div>
    </section>
  );
}
