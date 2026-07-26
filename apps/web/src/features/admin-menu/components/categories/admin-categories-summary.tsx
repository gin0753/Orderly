import { Card } from "@/components/ui/card";
import {
  SkeletonCard,
  SkeletonLine,
} from "@/components/ui/skeleton/skeleton-parts";

import type { AdminCategoriesSummary } from "../../types/admin-category.types";

interface AdminCategoriesSummaryProps {
  summary: AdminCategoriesSummary;
}

const SUMMARY_ITEMS = [
  {
    key: "total",
    label: "Categories",
    description: "All active and inactive categories",
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
  {
    key: "archived",
    label: "Archived",
    description: "Removed from normal management",
  },
] as const;

export function AdminCategoriesSummary({
  summary,
}: AdminCategoriesSummaryProps) {
  return (
    <section
      aria-label="Category summary"
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
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
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
    >
      {Array.from({ length: SUMMARY_ITEMS.length }).map((_, index) => (
        <SkeletonCard key={index} className="p-4">
          <SkeletonLine className="h-4 w-24" />
          <SkeletonLine className="mt-3 h-8 w-14" />
          <SkeletonLine className="mt-2 h-3 w-32" />
        </SkeletonCard>
      ))}
    </section>
  );
}
