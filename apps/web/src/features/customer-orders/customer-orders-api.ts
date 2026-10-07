import { customerApiFetch } from "@/features/customer-auth/api/customer-api-fetch";
import { CUSTOMER_PRIVATE_QUERY_KEY } from "@/features/customer-auth/lib/private-data";
import type { CustomerOrderDetail, CustomerOrdersQuery, CustomerOrdersResponse } from "./types";

export const customerOrderKeys = {
  list: (customerId: string, query: CustomerOrdersQuery) => [...CUSTOMER_PRIVATE_QUERY_KEY, "orders", customerId, "list", query] as const,
  detail: (customerId: string, orderId: string) => [...CUSTOMER_PRIVATE_QUERY_KEY, "orders", customerId, "detail", orderId] as const,
};

export function getCustomerOrders(query: CustomerOrdersQuery) {
  const params = new URLSearchParams({ page: String(query.page), pageSize: String(query.pageSize), sort: query.sort });
  if (query.status !== "all") params.set("status", query.status);
  return customerApiFetch<CustomerOrdersResponse>(`/customer/orders?${params}`, { auth: "required" });
}

export function getCustomerOrder(orderId: string) {
  return customerApiFetch<CustomerOrderDetail>(`/customer/orders/${encodeURIComponent(orderId)}`, { auth: "required" });
}
