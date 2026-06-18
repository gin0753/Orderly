import * as React from "react";

import { cn } from "@/lib/cn";

export function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-full bg-[var(--color-surface-disabled)]",
        className,
      )}
    />
  );
}

export function SkeletonBlock({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-[var(--color-surface-hover)] ring-1 ring-[var(--color-border-soft)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SkeletonCircle({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-full bg-[var(--color-surface-disabled)]",
        className,
      )}
    />
  );
}

export function SkeletonCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CheckoutSkeletonCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm",
        className,
      )}
    >
      {children}
    </section>
  );
}
