"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type OrderTrackingErrorStateProps = {
  error?: string | null;
  onRetry: () => void;
};

export function OrderTrackingErrorState({
  error,
  onRetry,
}: OrderTrackingErrorStateProps) {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[var(--color-page-background)] px-4 py-6 text-[var(--color-text-primary)] md:px-8 md:py-10">
      <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
        <Card className="border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-danger-background)] text-2xl font-bold text-[var(--color-danger-foreground)]">
            !
          </div>

          <h1 className="mt-5 text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Unable to load order
          </h1>

          <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">
            {error ?? "Please check your details and try again."}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Button type="button" onClick={onRetry}>
              Try again
            </Button>

            <Button
              type="button"
              className="border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
              onClick={() => router.push("/track-order")}
            >
              Re-enter details
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
