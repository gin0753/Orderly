"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAppSelector } from "@/store/hooks";
import { ApiError } from "@/lib/api-fetch";
import { formatMoneyFromCents } from "@/lib/format-money";
import { customerOrderKeys, getCustomerOrder } from "./customer-orders-api";
import { CustomerOrderStatus } from "./customer-order-status";
import { formatOrderDate } from "./format-order-date";

export function CustomerOrderDetailPage({ orderId }: { orderId: string }) {
  const customerId = useAppSelector((state) => state.customerAuth.customer?.id);
  const order = useQuery({
    queryKey: customerOrderKeys.detail(customerId ?? "", orderId),
    queryFn: () => getCustomerOrder(orderId),
    enabled: Boolean(customerId),
    staleTime: 30_000,
    retry: (failures, error) => !(error instanceof ApiError && error.status === 404) && failures < 1,
  });

  return <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
    <Link href="/account/orders" className="text-sm font-semibold text-[var(--color-brand-text)] underline underline-offset-4">← Back to orders</Link>
    {order.isPending ? <div role="status" className="mt-6 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8">Loading order…</div> : null}
    {order.isError ? <div role="alert" className="mt-6 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8">
      <h1 className="text-2xl font-bold">{order.error instanceof ApiError && order.error.status === 404 ? "Order not found" : "Unable to load this order"}</h1>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{order.error instanceof ApiError && order.error.status === 404 ? "This order isn’t available in your account." : "Please try again. Your account session is still here."}</p>
      {!(order.error instanceof ApiError && order.error.status === 404) ? <button type="button" onClick={() => { void order.refetch(); }} className="mt-5 rounded-xl bg-[var(--color-brand-strong)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text-inverse)]">Try again</button> : null}
    </div> : null}
    {order.data && !order.isError ? <>
      <header className="mt-6 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-8">
        <p className="text-sm font-semibold text-[var(--color-brand-text)]">Your order record</p>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0"><h1 className="break-all text-3xl font-bold tracking-tight">Order #{order.data.orderNumber}</h1><p className="mt-2 text-sm text-[var(--color-text-secondary)]">Placed {formatOrderDate(order.data.createdAt)}</p></div>
          <CustomerOrderStatus status={order.data.status} />
        </div>
        <p className="mt-5 border-t border-[var(--color-border)] pt-4 text-sm font-medium">{order.data.orderType === "PICKUP" ? "Pickup order" : "Delivery order"}</p>
      </header>

      <section aria-labelledby="items-heading" className="mt-5 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-8">
        <h2 id="items-heading" className="text-xl font-bold">Items</h2>
        <ul className="mt-4 divide-y divide-[var(--color-border)]">
          {order.data.items.map((item) => <li key={item.id} className="flex min-w-0 justify-between gap-4 py-4">
            <div className="min-w-0"><h3 className="break-words font-semibold">{item.quantity} × {item.name}</h3>
              {item.sizeName ? <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Size: {item.sizeName}{item.sizePriceCents ? ` (${formatMoneyFromCents(item.sizePriceCents)})` : ""}</p> : null}
              {item.options.map((option) => <p key={option.id} className="mt-1 break-words text-sm text-[var(--color-text-secondary)]">{option.optionGroupName}: {option.name}{option.priceDeltaCents ? ` (${formatMoneyFromCents(option.priceDeltaCents)})` : ""}</p>)}
              <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{formatMoneyFromCents(item.unitPriceCents)} each</p>
            </div>
            <strong className="shrink-0 text-sm">{formatMoneyFromCents(item.lineTotalCents)}</strong>
          </li>)}
        </ul>
      </section>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <section aria-labelledby="fulfillment-heading" className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-7">
          <h2 id="fulfillment-heading" className="text-lg font-bold">{order.data.orderType === "PICKUP" ? "Pickup details" : "Delivery details"}</h2>
          <div className="mt-4 space-y-1 break-words text-sm text-[var(--color-text-secondary)]">
            <p className="font-semibold text-[var(--color-text-primary)]">{order.data.customer.name}</p>
            <p>{order.data.customer.email}</p><p>{order.data.customer.phone}</p>
            {order.data.address ? <address className="mt-3 not-italic"><p>{order.data.address.addressLine1}</p>{order.data.address.addressLine2 ? <p>{order.data.address.addressLine2}</p> : null}<p>{[order.data.address.city, order.data.address.state, order.data.address.postcode].filter(Boolean).join(" ")}</p></address> : <p className="mt-3">Collect from the store.</p>}
          </div>
          {order.data.notes ? <div className="mt-5 border-t border-[var(--color-border)] pt-4"><h3 className="text-sm font-semibold">Order notes</h3><p className="mt-1 break-words whitespace-pre-wrap text-sm text-[var(--color-text-secondary)]">{order.data.notes}</p></div> : null}
        </section>
        <section aria-labelledby="totals-heading" className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-7">
          <h2 id="totals-heading" className="text-lg font-bold">Order total</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4"><dt>Subtotal</dt><dd>{formatMoneyFromCents(order.data.subtotalCents)}</dd></div>
            <div className="flex justify-between gap-4"><dt>Delivery fee</dt><dd>{order.data.deliveryFeeCents ? formatMoneyFromCents(order.data.deliveryFeeCents) : "Free"}</dd></div>
            <div className="flex justify-between gap-4"><dt>Service fee</dt><dd>{formatMoneyFromCents(order.data.serviceFeeCents)}</dd></div>
            <div className="flex justify-between gap-4 border-t border-[var(--color-border)] pt-4 text-lg font-bold"><dt>Total</dt><dd>{formatMoneyFromCents(order.data.totalCents)}</dd></div>
          </dl>
        </section>
      </div>
    </> : null}
  </main>;
}
