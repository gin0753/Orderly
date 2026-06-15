import { Card, CardContent } from "@/components/ui/card";

import { AdminOrder, AdminOrderStatus } from "../types";

type AdminOrdersSummaryProps = {
  orders: AdminOrder[];
};

const summaryItems: Array<{
  label: string;
  status: AdminOrderStatus;
  helper: string;
}> = [
  {
    label: "New",
    status: "PENDING",
    helper: "Needs attention",
  },
  {
    label: "Preparing",
    status: "PREPARING",
    helper: "In kitchen",
  },
  {
    label: "Ready",
    status: "READY",
    helper: "Ready for pickup",
  },
  {
    label: "Completed",
    status: "COMPLETED",
    helper: "Fulfilled orders",
  },
];

export function AdminOrdersSummary({ orders }: AdminOrdersSummaryProps) {
  return (
    <section className="mb-5 grid gap-3 md:grid-cols-4">
      {summaryItems.map((item) => {
        const value = orders.filter(
          (order) => order.status === item.status,
        ).length;

        return (
          <Card key={item.status} className="rounded-3xl">
            <CardContent className="p-4 md:p-5">
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                {item.label}
              </p>

              <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>

              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                {item.helper}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
