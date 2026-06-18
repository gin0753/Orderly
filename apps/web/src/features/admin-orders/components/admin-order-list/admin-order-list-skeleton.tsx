import {
  SkeletonCard,
  SkeletonLine,
} from "@/components/ui/skeleton/skeleton-parts";

export function AdminOrderListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <SkeletonCard key={index} className="shadow-none">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <SkeletonLine className="h-4 w-24" />
                <SkeletonLine className="h-6 w-16" />
              </div>

              <SkeletonLine className="mt-4 h-4 w-36" />

              <div className="mt-3 flex gap-3">
                <SkeletonLine className="h-3 w-20" />
                <SkeletonLine className="h-3 w-16" />
                <SkeletonLine className="h-3 w-14" />
              </div>
            </div>

            <SkeletonLine className="h-4 w-16 shrink-0" />
          </div>
        </SkeletonCard>
      ))}
    </div>
  );
}
