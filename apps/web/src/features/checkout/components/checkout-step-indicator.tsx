export function CheckoutStepIndicator() {
  return (
    <ol aria-label="Order progress" className="flex items-center gap-3 text-sm">
      <li aria-current="step" className="flex items-center gap-2 font-semibold text-[var(--color-text-primary)]">
        <span aria-hidden="true" className="flex size-7 items-center justify-center rounded-full bg-[var(--color-brand-surface)] text-xs text-[var(--color-on-brand)]">1</span>
        Details
      </li>
      <li aria-hidden="true" className="h-px w-8 bg-[var(--color-control-border)]" />
      <li className="flex items-center gap-2 text-[var(--color-text-secondary)]">
        <span aria-hidden="true" className="flex size-7 items-center justify-center rounded-full bg-[var(--color-surface-muted)] text-xs">2</span>
        Confirmed
      </li>
    </ol>
  );
}
