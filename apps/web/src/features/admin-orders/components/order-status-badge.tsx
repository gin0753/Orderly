import { AdminOrderStatus } from "../types";

type OrderStatusBadgeProps = {
  status: AdminOrderStatus;
};

const statusConfig: Record<
  AdminOrderStatus,
  {
    label: string;
    className: string;
  }
> = {
  PENDING: {
    label: "New",
    className:
      "bg-[var(--color-warning-surface)] text-[var(--color-warning-strong)]",
  },
  ACCEPTED: {
    label: "Accepted",
    className: "bg-[var(--color-info-surface)] text-[var(--color-info-strong)]",
  },
  PREPARING: {
    label: "Preparing",
    className:
      "bg-[var(--color-warning-surface)] text-[var(--color-warning-strong)]",
  },
  READY: {
    label: "Ready",
    className:
      "bg-[var(--color-success-surface)] text-[var(--color-success-strong)]",
  },
  COMPLETED: {
    label: "Completed",
    className:
      "bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]",
  },
  CANCELLED: {
    label: "Cancelled",
    className:
      "bg-[var(--color-danger-surface)] text-[var(--color-danger-strong)]",
  },
};

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold",
        config.className,
      ].join(" ")}
    >
      {config.label}
    </span>
  );
}
