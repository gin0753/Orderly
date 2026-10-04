import {
  SkeletonBlock,
  SkeletonCard,
  SkeletonLine,
} from "@/components/ui/skeleton/skeleton-parts";

export default function CustomerLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8"
    >
      <span className="sr-only">Loading page.</span>
      <div aria-hidden="true" className="space-y-6">
        <SkeletonCard className="rounded-3xl p-6 sm:p-10">
          <SkeletonLine className="h-4 w-32" />
          <SkeletonLine className="mt-5 h-10 w-full max-w-xl" />
          <SkeletonLine className="mt-4 h-4 w-full max-w-md" />
          <SkeletonBlock className="mt-8 h-40 rounded-2xl sm:h-56" />
        </SkeletonCard>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <SkeletonCard key={index} className="h-64 rounded-3xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
