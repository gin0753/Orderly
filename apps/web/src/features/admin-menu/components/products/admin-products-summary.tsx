import { Card } from "@/components/ui/card";

import type { AdminProductsSummary } from "../../types/admin-product.types";
import {
  SkeletonCard,
  SkeletonLine,
} from "@/components/ui/skeleton/skeleton-parts";

interface AdminProductsSummaryProps {
  summary: AdminProductsSummary;
}

const SUMMARY_ITEMS = [
  {
    key: "total",
    label: "Products",
    description: "All menu products",
  },
  {
    key: "available",
    label: "Available",
    description: "Available to customers",
  },
  {
    key: "unavailable",
    label: "Unavailable",
    description: "Temporarily unavailable",
  },
] as const;

export function AdminProductsSummary({ summary }: AdminProductsSummaryProps) {
  return (
    <section
      aria-label="Product summary"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
    >
      {SUMMARY_ITEMS.map((item) => (
        <Card
          key={item.key}
          className={[
            "border border-[var(--color-border)]",
            "bg-[var(--color-surface)] p-5",
          ].join(" ")}
        >
          <p className="text-sm font-medium text-[var(--color-text-secondary)]">
            {item.label}
          </p>

          <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            {summary[item.key]}
          </p>

          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            {item.description}
          </p>
        </Card>
      ))}
    </section>
  );
}

export function AdminProductsSummarySkeleton() {
  return (
    <section
      aria-label="Loading product summary"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
    >
      {Array.from({ length: 3 }).map((_, index) => (
        <SkeletonCard key={index} className="p-5">
          <SkeletonLine className="h-4 w-24" />
          <SkeletonLine className="mt-3 h-8 w-14" />
          <SkeletonLine className="mt-2 h-3 w-36" />
        </SkeletonCard>
      ))}
    </section>
  );
}
