import { Card, CardContent } from "@/components/ui/card";

import { AdminOrder } from "../../types";
import { AdminOrderCard } from "./admin-order-card";
import { AdminOrderListSkeleton } from "./admin-order-list-skeleton";
import { AdminOrdersEmptyState } from "../feedback/admin-orders-empty-state";

type AdminOrderListProps = {
  orders: AdminOrder[];
  totalOrders: number;
  selectedOrderId: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isFiltered: boolean;
  onSelectOrder: (orderId: string) => void;
  onClearFilters: () => void;
};

export function AdminOrderList({
  orders,
  totalOrders,
  selectedOrderId,
  isLoading,
  isRefreshing,
  isFiltered,
  onSelectOrder,
  onClearFilters,
}: AdminOrderListProps) {
  const orderCountLabel =
    orders.length === totalOrders
      ? `${orders.length} orders`
      : `${orders.length} of ${totalOrders} orders`;

  return (
    <Card className="rounded-[2rem]">
      <CardContent className="p-4">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">Order List</h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {isLoading ? "Loading orders..." : orderCountLabel}
            </p>
          </div>

          {isRefreshing && !isLoading ? (
            <span
              aria-live="polite"
              className="rounded-full bg-[var(--color-surface-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-text-secondary)]"
            >
              Refreshing...
            </span>
          ) : null}
        </div>

        {isLoading ? (
          <AdminOrderListSkeleton />
        ) : orders.length === 0 ? (
          <AdminOrdersEmptyState
            isFiltered={isFiltered}
            onClearFilters={onClearFilters}
          />
        ) : (
          <div className="space-y-3 lg:max-h-[650px] lg:overflow-y-auto lg:pr-1">
            {orders.map((order) => (
              <AdminOrderCard
                key={order.id}
                order={order}
                isSelected={order.id === selectedOrderId}
                onClick={() => onSelectOrder(order.id)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
