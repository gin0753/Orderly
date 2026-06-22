import { ChevronRight, Package, Truck } from "lucide-react";

import { formatMoneyFromCents } from "@/lib/format-money";
import { AdminOrder } from "../../types";
import { OrderStatusBadge } from "../order-status-badge";

type AdminOrderCardProps = {
  order: AdminOrder;
  isSelected: boolean;
  onClick: () => void;
};

function formatOrderTime(date: string) {
  return new Intl.DateTimeFormat("en-AU", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

export function AdminOrderCard({
  order,
  isSelected,
  onClick,
}: AdminOrderCardProps) {
  const itemCount = order.items.reduce(
    (total, item) => total + item.quantity,
    0,
  );
  const FulfillmentIcon = order.orderType === "DELIVERY" ? Truck : Package;

  return (
    <button
      onClick={onClick}
      className={[
        "grid w-full grid-cols-[1fr_auto] gap-4 rounded-2xl border p-4 text-left transition hover:border-[var(--color-border-hover)]",
        isSelected
          ? "border-[var(--color-brand)] bg-[var(--color-surface)]"
          : "border-[var(--color-border)] bg-[var(--color-surface)]",
      ].join(" ")}
    >
      <div>
        <div className="flex items-center gap-3">
          <p className="font-bold">#{order.id.slice(0, 8)}</p>
          <OrderStatusBadge status={order.status} />
        </div>

        <p className="mt-2 text-sm font-semibold">{order.customerName}</p>

        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[var(--color-text-secondary)]">
          <span>{formatOrderTime(order.createdAt)}</span>

          <span className="flex items-center gap-1">
            <FulfillmentIcon className="size-3.5" />
            {order.orderType === "DELIVERY" ? "Delivery" : "Pickup"}
          </span>

          <span>{itemCount} items</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <p className="text-sm font-bold">
          {formatMoneyFromCents(order.totalCents)}
        </p>
        <ChevronRight className="size-4 text-[var(--color-text-muted)]" />
      </div>
    </button>
  );
}
