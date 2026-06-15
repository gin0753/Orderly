import { apiFetch } from "@/lib/api";
import { AdminOrder, AdminOrderFilters, AdminOrderStatus } from "../types";

function buildOrdersQuery(filters: AdminOrderFilters) {
  const params = new URLSearchParams();

  if (filters.orderType) {
    params.set("orderType", filters.orderType);
  }

  if (filters.status) {
    params.set("status", filters.status);
  }

  const queryString = params.toString();

  return queryString ? `/orders?${queryString}` : "/orders";
}

export function getAdminOrders(filters: AdminOrderFilters = {}) {
  return apiFetch<AdminOrder[]>(buildOrdersQuery(filters));
}

export function updateAdminOrderStatus(
  orderId: string,
  status: AdminOrderStatus,
) {
  return apiFetch<AdminOrder>(`/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
