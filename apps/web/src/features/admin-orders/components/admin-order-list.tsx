import { Card, CardContent } from "@/components/ui/card";
import { SkeletonBlock } from "@/components/ui/skeleton/skeleton-parts";

import { AdminOrder } from "../types";
import { AdminOrderCard } from "./admin-order-card";

type AdminOrderListProps = {
  orders: AdminOrder[];
  totalOrders: number;
  selectedOrderId: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  onSelectOrder: (orderId: string) => void;
};

export function AdminOrderList({
  orders,
  totalOrders,
  selectedOrderId,
  isLoading,
  isRefreshing,
  onSelectOrder,
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
              {orderCountLabel}
            </p>
          </div>
          {isRefreshing && !isLoading ? (
            <span className="rounded-full bg-[var(--color-surface-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-text-secondary)]">
              Refreshing...
            </span>
          ) : null}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-[104px] rounded-3xl" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-8 text-center">
            <p className="font-semibold">No orders found</p>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Try changing your search or filters.
            </p>
          </div>
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
