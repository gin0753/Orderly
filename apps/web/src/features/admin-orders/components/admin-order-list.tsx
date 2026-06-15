import { Card, CardContent } from "@/components/ui/card";

import { AdminOrder } from "../types";
import { AdminOrderCard } from "./admin-order-card";

type AdminOrderListProps = {
  orders: AdminOrder[];
  selectedOrderId: string | null;
  isLoading: boolean;
  onSelectOrder: (orderId: string) => void;
};

export function AdminOrderList({
  orders,
  selectedOrderId,
  isLoading,
  onSelectOrder,
}: AdminOrderListProps) {
  return (
    <Card className="rounded-[2rem]">
      <CardContent className="p-4">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">Order List</h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {orders.length} orders
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-24 animate-pulse rounded-2xl bg-[var(--color-surface-soft)]"
              />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-8 text-center">
            <p className="font-semibold">No orders found</p>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Try changing your filters.
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
