import { Check, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format-date-time";
import type { OrderStatus, OrderType } from "../../types/order-tracking.types";

type OrderStatusTimelineProps = { status: OrderStatus; orderType: OrderType; createdAt: string; updatedAt: string };
const STEPS = ["Placed", "Preparing", "Ready", "Completed"];
const ACTIVE_INDEX: Record<Exclude<OrderStatus, "CANCELLED">, number> = { PENDING: 0, ACCEPTED: 0, PREPARING: 1, READY: 2, COMPLETED: 3 };

export function OrderStatusTimeline({ status, orderType, createdAt, updatedAt }: OrderStatusTimelineProps) {
  if (status === "CANCELLED") return <section className="rounded-[var(--radius-card)] border border-[var(--color-danger-border)] bg-[var(--color-danger-background)] p-5 sm:p-6">
    <div className="flex items-start gap-3 text-[var(--color-danger-foreground)]">
      <X aria-hidden="true" className="mt-1 size-6 shrink-0" />
      <div><h2 className="text-lg font-bold">This order has been cancelled</h2><p className="mt-2 text-sm leading-6">The order was updated on <time dateTime={updatedAt}>{formatDateTime(updatedAt)}</time>.</p></div>
    </div>
  </section>;
  const activeIndex = ACTIVE_INDEX[status];
  return <section aria-labelledby="tracking-progress-heading" className="rounded-[var(--radius-card)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-surface)] sm:p-6">
    <h2 id="tracking-progress-heading" className="text-xl font-bold tracking-tight">Order progress</h2>
    <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">Progress reflects the current recorded status. Individual step times are not available.</p>
    <p className="mt-2 text-sm text-[var(--color-text-muted)]">Last updated <time dateTime={updatedAt}>{formatDateTime(updatedAt)}</time></p>
    <ol aria-label="Order progress" className="mt-6 grid gap-4 md:grid-cols-4">
      {STEPS.map((label, index) => {
        const current = index === activeIndex;
        const earlier = index < activeIndex;
        return <li key={label} aria-current={current ? "step" : undefined} className="relative flex gap-3 md:block">
          <span aria-hidden="true" className={cn("relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold", current || earlier ? "border-[var(--color-brand-strong)] bg-[var(--color-brand-strong)] text-[var(--color-text-inverse)]" : "border-[var(--color-control-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]")}>
            {earlier ? <Check className="size-5" /> : index + 1}
          </span>
          <div className="min-w-0 md:mt-3">
            <p className={cn("text-sm font-bold", current ? "text-[var(--color-brand-text)]" : "text-[var(--color-text-primary)]")}>{label}</p>
            <p className="mt-1 text-xs leading-5 text-[var(--color-text-secondary)]">{current ? status === "ACCEPTED" ? "Current status: Accepted" : status === "READY" ? `Current status: Ready for ${orderType === "PICKUP" ? "pickup" : "delivery"}` : "Current status" : earlier ? "Earlier step" : "Not yet reached"}</p>
            {index === 0 ? <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]"><time dateTime={createdAt}>{formatDateTime(createdAt)}</time></p> : null}
          </div>
        </li>;
      })}
    </ol>
  </section>;
}
