import { Package, Phone, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AdminOrder, AdminOrderStatus } from "../../types";
import { OrderStatusActions } from "./order-status-actions";
import { OrderStatusBadge } from "../order-status-badge";
import { AdminOrderItemsSection } from "./admin-order-items-section";
import { AdminOrderPaymentSummary } from "./admin-order-payment-summary";

type AdminOrderDetailProps = {
  order: AdminOrder | null;
  isUpdatingStatus: boolean;
  onUpdateStatus: (orderId: string, status: AdminOrderStatus) => void;
};

function getDeliveryAddress(order: AdminOrder) {
  return [order.deliveryAddress, order.deliverySuburb, order.deliveryPostcode]
    .filter(Boolean)
    .join(", ");
}

export function AdminOrderDetail({
  order,
  isUpdatingStatus,
  onUpdateStatus,
}: AdminOrderDetailProps) {
  if (!order) {
    return (
      <Card className="text-center">
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
    <Card className="overflow-hidden lg:sticky lg:top-24">
      <CardHeader className="flex flex-row items-center justify-between p-5">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold">Order #{order.id.slice(0, 8)}</h2>
          <OrderStatusBadge status={order.status} />
        </div>
      </CardHeader>

      <CardContent className="space-y-6 p-5">
        <section>
          <h3 className="mb-3 text-sm font-bold">Customer</h3>

          <div className="flex items-start justify-between rounded-2xl bg-[var(--color-surface-soft)] p-4">
            <div>
              <p className="font-bold">{order.customerName}</p>

              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                {order.customerPhone}
              </p>

              {order.customerEmail ? (
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  {order.customerEmail}
                </p>
              ) : null}
            </div>

            <Button
              type="button"
              variant="secondary"
              size="icon"
              aria-label="Call customer"
            >
              <Phone className="size-4" />
            </Button>
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-bold">Fulfillment</h3>

          <div className="rounded-2xl bg-[var(--color-surface-soft)] p-4">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full bg-white text-[var(--color-brand)]">
                <FulfillmentIcon className="size-5" />
              </span>

              <div>
                <p className="font-bold">
                  {order.orderType === "DELIVERY" ? "Delivery" : "Pickup"}
                </p>

                <p className="text-sm text-[var(--color-text-secondary)]">
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

        <OrderStatusActions
          currentStatus={order.status}
          isUpdating={isUpdatingStatus}
          onUpdateStatus={(status) => onUpdateStatus(order.id, status)}
        />
      </CardContent>
    </Card>
  );
}
