"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function OrderTrackingVerificationState() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[var(--color-page-background)] px-4 py-6 text-[var(--color-text-primary)] md:px-8 md:py-10">
      <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
        <Card className="border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-notice-background)] text-2xl">
            🔒
          </div>

          <h1 className="mt-5 text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Verify your order first
          </h1>

          <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">
            For your privacy, we need your order number and the email or phone
            used at checkout before showing order details.
          </p>

          <Button
            type="button"
            className="mt-6 w-full"
            onClick={() => router.push("/track-order")}
          >
            Track order
          </Button>
        </Card>
      </div>
    </main>
  );
}
