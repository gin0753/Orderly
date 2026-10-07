import { Card } from "@/components/ui/card";
import { OrderLookupForm } from "@/features/order-tracking/components/lookup/order-lookup-form";

export const metadata = {
  title: "Track order",
  description: "View the latest status of your Orderly Kitchen order.",
};

const trackingBenefits = [
  "Current order status",
  "Pickup or delivery details",
  "Latest order status",
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

type TrackOrderPageProps = {
  searchParams: Promise<{
    orderNumber?: string;
  }>;
};

export default async function TrackOrderPage({
  searchParams,
}: TrackOrderPageProps) {
  const params = await searchParams;
  const initialOrderNumber = params.orderNumber ?? "";
  return (
    <div className="bg-[var(--color-page-background)] px-4 py-6 text-[var(--color-text-primary)] md:px-8 md:py-10">
      <div className="mx-auto max-w-7xl">
        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <Card className="overflow-hidden border-[var(--color-border)] bg-[var(--color-surface)] p-0">
            <div className="grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div className="px-5 py-5 sm:px-6 md:p-8">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-brand)]">
                  Track your order
                </p>

                <h1 className="max-w-lg text-3xl font-bold leading-tight tracking-[-0.04em] md:text-4xl">
                  Check your order status
                </h1>

                <p className="mt-3 max-w-lg text-sm leading-6 md:text-base md:leading-7 text-[var(--color-text-secondary)]">
                  Enter your order number and the email or phone number used at
                  checkout to view your latest order status.
                </p>
              </div>

              <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6 md:p-8 xl:border-l xl:border-t-0">
                <div className="mx-auto flex h-full max-w-md flex-col justify-center xl:pt-2">
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
                      Find your order
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                      Your order number is shown on the confirmation page after
                      checkout.
                    </p>
                  </div>

                  <OrderLookupForm initialOrderNumber={initialOrderNumber} />
                </div>
              </div>
            </div>
          </Card>

          <aside className="grid min-w-0 content-start gap-4">
            <div className="space-y-3">
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
            <Card className="border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <h2 className="text-lg font-bold tracking-tight text-[var(--color-text-primary)]">
                What you can track
              </h2>

              <div className="mt-5 space-y-4">
                {trackingBenefits.map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-strong)] text-xs font-bold text-[var(--color-text-inverse)]">
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
    </div>
  );
}
