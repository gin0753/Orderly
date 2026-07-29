import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  SkeletonBlock,
  SkeletonLine,
} from "@/components/ui/skeleton/skeleton-parts";

interface AdminProductEditorErrorProps {
  title: string;
  message: string;
  onBack: () => void;
  onRetry: () => void;
}
export function AdminProductEditorSkeleton() {
  return (
    <div
      aria-label="Loading product editor"
      aria-busy="true"
      className="space-y-5"
    >
      <SkeletonBlock className="h-10 w-36 rounded-md" />

      <div className="space-y-2">
        <SkeletonLine className="h-8 w-52 rounded" />

        <SkeletonLine className="h-4 w-80 max-w-full rounded" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(18rem,0.75fr)]">
        <SkeletonBlock className="h-[560px] rounded-xl" />

        <div className="space-y-6">
          <SkeletonBlock className="aspect-[4/3] rounded-xl" />

          <SkeletonBlock className="h-36 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function AdminProductEditorError({
  title,
  message,
  onBack,
  onRetry,
}: AdminProductEditorErrorProps) {
  return (
    <Card
      className={[
        "border border-[var(--color-danger-border)]",
        "bg-[var(--color-danger-surface)]",
        "px-6 py-12 text-center",
      ].join(" ")}
    >
      <h1 className="text-lg font-semibold text-[var(--color-danger-strong)]">
        {title}
      </h1>

      <p className="mx-auto mt-2 max-w-lg text-sm text-[var(--color-text-secondary)]">
        {message}
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button type="button" variant="secondary" onClick={onBack}>
          Back to products
        </Button>

        <Button type="button" onClick={onRetry}>
          Try again
        </Button>
      </div>
    </Card>
  );
}
