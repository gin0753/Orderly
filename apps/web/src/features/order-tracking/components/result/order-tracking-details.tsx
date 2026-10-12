import type { OrderTrackingResponse } from "../../types/order-tracking.types";

export function OrderTrackingDetails({
  order,
}: {
  order: OrderTrackingResponse;
}) {
  return (
    <section className="rounded-[var(--radius-card)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-surface)] sm:p-6">
      <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
        Details
      </h2>
      <p className="mt-4 text-sm text-[var(--color-text-muted)]">Fulfillment</p>
      <p className="mt-2 font-bold text-[var(--color-text-primary)]">
        {order.orderType === "PICKUP" ? "Pickup" : "Delivery"}
      </p>
      <p className="mt-3 text-sm text-[var(--color-text-muted)]">
        Contact details, delivery addresses and notes are not displayed in
        tracking.
      </p>
    </section>
  );
}
