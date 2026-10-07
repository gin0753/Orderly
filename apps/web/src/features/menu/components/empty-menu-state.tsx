"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function EmptyMenuState() {
  const router = useRouter();

  return (
    <div className="rounded-3xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-10 text-center">
      <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
        Menu coming soon
      </h2>
      <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
        We&apos;re getting today&apos;s menu ready. Please check back shortly.
      </p>
      <Button
        type="button"
        variant="secondary"
        className="mt-6"
        onClick={() => router.refresh()}
      >
        Refresh menu
      </Button>
    </div>
  );
}
