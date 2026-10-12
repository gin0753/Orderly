import { Card, CardContent } from "@/components/ui/card";

import { AdminOrdersSummary as AdminOrdersSummaryType } from "../types";

type AdminOrdersSummaryProps = {
  summary: AdminOrdersSummaryType;
};

const summaryItems: Array<{
  label: string;
  key: keyof AdminOrdersSummaryType;
  helper: string;
}> = [
  {
    label: "New",
    key: "pending",
    helper: "Needs attention",
  },
  {
    label: "Accepted",
    key: "accepted",
    helper: "Waiting to start",
  },
  {
    label: "Preparing",
    key: "preparing",
    helper: "In kitchen",
  },
  {
    label: "Ready",
    key: "ready",
    helper: "Ready for pickup",
  },
  {
    label: "Completed",
    key: "completed",
    helper: "Fulfilled orders",
  },
];

export function AdminOrdersSummary({ summary }: AdminOrdersSummaryProps) {
  return (
    <section className="mb-4 grid grid-cols-2 gap-2 sm:mb-5 sm:gap-3 lg:grid-cols-5">
      {summaryItems.map((item) => (
        <Card key={item.key} className="rounded-3xl">
          <CardContent className="p-3 sm:p-4 md:p-5">
            <p className="text-sm font-medium text-[var(--color-text-secondary)]">
              {item.label}
            </p>

            <p className="mt-1 text-3xl font-bold tracking-tight sm:mt-2">
              {summary[item.key]}
            </p>

            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              {item.helper}
            </p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
