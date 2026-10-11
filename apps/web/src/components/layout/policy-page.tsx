import Link from "next/link";
import type { ReactNode } from "react";

export function PolicyPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-8 text-[var(--color-text-primary)] sm:px-6 md:py-12">
      <p className="text-sm font-semibold text-[var(--color-brand-text)]">Orderly portfolio demo</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      <p className="mt-3 text-sm text-[var(--color-text-secondary)]">Last updated: 8 October 2026</p>
      <div className="mt-8 space-y-7 text-sm leading-7 text-[var(--color-text-secondary)] [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-[var(--color-text-primary)] [&_p+p]:mt-3">
        {children}
      </div>
      <nav aria-label="Policy navigation" className="mt-8 flex flex-wrap gap-5 border-t border-[var(--color-border)] pt-5 text-sm">
        <Link href="/privacy" className="rounded underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-[var(--color-ring)]">Privacy Policy</Link>
        <Link href="/terms" className="rounded underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-[var(--color-ring)]">Terms of Service</Link>
      </nav>
    </article>
  );
}

export function PolicyContact() {
  return (
    <section>
      <h2>Developer contact</h2>
      <p>Contact email: <strong>[Developer contact email — owner confirmation required]</strong></p>
      <p>This placeholder is not a working contact address. The developer must replace it with a monitored email before these pages are used for the public Google OAuth release.</p>
    </section>
  );
}
