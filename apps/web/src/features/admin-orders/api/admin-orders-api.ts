import { apiFetch } from "@/lib/api-fetch";

import {
  AdminOrder,
  AdminOrderAction,
  AdminOrdersQuery,
  AdminOrdersResponse,
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
  return apiFetch<AdminOrdersResponse>(buildOrdersQuery(query), {
    auth: "required",
  });
}

export function performAdminOrderAction(
  orderId: string,
  action: AdminOrderAction,
) {
  return apiFetch<AdminOrder>(`/orders/${orderId}/action`, {
    method: "PATCH",
    auth: "required",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action }),
  });
}
