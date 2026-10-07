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

  return <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-[var(--color-brand-text)]">Your Orderly account</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Orders</h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Orders placed while signed in to this account.</p>
      </div>
      <Link href="/track-order" className="text-sm font-semibold text-[var(--color-brand-text)] underline underline-offset-4">Track a guest order</Link>
    </div>

    <div className="mb-5 space-y-5 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
      <nav aria-label="Filter orders by status"><p className="mb-2 text-sm font-semibold">Status</p>
        <div className="flex flex-wrap gap-2">{ORDER_STATUSES.map((status) => <Link key={status} href={customerOrdersHref({ ...queryParams, status, page: 1 })} scroll={false}
          aria-current={queryParams.status === status ? "true" : undefined}
          className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${queryParams.status === status ? "border-[var(--color-brand-strong)] bg-[var(--color-brand-soft)] text-[var(--color-brand-text)]" : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)]"}`}>
          {status === "all" ? "All" : ORDER_STATUS_LABELS[status]}</Link>)}</div>
      </nav>
      <nav aria-label="Sort orders"><p className="mb-2 text-sm font-semibold">Sort by</p>
        <div className="flex flex-wrap gap-x-4 gap-y-2">{ORDER_SORTS.map((sort) => <Link key={sort} href={customerOrdersHref({ ...queryParams, sort, page: 1 })} scroll={false}
          aria-current={queryParams.sort === sort ? "true" : undefined}
          className={`text-sm font-semibold underline-offset-4 ${queryParams.sort === sort ? "text-[var(--color-brand-text)] underline" : "text-[var(--color-text-secondary)] hover:underline"}`}>
          {SORT_LABELS[sort]}</Link>)}</div>
      </nav>
    </div>

    {orders.isPending ? <div role="status" className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-[var(--color-text-secondary)]">Loading your orders…</div> : null}
    {orders.isError ? <div role="alert" className="rounded-3xl border border-[var(--color-danger-border)] bg-[var(--color-danger-surface)] p-6">
      <p className="font-semibold">We couldn’t load your orders.</p>
      <p className="mt-1 text-sm">Your session and filters are still here. Please try again.</p>
      <button type="button" onClick={() => { void orders.refetch(); }} className="mt-4 rounded-xl bg-[var(--color-brand-strong)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text-inverse)]">Try again</button>
    </div> : null}
    {orders.data && !orders.isError ? <>
      {orders.isFetching ? <p role="status" className="mb-3 text-sm text-[var(--color-text-secondary)]">Updating orders…</p> : null}
      {orders.data.data.length === 0 ? <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
        {queryParams.page > Math.max(1, orders.data.meta.totalPages) ? <>
          <h2 className="text-xl font-bold">No orders on this page</h2>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">The list may have changed since this link was copied.</p>
          <Link href={customerOrdersHref({ ...queryParams, page: Math.max(1, orders.data.meta.totalPages) })} className="mt-5 inline-flex text-sm font-semibold text-[var(--color-brand-text)] underline underline-offset-4">Go to the last page</Link>
        </> : queryParams.status === "all" && orders.data.meta.totalItems === 0 ? <>
          <h2 className="text-xl font-bold">No signed-in orders yet</h2>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">You haven’t placed any orders while signed in yet. Older guest orders can still be found through Track order.</p>
          <Link href="/" className="mt-5 inline-flex rounded-xl bg-[var(--color-brand-strong)] px-5 py-3 text-sm font-semibold text-[var(--color-text-inverse)]">Browse menu</Link>
        </> : <>
          <h2 className="text-xl font-bold">No matching orders</h2>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Try another status or return to all orders.</p>
          <Link href={customerOrdersHref({ ...queryParams, status: "all", page: 1 })} className="mt-5 inline-flex text-sm font-semibold text-[var(--color-brand-text)] underline underline-offset-4">Show all orders</Link>
        </>}
      </div> : <ol className="space-y-3" aria-label="Your orders">
        {orders.data.data.map((order) => <li key={order.id} className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="break-all text-lg font-bold">Order #{order.orderNumber}</h2>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{formatOrderDate(order.createdAt)}</p>
            </div>
            <CustomerOrderStatus status={order.status} />
          </div>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-x-5 gap-y-3 border-t border-[var(--color-border)] pt-4">
            <p className="text-sm text-[var(--color-text-secondary)]">{order.orderType === "PICKUP" ? "Pickup" : "Delivery"} · {order.itemCount} {order.itemCount === 1 ? "item" : "items"}</p>
            <div className="flex items-center gap-5"><strong className="text-lg">{formatMoneyFromCents(order.totalCents)}</strong><Link href={`/account/orders/${encodeURIComponent(order.id)}`} className="text-sm font-bold text-[var(--color-brand-text)] underline underline-offset-4">View order</Link></div>
          </div>
        </li>)}
      </ol>}
      {orders.data.data.length > 0 && orders.data.meta.totalPages > 1 ? <nav aria-label="Order pages" className="mt-7 flex flex-wrap items-center justify-between gap-3">
        {queryParams.page <= 1 ? <span aria-disabled="true" className="rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-semibold opacity-40">Previous</span> : <Link href={customerOrdersHref({ ...queryParams, page: queryParams.page - 1 })} scroll={false} className="rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-semibold">Previous</Link>}
        <span className="text-sm text-[var(--color-text-secondary)]">Page {orders.data.meta.page} of {orders.data.meta.totalPages} · {orders.data.meta.totalItems} orders</span>
        {queryParams.page >= orders.data.meta.totalPages ? <span aria-disabled="true" className="rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-semibold opacity-40">Next</span> : <Link href={customerOrdersHref({ ...queryParams, page: queryParams.page + 1 })} scroll={false} className="rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-semibold">Next</Link>}
      </nav> : null}
    </> : null}
  </main>;
}
