import type { OrderStatus, OrderType } from "@/features/order-tracking/types/order-tracking.types";

export type CustomerOrderSort = "newest" | "oldest" | "amount_high" | "amount_low";
export type CustomerOrderStatusFilter = OrderStatus | "all";
export type CustomerOrdersQuery = { page: number; pageSize: number; status: CustomerOrderStatusFilter; sort: CustomerOrderSort };
export type CustomerOrderSummary = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  orderType: OrderType;
  itemCount: number;
  totalCents: number;
  createdAt: string;
};
export type CustomerOrdersResponse = {
  data: CustomerOrderSummary[];
  meta: { page: number; pageSize: number; totalItems: number; totalPages: number };
};
export type CustomerOrderDetail = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  orderType: OrderType;
  customer: { name: string; email: string; phone: string };
  address: { addressLine1: string | null; addressLine2: string | null; city: string | null; state: string | null; postcode: string | null } | null;
  notes: string | null;
  items: Array<{
    id: string;
    name: string;
    imageUrl: string | null;
    sizeName: string | null;
    sizePriceCents: number | null;
    quantity: number;
    unitPriceCents: number;
    lineTotalCents: number;
    options: Array<{ id: string; optionGroupName: string; name: string; priceDeltaCents: number }>;
  }>;
  subtotalCents: number;
  deliveryFeeCents: number;
  serviceFeeCents: number;
  totalCents: number;
  createdAt: string;
  updatedAt: string;
};
