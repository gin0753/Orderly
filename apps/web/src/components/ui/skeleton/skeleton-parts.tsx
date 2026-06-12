export function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-full bg-[var(--color-surface-disabled)] ${className}`}
    />
  );
}

export function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-[var(--color-surface-hover)] ring-1 ring-[var(--color-border-soft)] ${className}`}
    />
  );
}

export function SkeletonCircle({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-full bg-[var(--color-surface-disabled)] ${className}`}
    />
  );
}

export function CheckoutSkeletonCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm ${className}`}
    >
      {children}
    </section>
  );
}
