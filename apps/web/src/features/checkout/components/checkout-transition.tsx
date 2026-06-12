export function CheckoutTransition() {
  return (
    <main className="min-h-screen bg-[var(--color-background)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-16 text-center shadow-sm">
        <div className="flex size-16 items-center justify-center rounded-full bg-[var(--color-brand-soft)]">
          <div className="size-7 animate-spin rounded-full border-2 border-[var(--color-brand)] border-t-transparent" />
        </div>

        <p
          role="status"
          aria-live="polite"
          className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-brand-text)]"
        >
          Order confirmed
        </p>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Taking you to confirmation...
        </h1>

        <p className="mt-3 max-w-md text-[var(--color-text-secondary)]">
          Your order has been received. We&apos;re preparing your confirmation
          page.
        </p>
      </div>
    </main>
  );
}
