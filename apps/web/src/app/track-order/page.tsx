import Link from "next/link";

import { OrderlyLogo } from "@/components/brand/orderly-logo";
import { Card } from "@/components/ui/card";
import { OrderLookupForm } from "@/features/order-tracking/components/lookup/order-lookup-form";

export const metadata = {
  title: "Track Order | Orderly",
  description: "Track your Orderly order status in real time.",
};

const trackingBenefits = [
  "Current order status",
  "Pickup or delivery details",
  "Estimated ready time",
  "Items and order total",
];

const trustHighlights = [
  {
    icon: "🔒",
    title: "Secure & private",
    description: "We only show orders that match your contact detail.",
  },
  {
    icon: "⏱",
    title: "Status updates",
    description: "Follow your order from placed to ready or completed.",
  },
];

export default function TrackOrderPage() {
  return (
    <main className="min-h-screen bg-[var(--color-page-background)] px-4 py-6 text-[var(--color-text-primary)] md:px-8 md:py-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex items-center justify-between">
          <Link
            href="/"
            aria-label="Go to Orderly home"
            className="inline-flex transition-opacity hover:opacity-80"
          >
            <OrderlyLogo size="md" />
          </Link>

          <Link
            href="/"
            className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition hover:border-[var(--color-border-hover)] hover:text-[var(--color-text-primary)]"
          >
            Back to menu
          </Link>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="overflow-hidden border-[var(--color-border)] bg-[var(--color-surface)] p-0">
            <div className="grid lg:grid-cols-[minmax(0,1fr)_380px]">
              <div className="px-6 py-10 md:px-12 md:py-14">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-brand)]">
                  Track your order
                </p>

                <h1 className="max-w-lg text-4xl font-bold leading-tight tracking-[-0.04em] md:text-5xl">
                  Track your order in real time
                </h1>

                <p className="mt-5 max-w-lg text-base leading-7 text-[var(--color-text-secondary)]">
                  Enter your order number and the email or phone number used at
                  checkout to view your latest order status.
                </p>

                <div className="mt-8 space-y-3">
                  {trustHighlights.map((item) => (
                    <div
                      key={item.title}
                      className="flex gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-muted)] text-sm">
                        {item.icon}
                      </div>

                      <div>
                        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                          {item.title}
                        </h2>
                        <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] p-6 md:p-8 lg:border-l lg:border-t-0">
                <div className="mx-auto flex h-full max-w-md flex-col justify-center lg:pt-2">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
                      Find your order
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                      Your order number is shown on the confirmation page after
                      checkout.
                    </p>
                  </div>

                  <OrderLookupForm />

                  <p className="mt-5 text-center text-sm text-[var(--color-text-muted)]">
                    Having trouble?{" "}
                    <Link
                      href="/"
                      className="font-medium text-[var(--color-brand-text)] transition hover:text-[var(--color-brand-text-hover)]"
                    >
                      Contact support
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <aside className="grid content-start gap-4">
            <Card className="border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <h2 className="text-lg font-bold tracking-tight text-[var(--color-text-primary)]">
                What you can track
              </h2>

              <div className="mt-5 space-y-4">
                {trackingBenefits.map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand)] text-xs font-bold text-[var(--color-text-inverse)]">
                      ✓
                    </span>
                    <span className="text-sm font-medium text-[var(--color-text-strong)]">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="border-[var(--color-notice-background)] bg-[var(--color-notice-background)] p-6">
              <p className="text-2xl leading-none text-[var(--color-brand)]">
                “
              </p>
              <p className="mt-2 text-lg font-semibold leading-8 tracking-tight text-[var(--color-text-primary)]">
                Know exactly where your order stands.
              </p>
              <p className="mt-3 text-sm text-[var(--color-text-muted)]">
                Simple. Fast. Orderly.
              </p>
            </Card>
          </aside>
        </section>
      </div>
    </main>
  );
}
