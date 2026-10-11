// Customer variables override these fallbacks only inside CustomerShell.
// Admin retains its existing dimensions, colors and focus treatment.
export const controlClasses = [
  "orderly-control w-full rounded-[var(--radius-control,0.75rem)] border border-[var(--color-control-border,var(--color-border))] bg-[var(--color-surface)] px-4 text-[length:var(--control-font-size,0.875rem)] text-[var(--color-text-primary)]",
  "placeholder:text-[var(--color-placeholder,var(--color-text-disabled))]",
  "transition duration-[var(--motion-feedback,150ms)] focus:border-[var(--color-ring)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]/15",
  "disabled:cursor-not-allowed disabled:bg-[var(--color-surface-disabled)] disabled:text-[var(--color-text-disabled)]",
].join(" ");
