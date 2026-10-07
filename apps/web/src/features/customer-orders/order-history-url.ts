import type { CustomerOrderSort, CustomerOrderStatusFilter, CustomerOrdersQuery } from "./types";

export const ORDER_STATUSES: CustomerOrderStatusFilter[] = ["all", "PENDING", "ACCEPTED", "PREPARING", "READY", "COMPLETED", "CANCELLED"];
export const ORDER_SORTS: CustomerOrderSort[] = ["newest", "oldest", "amount_high", "amount_low"];

export function parseCustomerOrdersQuery(params: URLSearchParams): CustomerOrdersQuery {
  const rawPage = params.get("page");
  const page = rawPage && /^[1-9]\d*$/.test(rawPage) ? Number(rawPage) : 1;
  const rawStatus = params.get("status") as CustomerOrderStatusFilter | null;
  const rawSort = params.get("sort") as CustomerOrderSort | null;
  return {
    page: Number.isSafeInteger(page) ? page : 1,
    pageSize: 10,
    status: rawStatus && ORDER_STATUSES.includes(rawStatus) ? rawStatus : "all",
    sort: rawSort && ORDER_SORTS.includes(rawSort) ? rawSort : "newest",
  };
}

export function customerOrdersHref(query: CustomerOrdersQuery) {
  const params = new URLSearchParams();
  if (query.status !== "all") params.set("status", query.status);
  if (query.sort !== "newest") params.set("sort", query.sort);
  if (query.page > 1) params.set("page", String(query.page));
  const search = params.toString();
  return `/account/orders${search ? `?${search}` : ""}`;
}
