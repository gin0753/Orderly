import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

import { AdminOrderAction, AdminOrderStatus } from "../../types";

type OrderStatusActionsProps = {
  currentStatus: AdminOrderStatus;
  isUpdating: boolean;
  onPerformAction: (action: AdminOrderAction) => void;
  className?: string;
};

type AvailableAction = {
  label: string;
  description: string;
  action: AdminOrderAction;
};

function getAvailableAction(
  currentStatus: AdminOrderStatus,
): AvailableAction | null {
  if (currentStatus === "PENDING") {
    return {
      label: "Accept order",
      description: "Confirm that the restaurant has accepted this order.",
      action: "ACCEPT",
    };
  }

  if (currentStatus === "ACCEPTED") {
    return {
      label: "Start preparing",
      description: "Move this order into active preparation.",
      action: "START_PREPARING",
    };
  }

  if (currentStatus === "PREPARING") {
    return {
      label: "Mark as ready",
      description: "Use this when the order is ready for pickup or delivery.",
      action: "MARK_READY",
    };
  }

  if (currentStatus === "READY") {
    return {
      label: "Complete order",
      description:
        "Use this after the order has been handed over or delivered.",
      action: "COMPLETE",
    };
  }

  return null;
}

export function OrderStatusActions({
  currentStatus,
  isUpdating,
  onPerformAction,
  className,
}: OrderStatusActionsProps) {
  const action = getAvailableAction(currentStatus);

  if (currentStatus === "COMPLETED") {
    return (
      <div className={cn("w-full", className)}>
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">
          Order completed
        </p>

        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          This order has already been fulfilled.
        </p>
      </div>
    );
  }

  if (currentStatus === "CANCELLED") {
    return (
      <div className={cn("w-full", className)}>
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">
          Order cancelled
        </p>

        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          This order can no longer be progressed.
        </p>
      </div>
    );
  }

  if (!action) {
    return (
      <div className={cn("w-full", className)}>
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">
          No available actions
        </p>

        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          This order cannot be updated from its current status.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div>
        <p className="text-sm font-bold">Next step</p>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          {action.description}
        </p>
      </div>

      <Button
        type="button"
        variant="brand"
        size="lg"
        disabled={isUpdating}
        onClick={() => onPerformAction(action.action)}
        className="w-full shrink-0 rounded-full shadow-none sm:w-auto"
      >
        {isUpdating ? "Updating..." : action.label}
      </Button>
    </div>
  );
}
