"use client";

type QuantityStepperProps = {
  value: number;
  min?: number;
  max?: number;
  onChange: (nextValue: number) => void;
  className?: string;
};

export function QuantityStepper({
  value,
  min = 1,
  max = 99,
  onChange,
  className = "",
}: QuantityStepperProps) {
  return (
    <div
      className={`inline-flex items-center overflow-hidden rounded-xl border border-neutral-200 bg-white ${className}`}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="flex h-9 w-10 items-center justify-center text-lg text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:text-neutral-300"
        aria-label="Decrease quantity"
      >
        −
      </button>

      <div className="flex h-9 min-w-10 items-center justify-center px-3 text-sm font-semibold text-neutral-950">
        {value}
      </div>

      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="flex h-9 w-10 items-center justify-center text-lg text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:text-neutral-300"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
