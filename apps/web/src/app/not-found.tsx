import Link from "next/link";

import { CustomerShell } from "@/components/layout/customer-shell";
import { CustomerStatePanel } from "@/components/ui/customer-state-panel";

export default function NotFound() {
  return (
    <CustomerShell>
      <CustomerStatePanel
        eyebrow="404"
        title="Page not found"
        description="The page you’re looking for may have moved or no longer exists."
        icon="404"
        actions={
          <>
            <Link
              href="/"
              className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-[var(--color-brand-strong)] px-6 text-sm font-semibold text-[var(--color-text-inverse)] hover:bg-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2"
            >
              Browse menu
            </Link>
            <Link
              href="/track-order"
              className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-6 text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2"
            >
              Track order
            </Link>
          </>
        }
      />
    </CustomerShell>
  );
}
