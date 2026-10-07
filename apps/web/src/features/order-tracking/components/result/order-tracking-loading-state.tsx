import {
  SkeletonBlock,
  SkeletonCard,
  SkeletonLine,
} from "@/components/ui/skeleton/skeleton-parts";

export function OrderTrackingLoadingState() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading order.</span>
      <div aria-hidden="true">
        <SkeletonLine className="mb-8 h-10 w-36" />

        <div className="grid gap-6 lg:grid-cols-[1fr_0.75fr]">
          <SkeletonCard className="h-80 p-6">
            <SkeletonLine className="h-8 w-52" />
            <SkeletonBlock className="mt-6 h-24 rounded-3xl" />
            <SkeletonBlock className="mt-6 h-32 rounded-3xl" />
          </SkeletonCard>

          <SkeletonCard className="h-80 p-6">
            <SkeletonLine className="h-7 w-40" />
            <div className="mt-6 space-y-4">
              <SkeletonBlock className="h-16 rounded-2xl" />
              <SkeletonBlock className="h-16 rounded-2xl" />
              <SkeletonBlock className="h-16 rounded-2xl" />
            </div>
          </SkeletonCard>
        </div>
      </div>
    </div>
  );
}
