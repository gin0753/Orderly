import { Card, CardContent } from "@/components/ui/card";

import { AdminOrder, AdminOrdersMeta } from "../../types";
import { AdminOrderCard } from "./admin-order-card";
import { AdminOrderListSkeleton } from "./admin-order-list-skeleton";
import { AdminOrdersEmptyState } from "../feedback/admin-orders-empty-state";
import { AdminOrdersPagination } from "../admin-orders-pagination";

type AdminOrderListProps = {
  orders: AdminOrder[];
  meta: AdminOrdersMeta;
  selectedOrderId: string | null;
  isLoading: boolean;
  isFiltered: boolean;
  onSelectOrder: (orderId: string) => void;
  onClearFilters: () => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

export function AdminOrderList({
  orders,
  meta,
  selectedOrderId,
  isLoading,
  isFiltered,
  onSelectOrder,
  onClearFilters,
  onPageChange,
  onPageSizeChange,
}: AdminOrderListProps) {
  const orderCountLabel = isLoading
    ? "Loading orders..."
    : `${orders.length} of ${meta.total} orders`;

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

        {!isLoading && orders.length > 0 ? (
          <AdminOrdersPagination
            meta={meta}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
