/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { AdminOrderDetail } from "@/features/admin-orders/components/admin-order-detail/admin-order-detail";
import type { AdminOrder } from "@/features/admin-orders/types";
import type { OrderTrackingResponse } from "@/features/order-tracking/types/order-tracking.types";

const order: AdminOrder = {
  id: "order-id", orderNumber: "10001", customerName: "Ada", customerPhone: "0400000000",
  customerEmail: "ada@example.test", orderType: "DELIVERY", status: "PENDING", paymentStatus: "UNPAID",
  addressLine1: "1 Test Street", addressLine2: "Unit 2", city: "Sydney", state: "NSW", postcode: "2000",
  subtotalCents: 2000, deliveryFeeCents: 500, serviceFeeCents: 120, totalCents: 2620,
  items: [], createdAt: "2026-10-05T00:00:00Z", updatedAt: "2026-10-05T00:00:00Z",
};

it("displays the API delivery snapshot and each persisted fee once without inventing tax", () => {
  render(<AdminOrderDetail order={order} isUpdatingStatus={false} onPerformAction={jest.fn()} />);
  expect(screen.getByText("1 Test Street, Unit 2, Sydney, NSW, 2000")).toBeInTheDocument();
  expect(screen.getAllByText("Service fee")).toHaveLength(1);
  expect(screen.getAllByText("$1.20")).toHaveLength(1);
  expect(screen.queryByText("Tax")).not.toBeInTheDocument();
  expect(screen.getByText("$26.20")).toBeInTheDocument();
});

it("accepts the authoritative UNPAID status in Admin and tracking contracts", () => {
  const trackingStatus: OrderTrackingResponse["paymentStatus"] = order.paymentStatus;
  expect(trackingStatus).toBe("UNPAID");
});
