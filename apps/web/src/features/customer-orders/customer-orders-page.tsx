"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAppSelector } from "@/store/hooks";
import { formatMoneyFromCents } from "@/lib/format-money";
import { ORDER_STATUS_LABELS } from "@/features/order-tracking/utils/order-status-copy";
import { customerOrderKeys, getCustomerOrders } from "./customer-orders-api";
import { CustomerOrderStatus } from "./customer-order-status";
import { formatOrderDate } from "./format-order-date";
import { customerOrdersHref, ORDER_SORTS, ORDER_STATUSES, parseCustomerOrdersQuery } from "./order-history-url";
import type { CustomerOrderSort } from "./types";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CustomerOrdersLoading } from "./customer-orders-loading";

const SORT_LABELS: Record<CustomerOrderSort, string> = {
  newest: "Newest first", oldest: "Oldest first", amount_high: "Highest total", amount_low: "Lowest total",
};

export function CustomerOrdersPage() {
  const searchParams = useSearchParams();
  const customerId = useAppSelector((state) => state.customerAuth.customer?.id);
  const queryParams = useMemo(() => parseCustomerOrdersQuery(new URLSearchParams(searchParams.toString())), [searchParams]);
  const orders = useQuery({
    queryKey: customerOrderKeys.list(customerId ?? "", queryParams),
    queryFn: () => getCustomerOrders(queryParams),
    enabled: Boolean(customerId),
    staleTime: 30_000,
    retry: 1,
  });

  return <div className="w-full">
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-[var(--color-brand-text)]">Your Orderly account</p>
        <h1 className="mt-1 text-[length:var(--text-page-title)] font-bold leading-[var(--leading-page-title)] tracking-tight">Orders</h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Orders placed while signed in to this account.</p>
      </div>
      <Link href="/track-order" className={buttonStyles({ variant: "secondary" })}>Track a guest order</Link>
    </div>

    <Card variant="surface" className="mb-6 space-y-5 p-4 sm:p-6">
      <nav aria-label="Filter orders by status"><p className="mb-2 text-sm font-semibold">Status</p>
        <div className="flex flex-wrap gap-2">{ORDER_STATUSES.map((status) => <Link key={status} href={customerOrdersHref({ ...queryParams, status, page: 1 })} scroll={false}
          aria-current={queryParams.status === status ? "true" : undefined}
          className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-semibold transition ${queryParams.status === status ? "border-[var(--color-brand-strong)] bg-[var(--color-brand-soft)] text-[var(--color-brand-text)]" : "border-[var(--color-control-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-brand-strong)]"}`}>
          {queryParams.status === status ? <span aria-hidden="true">✓</span> : null}
          {status === "all" ? "All" : ORDER_STATUS_LABELS[status]}</Link>)}</div>
      </nav>
      <nav aria-label="Sort orders"><p className="mb-2 text-sm font-semibold">Sort by</p>
        <div className="flex flex-wrap gap-2">{ORDER_SORTS.map((sort) => <Link key={sort} href={customerOrdersHref({ ...queryParams, sort, page: 1 })} scroll={false}
          aria-current={queryParams.sort === sort ? "true" : undefined}
          className={`inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold underline-offset-4 ${queryParams.sort === sort ? "bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] underline" : "text-[var(--color-text-secondary)] hover:underline"}`}>
          {SORT_LABELS[sort]}</Link>)}</div>
      </nav>
    </Card>

    {orders.isPending ? <CustomerOrdersLoading /> : null}
    {orders.isError ? <div role="alert" className="rounded-3xl border border-[var(--color-danger-border)] bg-[var(--color-danger-surface)] p-6">
      <p className="font-semibold">We couldn’t load your orders.</p>
      <p className="mt-1 text-sm">Your session and filters are still here. Please try again.</p>
      <Button onClick={() => { void orders.refetch(); }} className="mt-4">Try again</Button>
    </div> : null}
    {orders.data && !orders.isError ? <>
      <p role="status" className="mb-4 text-sm text-[var(--color-text-secondary)]">{orders.isFetching ? "Updating orders…" : `${orders.data.meta.totalItems} ${orders.data.meta.totalItems === 1 ? "order" : "orders"} · Page ${orders.data.meta.page} of ${Math.max(1, orders.data.meta.totalPages)}`}</p>
      {orders.data.data.length === 0 ? <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
        {queryParams.page > Math.max(1, orders.data.meta.totalPages) ? <>
          <h2 className="text-xl font-bold">No orders on this page</h2>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">The list may have changed since this link was copied.</p>
          <Link href={customerOrdersHref({ ...queryParams, page: Math.max(1, orders.data.meta.totalPages) })} className={buttonStyles({ variant: "secondary", className: "mt-5" })}>Go to the last page</Link>
        </> : queryParams.status === "all" && orders.data.meta.totalItems === 0 ? <>
          <h2 className="text-xl font-bold">No signed-in orders yet</h2>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">You haven’t placed any orders while signed in yet. Older guest orders can still be found through Track order.</p>
          <Link href="/" className={buttonStyles({ className: "mt-5" })}>Browse menu</Link>
        </> : <>
          <h2 className="text-xl font-bold">No matching orders</h2>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Try another status or return to all orders.</p>
          <Link href={customerOrdersHref({ ...queryParams, status: "all", page: 1 })} className={buttonStyles({ variant: "secondary", className: "mt-5" })}>Show all orders</Link>
        </>}
      </div> : <ol className="space-y-3" aria-label="Your orders">
        {orders.data.data.map((order) => <li key={order.id}><Card variant="surface" className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="break-all text-lg font-bold">Order #{order.orderNumber}</h2>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]"><time dateTime={order.createdAt}>{formatOrderDate(order.createdAt)}</time></p>
            </div>
            <CustomerOrderStatus status={order.status} />
          </div>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-x-5 gap-y-3 border-t border-[var(--color-border)] pt-4">
            <p className="text-sm text-[var(--color-text-secondary)]">{order.orderType === "PICKUP" ? "Pickup" : "Delivery"} · {order.itemCount} {order.itemCount === 1 ? "item" : "items"}</p>
            <div className="flex flex-wrap items-center gap-4"><div><span className="block text-xs text-[var(--color-text-secondary)]">Order total</span><strong className="text-xl tabular-nums">{formatMoneyFromCents(order.totalCents)}</strong></div><Link href={`/account/orders/${encodeURIComponent(order.id)}`} aria-describedby={`order-${order.id}-context`} className={buttonStyles({ variant: "brandSoft" })}>View order</Link><span id={`order-${order.id}-context`} className="sr-only">Order #{order.orderNumber}</span></div>
          </div>
        </Card></li>)}
      </ol>}
      {orders.data.data.length > 0 && orders.data.meta.totalPages > 1 ? <nav aria-label="Order pages" className="mt-7 flex flex-wrap items-center justify-between gap-3">
        {queryParams.page <= 1 ? <span aria-disabled="true" className={buttonStyles({ variant: "secondary", className: "opacity-50" })}>Previous</span> : <Link href={customerOrdersHref({ ...queryParams, page: queryParams.page - 1 })} scroll={false} className={buttonStyles({ variant: "secondary" })}>Previous</Link>}
        <span className="text-sm text-[var(--color-text-secondary)]">{orders.data.meta.totalItems} orders</span>
        {queryParams.page >= orders.data.meta.totalPages ? <span aria-disabled="true" className={buttonStyles({ variant: "secondary", className: "opacity-50" })}>Next</span> : <Link href={customerOrdersHref({ ...queryParams, page: queryParams.page + 1 })} scroll={false} className={buttonStyles({ variant: "secondary" })}>Next</Link>}
      </nav> : null}
    </> : null}
  </div>;
}
