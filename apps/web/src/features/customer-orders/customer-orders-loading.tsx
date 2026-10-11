import { SkeletonCard, SkeletonLine } from "@/components/ui/skeleton/skeleton-parts";

export function CustomerOrdersLoading({ detail = false }: { detail?: boolean }) {
  return <div role="status" className="space-y-4">
    <span className="sr-only">{detail ? "Loading order…" : "Loading your orders…"}</span>
    <div aria-hidden="true" className="space-y-4">
      {Array.from({ length: detail ? 2 : 3 }, (_, index) => <SkeletonCard key={index} className="p-5 sm:p-6">
        <SkeletonLine className="h-6 w-2/3" />
        <SkeletonLine className="mt-3 h-4 w-1/2" />
        <div className="mt-5 flex justify-between gap-6 border-t border-[var(--color-border)] pt-4">
          <SkeletonLine className="h-5 w-1/3" /><SkeletonLine className="h-5 w-1/4" />
        </div>
      </SkeletonCard>)}
    </div>
  </div>;
}
