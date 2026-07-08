const steps = [
  { number: 1, label: "Details" },
  { number: 2, label: "Review" },
  { number: 3, label: "Confirmed" },
];

export function CheckoutStepIndicator() {
  return (
    <div className="flex items-center justify-center gap-4 border-b border-[var(--color-border)] pb-6">
      {steps.map((step, index) => {
        const isActive = step.number === 1;

        return (
          <div key={step.number} className="flex items-center gap-4">
            <div className="flex flex-col items-center gap-2">
              <div
                className={[
                  "flex size-9 items-center justify-center rounded-full text-sm font-semibold",
                  isActive
                    ? "bg-[var(--color-brand)] text-[var(--color-text-inverse)]"
                    : "bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]",
                ].join(" ")}
              >
                {step.number}
              </div>

              <span
                className={[
                  "text-xs font-medium",
                  isActive
                    ? "text-[var(--color-text-primary)]"
                    : "text-[var(--color-text-muted)]",
                ].join(" ")}
              >
                {step.label}
              </span>
            </div>

            {index < steps.length - 1 ? (
              <div className="hidden h-px w-24 bg-[var(--color-border)] sm:block" />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
