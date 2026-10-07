import Link from "next/link";

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="mx-auto grid w-full max-w-6xl gap-5 px-4 py-6 sm:grid-cols-[1fr_auto] sm:px-6 lg:px-8">
        <div>
          <p className="text-lg font-extrabold tracking-tight text-[var(--color-text-primary)]">
            Orderly Kitchen
          </p>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Comfort food, made easy to order.
          </p>
        </div>

        <nav aria-label="Footer navigation" className="-ml-3 flex items-center gap-1 sm:ml-0">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
          >
            Menu
          </Link>
          <Link
            href="/track-order"
            className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
          >
            Track order
          </Link>
        </nav>

        <p className="border-t border-[var(--color-border)] pt-4 text-xs text-[var(--color-text-muted)] sm:col-span-2">
          © {currentYear} Orderly Kitchen.
        </p>
      </div>
    </footer>
  );
}
