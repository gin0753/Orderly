import { ORDER_STATUS_BADGE_CLASS_NAMES, ORDER_STATUS_LABELS } from "@/features/order-tracking/utils/order-status-copy";
import type { OrderStatus } from "@/features/order-tracking/types/order-tracking.types";

export function CustomerOrderStatus({ status }: { status: OrderStatus }) {
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${ORDER_STATUS_BADGE_CLASS_NAMES[status]}`}>{ORDER_STATUS_LABELS[status]}</span>;
}
