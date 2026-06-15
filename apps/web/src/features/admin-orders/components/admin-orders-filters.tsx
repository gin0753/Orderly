import { SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AdminOrderFilters, AdminOrderStatus, AdminOrderType } from "../types";

type AdminOrdersFiltersProps = {
  filters: AdminOrderFilters;
  onOrderTypeChange: (orderType?: AdminOrderType) => void;
  onStatusChange: (status?: AdminOrderStatus) => void;
};

const orderTypeFilters: Array<{
  label: string;
  value?: AdminOrderType;
}> = [
  { label: "All" },
  { label: "Pickup", value: "PICKUP" },
  { label: "Delivery", value: "DELIVERY" },
];

const statusFilters: Array<{
  label: string;
  value?: AdminOrderStatus;
}> = [
  { label: "New", value: "PENDING" },
  { label: "Preparing", value: "PREPARING" },
  { label: "Ready", value: "READY" },
  { label: "Completed", value: "COMPLETED" },
];

export function AdminOrdersFilters({
  filters,
  onOrderTypeChange,
  onStatusChange,
}: AdminOrdersFiltersProps) {
  return (
    <Card className="mb-5 flex flex-col gap-3 rounded-3xl p-3 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible md:pb-0">
        {orderTypeFilters.map((filter) => {
          const isActive =
            filters.orderType === filter.value ||
            (!filters.orderType && filter.label === "All");

          return (
            <Button
              key={filter.label}
              type="button"
              variant={isActive ? "brand" : "secondary"}
              size="sm"
              aria-pressed={isActive}
              className="shrink-0"
              onClick={() => onOrderTypeChange(filter.value)}
            >
              {filter.label}
            </Button>
          );
        })}

        <span className="hidden h-9 w-px bg-[var(--color-border)] md:block" />

        {statusFilters.map((filter) => {
          const isActive = filters.status === filter.value;

          return (
            <Button
              key={filter.label}
              type="button"
              variant={isActive ? "dark" : "secondary"}
              size="sm"
              aria-pressed={isActive}
              className="shrink-0"
              onClick={() =>
                onStatusChange(isActive ? undefined : filter.value)
              }
            >
              {filter.label}
            </Button>
          );
        })}
      </div>

      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="w-fit shrink-0"
        disabled
      >
        <SlidersHorizontal className="size-4" />
        Filters
      </Button>
    </Card>
  );
}
