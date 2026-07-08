import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  SkeletonBlock,
  SkeletonCircle,
  SkeletonLine,
} from "@/components/ui/skeleton/skeleton-parts";

export function AdminOrderDetailSkeleton() {
  return (
    <Card className="overflow-hidden rounded-[2rem]">
      <CardHeader className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <SkeletonLine className="h-5 w-40" />
            <SkeletonLine className="mt-3 h-4 w-28" />
          </div>

          <SkeletonCircle className="size-10" />
        </div>
      </CardHeader>

      <CardContent className="space-y-6 p-5">
        {Array.from({ length: 4 }).map((_, index) => (
          <section key={index}>
            <SkeletonLine className="mb-3 h-4 w-24" />

            <SkeletonBlock className="rounded-2xl p-4">
              <SkeletonLine className="h-4 w-2/3 bg-[var(--color-surface)]" />
              <SkeletonLine className="mt-3 h-4 w-1/2 bg-[var(--color-surface)]" />
            </SkeletonBlock>
          </section>
        ))}
      </CardContent>

      <CardFooter className="bg-[var(--color-surface)] p-4">
        <div className="grid w-full grid-cols-2 gap-2 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-12 rounded-2xl" />
          ))}
        </div>
      </CardFooter>
    </Card>
  );
}
