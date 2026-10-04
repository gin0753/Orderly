"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { CustomerStatePanel } from "@/components/ui/customer-state-panel";

export default function CustomerError({ reset }: { reset: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <CustomerStatePanel
      eyebrow="Something went wrong"
      title="We couldn’t load this page"
      description="Something went wrong while loading this page. Try again, or return to the menu."
      icon="!"
      headingRef={headingRef}
      announce
      actions={
        <>
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-[var(--color-brand-strong)] px-6 text-sm font-semibold text-[var(--color-text-inverse)] hover:bg-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-6 text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2"
          >
            Browse menu
          </Link>
        </>
      }
    />
  );
}
