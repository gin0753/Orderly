import { Search, SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AdminOrderFilters, AdminOrderStatus, AdminOrderType } from "../types";

type AdminOrdersFiltersProps = {
  filters: AdminOrderFilters;
  searchTerm: string;
  visibleOrderCount: number;
  totalOrderCount: number;
  onSearchTermChange: (searchTerm: string) => void;
  onOrderTypeChange: (orderType?: AdminOrderType) => void;
  onStatusChange: (status?: AdminOrderStatus) => void;
  onClearFilters: () => void;
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
  { label: "Accepted", value: "ACCEPTED" },
  { label: "Preparing", value: "PREPARING" },
  { label: "Ready", value: "READY" },
  { label: "Completed", value: "COMPLETED" },
];

export function AdminOrdersFilters({
  filters,
  searchTerm,
  visibleOrderCount,
  totalOrderCount,
  onSearchTermChange,
  onOrderTypeChange,
  onStatusChange,
  onClearFilters,
}: AdminOrdersFiltersProps) {
  const hasActiveFilters =
    Boolean(filters.orderType) ||
    Boolean(filters.status) ||
    searchTerm.trim().length > 0;

  return (
    <Card className="mb-5 rounded-3xl p-3">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--color-text-muted)]" />

            <Input
              value={searchTerm}
              onChange={(event) => onSearchTermChange(event.target.value)}
              placeholder="Search orders, customers or items"
              className="pl-9 pr-10"
            />

            {searchTerm ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Clear search"
                onClick={() => onSearchTermChange("")}
                className="absolute right-1.5 top-1/2 h-8 w-8 -translate-y-1/2"
              >
                <X className="size-4" />
              </Button>
            ) : null}
          </div>

          <p className="text-sm text-[var(--color-text-secondary)]">
            Showing{" "}
            <span className="font-bold text-[var(--color-text-primary)]">
              {visibleOrderCount}
            </span>{" "}
            of {totalOrderCount} orders
          </p>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
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

          <div className="flex items-center gap-2">
            {hasActiveFilters ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
              >
                Clear
              </Button>
            ) : null}

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
          </div>
        </div>
      </div>
    </Card>
  );
}
