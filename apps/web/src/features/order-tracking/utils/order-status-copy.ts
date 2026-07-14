import type {
  OrderStatus,
  OrderTrackingResponse,
} from "../types/order-tracking.types";

export const TERMINAL_ORDER_STATUSES: readonly OrderStatus[] = [
  "COMPLETED",
  "CANCELLED",
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Placed",
  ACCEPTED: "Accepted",
  PREPARING: "Preparing",
  READY: "Ready",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export const ORDER_STATUS_BADGE_CLASS_NAMES: Record<OrderStatus, string> = {
  PENDING:
    "bg-[var(--color-notice-background)] text-[var(--color-notice-foreground)]",
  ACCEPTED:
    "bg-[var(--color-success-surface)] text-[var(--color-success-strong)]",
  PREPARING:
    "bg-[var(--color-notice-background)] text-[var(--color-notice-foreground)]",
  READY: "bg-[var(--color-success-surface)] text-[var(--color-success-strong)]",
  COMPLETED:
    "bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]",
  CANCELLED:
    "bg-[var(--color-danger-background)] text-[var(--color-danger-foreground)]",
};

export function isTerminalOrderStatus(status: OrderStatus) {
  return TERMINAL_ORDER_STATUSES.includes(status);
}

export function getEstimatedTimeLabel(order: OrderTrackingResponse) {
  if (order.status === "COMPLETED") {
    return "Order completed";
  }

  if (order.status === "CANCELLED") {
    return "Order cancelled";
  }

  if (order.status === "READY") {
    return order.orderType === "PICKUP"
      ? "Ready for pickup"
      : "Ready for delivery";
  }

  return order.orderType === "PICKUP"
    ? "Estimated ready in 20–30 min"
    : "Estimated delivery in 30–45 min";
}
