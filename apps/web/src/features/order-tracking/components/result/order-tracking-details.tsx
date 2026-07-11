import type { ReactNode } from "react";

import type { OrderTrackingResponse } from "../../types/order-tracking.types";
import { getEstimatedTimeLabel } from "../../utils/order-status-copy";

type OrderTrackingDetailsProps = {
  order: OrderTrackingResponse;
};

type DetailCardProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

function DetailCard({ label, children, className = "" }: DetailCardProps) {
  return (
    <div
      className={`rounded-2xl bg-[var(--color-surface-muted)] p-4 ${className}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-subtle)]">
        {label}
      </p>

      {children}
    </div>
  );
}

function formatDeliveryAddress(order: OrderTrackingResponse) {
  return [
    order.addressLine1,
    order.addressLine2,
    order.city,
    order.state,
    order.postcode,
  ]
    .filter(Boolean)
    .join(", ");
}

export function OrderTrackingDetails({ order }: OrderTrackingDetailsProps) {
  const formattedAddress = formatDeliveryAddress(order);

  return (
    <section className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 md:p-6">
      <h2 className="text-lg font-bold tracking-tight text-[var(--color-text-primary)]">
        Details
      </h2>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <DetailCard label="Fulfillment">
          <p className="mt-2 text-sm font-bold text-[var(--color-text-primary)]">
            {order.orderType === "PICKUP" ? "Pickup" : "Delivery"}
          </p>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {getEstimatedTimeLabel(order)}
          </p>
        </DetailCard>

        <DetailCard label="Customer">
          <p className="mt-2 text-sm font-bold text-[var(--color-text-primary)]">
            {order.customerName}
          </p>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {order.customerPhone}
          </p>
        </DetailCard>

        <DetailCard
          label={
            order.orderType === "PICKUP"
              ? "Pickup location"
              : "Delivery address"
          }
          className="sm:col-span-2"
        >
          <p className="mt-2 text-sm font-medium text-[var(--color-text-primary)]">
            {order.orderType === "PICKUP"
              ? "123 Collins St, Melbourne VIC 3000"
              : formattedAddress || "Delivery address unavailable"}
          </p>
        </DetailCard>

        {order.notes ? (
          <DetailCard label="Order notes" className="sm:col-span-2">
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              {order.notes}
            </p>
          </DetailCard>
        ) : null}
      </div>
    </section>
  );
}
