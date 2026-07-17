import { Card } from "@/components/ui/card";

import type { AdminCategoriesSummary } from "../../types/admin-category.types";
import {
  SkeletonCard,
  SkeletonLine,
} from "@/components/ui/skeleton/skeleton-parts";

interface AdminCategoriesSummaryProps {
  summary: AdminCategoriesSummary;
}

const SUMMARY_ITEMS = [
  {
    key: "total",
    label: "Categories",
    description: "All menu categories",
  },
  {
    key: "active",
    label: "Active",
    description: "Visible in the menu",
  },
  {
    key: "inactive",
    label: "Inactive",
    description: "Hidden from customers",
  },
] as const;

export function AdminCategoriesSummary({
  summary,
}: AdminCategoriesSummaryProps) {
  return (
    <section
      aria-label="Category summary"
      className="grid gap-3 md:grid-cols-3"
    >
      {SUMMARY_ITEMS.map((item) => (
        <Card
          key={item.key}
          className={[
            "rounded-xl p-4 shadow-none",
            "border border-[var(--color-border)]",
            "bg-[var(--color-surface)]",
          ].join(" ")}
        >
          <p className="text-xs font-medium text-[var(--color-text-secondary)]">
            {item.label}
          </p>

          <p className="mt-1.5 text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">
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

export function AdminCategoriesSummarySkeleton() {
  return (
    <section
      aria-label="Loading category summary"
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
    >
      {Array.from({ length: 3 }).map((_, index) => (
        <SkeletonCard key={index} className="p-5">
          <SkeletonLine className="h-4 w-24" />
          <SkeletonLine className="mt-3 h-8 w-14" />
          <SkeletonLine className="mt-2 h-3 w-32" />
        </SkeletonCard>
      ))}
    </section>
  );
}
