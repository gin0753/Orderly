import { cn } from "@/lib/cn";

import type { OrderStatus, OrderType } from "../../types/order-tracking.types";
import { formatDateTime } from "../../utils/order-tracking-utils";

type OrderStatusTimelineProps = {
  status: OrderStatus;
  orderType: OrderType;
  createdAt: string;
  updatedAt: string;
};

type TimelineStatus = "PENDING" | "PREPARING" | "READY" | "COMPLETED";

const STATUS_STEPS: {
  status: TimelineStatus;
  label: string;
}[] = [
  {
    status: "PENDING",
    label: "Placed",
  },
  {
    status: "PREPARING",
    label: "Preparing",
  },
  {
    status: "READY",
    label: "Ready",
  },
  {
    status: "COMPLETED",
    label: "Completed",
  },
];

const ACTIVE_INDEX_BY_STATUS: Record<
  Exclude<OrderStatus, "CANCELLED">,
  number
> = {
  PENDING: 0,
  ACCEPTED: 0,
  PREPARING: 1,
  READY: 2,
  COMPLETED: 3,
};

function getStepHelper(
  stepStatus: TimelineStatus,
  orderStatus: OrderStatus,
  orderType: OrderType,
) {
  if (stepStatus === "PENDING") {
    if (orderStatus === "ACCEPTED") {
      return "Restaurant confirmed your order";
    }

    return "Order received";
  }

  if (stepStatus === "PREPARING") {
    return "Kitchen is working";
  }

  if (stepStatus === "READY") {
    return orderType === "PICKUP" ? "Ready for pickup" : "Ready for delivery";
  }

  return "Order finished";
}

export function OrderStatusTimeline({
  status,
  orderType,
  createdAt,
  updatedAt,
}: OrderStatusTimelineProps) {
  if (status === "CANCELLED") {
    return (
      <div className="rounded-3xl border border-[var(--color-danger-border)] bg-[var(--color-danger-background)] p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface)] text-lg font-bold text-[var(--color-danger-foreground)]">
            !
          </div>

          <div>
            <h2 className="text-base font-bold text-[var(--color-danger-foreground)]">
              This order has been cancelled
            </h2>

            <p className="mt-1 text-sm leading-6 text-[var(--color-danger-foreground)]">
              The order was updated on {formatDateTime(updatedAt)}. Please
              contact the restaurant if you need help.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const activeIndex = ACTIVE_INDEX_BY_STATUS[status];

  return (
    <section className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 md:p-6">
      <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-[var(--color-text-primary)]">
            Order progress
          </h2>

          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {orderType === "PICKUP"
              ? "Follow your pickup order from placed to completed."
              : "Follow your delivery order from placed to completed."}
          </p>
        </div>

        <p className="text-sm font-medium text-[var(--color-text-muted)]">
          Last updated {formatDateTime(updatedAt)}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {STATUS_STEPS.map((step, index) => {
          const isAcceptedPlacedStep = status === "ACCEPTED" && index === 0;

          const isCurrent = index === activeIndex && status !== "ACCEPTED";

          const isDone = index < activeIndex || isAcceptedPlacedStep;

          const isActiveOrDone = isCurrent || isDone;

          return (
            <div key={step.status} className="relative">
              {index < STATUS_STEPS.length - 1 ? (
                <div
                  className={cn(
                    "absolute left-5 top-5 hidden h-px w-full md:block",
                    isDone
                      ? "bg-[var(--color-brand)]"
                      : "bg-[var(--color-border)]",
                  )}
                />
              ) : null}

              <div
                className="relative z-10 flex gap-3 md:block"
                aria-current={isCurrent ? "step" : undefined}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold",
                    isActiveOrDone
                      ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-[var(--color-text-inverse)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-subtle)]",
                  )}
                >
                  {isDone ? "✓" : index + 1}
                </div>

                <div className="md:mt-3">
                  <p
                    className={cn(
                      "text-sm font-bold",
                      isCurrent
                        ? "text-[var(--color-brand)]"
                        : "text-[var(--color-text-primary)]",
                    )}
                  >
                    {step.label}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">
                    {step.status === "PENDING" && status !== "ACCEPTED"
                      ? formatDateTime(createdAt)
                      : getStepHelper(step.status, status, orderType)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
