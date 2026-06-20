import { apiFetch } from "@/lib/api-fetch";

import {
  AdminOrder,
  AdminOrdersQuery,
  AdminOrdersResponse,
  AdminOrderStatus,
} from "../types";

function buildOrdersQuery(query: AdminOrdersQuery) {
  const params = new URLSearchParams();

  if (query.orderType) {
    params.set("orderType", query.orderType);
  }

  if (query.status) {
    params.set("status", query.status);
  }

  if (query.search?.trim()) {
    params.set("search", query.search.trim());
  }

  if (query.page) {
    params.set("page", String(query.page));
  }

  if (query.pageSize) {
    params.set("pageSize", String(query.pageSize));
  }

  const queryString = params.toString();

  return queryString ? `/orders?${queryString}` : "/orders";
}

export function getAdminOrders(query: AdminOrdersQuery = {}) {
  return apiFetch<AdminOrdersResponse>(buildOrdersQuery(query));
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
