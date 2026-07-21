import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface AdminCategoriesErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function AdminCategoriesErrorState({
  message,
  onRetry,
}: AdminCategoriesErrorStateProps) {
  return (
    <Card
      className={[
        "border border-[var(--color-danger-border)]",
        "bg-[var(--color-danger-surface)]",
        "px-6 py-12 text-center",
      ].join(" ")}
    >
      <h2 className="text-base font-semibold text-[var(--color-danger-strong)]">
        Categories could not be loaded
      </h2>

      <p className="mx-auto mt-2 max-w-lg text-sm text-[var(--color-text-secondary)]">
        {message}
      </p>

      <div className="mt-5">
        <Button type="button" onClick={onRetry}>
          Try again
        </Button>
      </div>
    </Card>
  );
}
