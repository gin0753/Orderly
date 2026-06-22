"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type AdminOrdersErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AdminOrdersError({
  error,
  reset,
}: AdminOrdersErrorProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      <Card className="rounded-3xl border-[var(--color-danger-border)] bg-[var(--color-danger-surface)] shadow-none">
        <CardContent className="p-8">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--color-brand)]">
            Admin orders
          </p>

          <h1 className="mt-3 text-2xl font-bold text-[var(--color-danger-strong)]">
            Something went wrong
          </h1>

          <p className="mt-2 text-sm text-[var(--color-danger)]">
            We could not render the orders dashboard.
          </p>

          <p className="mt-4 rounded-2xl bg-white/70 p-4 text-sm text-[var(--color-text-secondary)]">
            {error.message}
          </p>

          <Button
            type="button"
            onClick={reset}
            className="mt-5 bg-[var(--color-danger-strong)] text-[var(--color-text-inverse)] hover:opacity-90"
          >
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
