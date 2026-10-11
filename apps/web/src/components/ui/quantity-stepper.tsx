"use client";

type QuantityStepperProps = {
  value: number;
  min?: number;
  max?: number;
  onChange: (nextValue: number) => void;
  className?: string;
  label?: string;
};

export function QuantityStepper({
  value,
  min = 1,
  max = 99,
  onChange,
  className = "",
  label,
}: QuantityStepperProps) {
  return (
    <div
      className={`inline-flex shrink-0 items-center overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] ${className}`}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="cursor-pointer flex h-[var(--button-height-sm,2.25rem)] w-[var(--button-height-icon,2.5rem)] items-center justify-center text-lg text-[var(--color-text-strong)] transition duration-[var(--motion-feedback,150ms)] hover:bg-[var(--color-surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-ring)] disabled:cursor-not-allowed disabled:text-[var(--color-text-disabled)]"
        aria-label={label ? `Decrease quantity for ${label}` : "Decrease quantity"}
      >
        −
      </button>

      <div className="flex h-[var(--button-height-sm,2.25rem)] min-w-10 items-center justify-center px-3 text-sm font-semibold text-[var(--color-text-primary)]">
        {value}
      </div>

      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="cursor-pointer flex h-[var(--button-height-sm,2.25rem)] w-[var(--button-height-icon,2.5rem)] items-center justify-center text-lg text-[var(--color-text-strong)] transition duration-[var(--motion-feedback,150ms)] hover:bg-[var(--color-surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-ring)] disabled:cursor-not-allowed disabled:text-[var(--color-text-disabled)]"
        aria-label={label ? `Increase quantity for ${label}` : "Increase quantity"}
      >
        +
      </button>
    </div>
  );
}
