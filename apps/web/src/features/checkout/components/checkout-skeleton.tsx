import {
  SkeletonLine,
  SkeletonCircle,
  SkeletonBlock,
} from "@/components/ui/skeleton/skeleton-parts";
import { cn } from "@/lib/cn";

export function CheckoutSkeletonCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function CheckoutSkeleton() {
  return (
    <main className="min-h-screen bg-[var(--color-background)] px-4 py-6 pb-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-5 shadow-sm sm:px-8">
          <div className="flex items-center justify-between gap-4">
            <SkeletonLine className="h-8 w-36" />
            <SkeletonLine className="hidden h-5 w-32 sm:block" />
          </div>

          <div className="mt-8 flex items-center justify-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <SkeletonCircle className="size-9" />
              <SkeletonLine className="h-3 w-12" />
            </div>

            <SkeletonLine className="hidden h-px w-24 sm:block" />

            <div className="flex flex-col items-center gap-2">
              <SkeletonCircle className="size-9" />
              <SkeletonLine className="h-3 w-12" />
            </div>

            <SkeletonLine className="hidden h-px w-24 sm:block" />

            <div className="flex flex-col items-center gap-2">
              <SkeletonCircle className="size-9" />
              <SkeletonLine className="h-3 w-16" />
            </div>
          </div>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
          <div className="space-y-5">
            <CheckoutSkeletonCard>
              <SkeletonLine className="h-7 w-40" />
              <SkeletonLine className="mt-3 h-4 w-72 max-w-full" />

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-hover)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                  <div className="flex items-center gap-4">
                    <SkeletonCircle className="size-11" />
                    <div className="flex-1">
                      <SkeletonLine className="h-5 w-24" />
                      <SkeletonLine className="mt-2 h-4 w-20" />
                      <SkeletonLine className="mt-2 h-4 w-14" />
                    </div>
                    <SkeletonCircle className="size-5" />
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-hover)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                  <div className="flex items-center gap-4">
                    <SkeletonCircle className="size-11" />
                    <div className="flex-1">
                      <SkeletonLine className="h-5 w-24" />
                      <SkeletonLine className="mt-2 h-4 w-20" />
                      <SkeletonLine className="mt-2 h-4 w-14" />
                    </div>
                    <SkeletonCircle className="size-5" />
                  </div>
                </div>
              </div>
            </CheckoutSkeletonCard>

            <CheckoutSkeletonCard>
              <SkeletonLine className="h-7 w-52" />
              <SkeletonLine className="mt-3 h-4 w-80 max-w-full" />

              <div className="mt-5 space-y-4">
                <div>
                  <SkeletonLine className="mb-2 h-4 w-20" />
                  <SkeletonBlock className="h-12 w-full" />
                </div>

                <div>
                  <SkeletonLine className="mb-2 h-4 w-28" />
                  <SkeletonBlock className="h-12 w-full" />
                </div>

                <div>
                  <SkeletonLine className="mb-2 h-4 w-28" />
                  <SkeletonBlock className="h-12 w-full" />
                </div>
              </div>
            </CheckoutSkeletonCard>

            <CheckoutSkeletonCard>
              <div className="flex items-center gap-3">
                <SkeletonLine className="h-7 w-44" />
                <SkeletonLine className="h-6 w-32 rounded-full" />
              </div>

              <SkeletonLine className="mt-3 h-4 w-72 max-w-full" />

              <div className="mt-5 space-y-4">
                <div>
                  <SkeletonLine className="mb-2 h-4 w-16" />
                  <SkeletonBlock className="h-12 w-full" />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <SkeletonLine className="mb-2 h-4 w-28" />
                    <SkeletonBlock className="h-12 w-full" />
                  </div>

                  <div>
                    <SkeletonLine className="mb-2 h-4 w-16" />
                    <SkeletonBlock className="h-12 w-full" />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <SkeletonLine className="mb-2 h-4 w-16" />
                    <SkeletonBlock className="h-12 w-full" />
                  </div>

                  <div>
                    <SkeletonLine className="mb-2 h-4 w-20" />
                    <SkeletonBlock className="h-12 w-full" />
                  </div>
                </div>
              </div>
            </CheckoutSkeletonCard>

            <CheckoutSkeletonCard>
              <SkeletonLine className="h-7 w-44" />
              <SkeletonLine className="mt-3 h-4 w-72 max-w-full" />

              <div className="mt-5">
                <SkeletonBlock className="h-32 w-full" />
                <div className="mt-2 flex justify-end">
                  <SkeletonLine className="h-3 w-14" />
                </div>
              </div>
            </CheckoutSkeletonCard>
          </div>

          <aside className="hidden lg:block">
            <CheckoutSkeletonCard className="sticky top-6">
              <div className="flex items-center justify-between">
                <div>
                  <SkeletonLine className="h-8 w-32" />
                  <SkeletonLine className="mt-2 h-4 w-16" />
                </div>
                <SkeletonLine className="h-4 w-16" />
              </div>

              <div className="mt-6 space-y-4">
                {[1, 2].map((item) => (
                  <div
                    key={item}
                    className="flex gap-4 rounded-2xl bg-[var(--color-surface-hover)] p-3 ring-1 ring-[var(--color-border-soft)]"
                  >
                    <SkeletonBlock className="size-20 shrink-0 rounded-2xl" />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <SkeletonLine className="h-5 w-32" />

                          <SkeletonLine className="mt-2 h-4 w-24" />
                        </div>

                        <SkeletonLine className="h-5 w-14" />
                      </div>

                      <SkeletonLine className="mt-3 h-4 w-12" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 border-t border-[var(--color-border)] pt-5">
                <div className="flex justify-between">
                  <SkeletonLine className="h-4 w-20" />
                  <SkeletonLine className="h-4 w-12" />
                </div>

                <div className="mt-5 border-t border-[var(--color-border)] pt-4">
                  <div className="flex justify-between">
                    <SkeletonLine className="h-6 w-14" />
                    <SkeletonLine className="h-6 w-16" />
                  </div>
                </div>
              </div>

              <SkeletonBlock className="mt-6 h-13 w-full rounded-2xl" />
              <SkeletonLine className="mx-auto mt-4 h-3 w-40" />
            </CheckoutSkeletonCard>
          </aside>
        </div>
      </div>
    </main>
  );
}
