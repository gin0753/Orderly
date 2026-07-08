import { AlertCircle, AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type AdminOrdersLoadErrorStateProps = {
  message: string;
  isRetrying: boolean;
  onRetry: () => void;
};

export function AdminOrdersLoadErrorState({
  message,
  isRetrying,
  onRetry,
}: AdminOrdersLoadErrorStateProps) {
  return (
    <Card className="rounded-3xl border-[var(--color-danger-border)] bg-[var(--color-danger-surface)]">
      <CardContent className="flex flex-col items-center justify-center p-10 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-[var(--color-surface)]/70 text-[var(--color-danger-strong)]">
          <AlertTriangle className="size-5" />
        </span>

        <h2 className="mt-4 text-lg font-bold text-[var(--color-danger-strong)]">
          Unable to load orders
        </h2>

        <p className="mt-2 max-w-md text-sm text-[var(--color-danger-strong)]/80">
          {message}
        </p>

        <Button
          type="button"
          variant="danger"
          size="md"
          onClick={onRetry}
          disabled={isRetrying}
          className="mt-5"
        >
          <RefreshCw
            className={isRetrying ? "size-4 animate-spin" : "size-4"}
          />
          {isRetrying ? "Retrying..." : "Try again"}
        </Button>
      </CardContent>
    </Card>
  );
}

type AdminOrdersInlineErrorProps = {
  message: string;
  isRetrying: boolean;
  onRetry: () => void;
};

export function AdminOrdersInlineError({
  message,
  isRetrying,
  onRetry,
}: AdminOrdersInlineErrorProps) {
  return (
    <Card className="mb-5 rounded-3xl border-[var(--color-danger-border)] bg-[var(--color-danger-surface)]">
      <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-[var(--color-danger-strong)]" />

          <div>
            <p className="text-sm font-bold text-[var(--color-danger-strong)]">
              Action failed
            </p>

            <p className="mt-1 text-sm text-[var(--color-danger-strong)]/80">
              {message}
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="danger"
          size="sm"
          onClick={onRetry}
          disabled={isRetrying}
          className="w-fit"
        >
          <RefreshCw
            className={isRetrying ? "size-4 animate-spin" : "size-4"}
          />
          {isRetrying ? "Retrying..." : "Try again"}
        </Button>
      </CardContent>
    </Card>
  );
}
