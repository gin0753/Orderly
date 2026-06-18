import { Package, Phone, Truck, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

import { AdminOrder, AdminOrderStatus } from "../../types";
import { OrderStatusBadge } from "../order-status-badge";
import { AdminOrderDetailSkeleton } from "./admin-order-detail-skeleton";
import { AdminOrderItemsSection } from "./admin-order-items-section";
import { AdminOrderPaymentSummary } from "./admin-order-payment-summary";
import { OrderStatusActions } from "./order-status-actions";

type AdminOrderDetailProps = {
  order: AdminOrder | null;
  isLoading?: boolean;
  isUpdatingStatus: boolean;
  onClose?: () => void;
  onUpdateStatus: (orderId: string, status: AdminOrderStatus) => void;
};

function getDeliveryAddress(order: AdminOrder) {
  return [order.deliveryAddress, order.deliverySuburb, order.deliveryPostcode]
    .filter(Boolean)
    .join(", ");
}

export function AdminOrderDetail({
  order,
  isLoading = false,
  isUpdatingStatus,
  onUpdateStatus,
  onClose,
}: AdminOrderDetailProps) {
  if (isLoading) {
    return <AdminOrderDetailSkeleton />;
  }

  if (!order) {
    return (
      <Card className="rounded-[2rem] text-center">
        <CardContent className="p-8">
          <p className="font-semibold">Select an order</p>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Choose an order from the list to view details.
          </p>
        </CardContent>
      </Card>
    );
  }

  const FulfillmentIcon = order.orderType === "DELIVERY" ? Truck : Package;
  const address = getDeliveryAddress(order);

  return (
    <Card className="overflow-hidden rounded-[2rem] lg:sticky lg:top-24">
      <CardHeader className="flex flex-row items-start justify-between gap-4 p-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-bold">Order #{order.id.slice(0, 8)}</h2>
            <OrderStatusBadge status={order.status} />
          </div>

          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            {order.orderType === "DELIVERY" ? "Delivery" : "Pickup"} ·{" "}
            {order.items.length} items
          </p>
        </div>

        {onClose ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close order detail"
            className="shrink-0"
          >
            <X className="size-4" />
          </Button>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-6 p-5">
        <section>
          <h3 className="mb-3 text-sm font-bold">Customer</h3>

          <div className="flex items-start justify-between gap-4 rounded-2xl bg-[var(--color-surface-soft)] p-4">
            <div className="min-w-0">
              <p className="font-bold">{order.customerName}</p>

              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                {order.customerPhone}
              </p>

              {order.customerEmail ? (
                <p className="mt-1 break-all text-sm text-[var(--color-text-secondary)]">
                  {order.customerEmail}
                </p>
              ) : null}
            </div>

            <Button
              type="button"
              variant="secondary"
              size="icon"
              aria-label="Call customer"
              className="shrink-0"
            >
              <Phone className="size-4" />
            </Button>
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-bold">Fulfillment</h3>

          <div className="rounded-2xl bg-[var(--color-surface-soft)] p-4">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-[var(--color-brand)]">
                <FulfillmentIcon className="size-5" />
              </span>

              <div className="min-w-0">
                <p className="font-bold">
                  {order.orderType === "DELIVERY" ? "Delivery" : "Pickup"}
                </p>

                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  {order.orderType === "DELIVERY"
                    ? address || "Delivery address unavailable"
                    : "Customer will pick up the order"}
                </p>
              </div>
            </div>
          </div>
        </section>

        <AdminOrderItemsSection items={order.items} />

        <section>
          <h3 className="mb-3 text-sm font-bold">Order Notes</h3>

          <p className="rounded-2xl bg-[var(--color-surface-soft)] p-4 text-sm text-[var(--color-text-secondary)]">
            {order.notes || "No special instructions"}
          </p>
        </section>

        <AdminOrderPaymentSummary order={order} />
      </CardContent>

      <CardFooter className="sticky bottom-0 z-10 bg-[var(--color-surface)] p-4 lg:static">
        <OrderStatusActions
          currentStatus={order.status}
          isUpdating={isUpdatingStatus}
          onUpdateStatus={(status) => onUpdateStatus(order.id, status)}
        />
      </CardFooter>
    </Card>
  );
}
