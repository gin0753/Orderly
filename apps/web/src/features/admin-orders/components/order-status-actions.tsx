import { Button } from "@/components/ui/button";

import { AdminOrderStatus } from "../types";

type OrderStatusActionsProps = {
  currentStatus: AdminOrderStatus;
  isUpdating: boolean;
  onUpdateStatus: (status: AdminOrderStatus) => void;
};

function getAvailableActions(currentStatus: AdminOrderStatus) {
  if (currentStatus === "PENDING") {
    return [
      {
        label: "Accept order",
        nextStatus: "PREPARING" as const,
        variant: "brand" as const,
      },
    ];
  }

  if (currentStatus === "PREPARING") {
    return [
      {
        label: "Mark ready",
        nextStatus: "READY" as const,
        variant: "successSoft" as const,
      },
      {
        label: "Complete order",
        nextStatus: "COMPLETED" as const,
        variant: "brand" as const,
      },
    ];
  }

  if (currentStatus === "READY") {
    return [
      {
        label: "Complete order",
        nextStatus: "COMPLETED" as const,
        variant: "brand" as const,
      },
    ];
  }

  return [];
}

export function OrderStatusActions({
  currentStatus,
  isUpdating,
  onUpdateStatus,
}: OrderStatusActionsProps) {
  const actions = getAvailableActions(currentStatus);

  if (currentStatus === "COMPLETED") {
    return (
      <div className="border-t border-[var(--color-border)] pt-4">
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">
          Order completed
        </p>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          This order has already been fulfilled.
        </p>
      </div>
    );
  }

  return (
    <div className="border-t border-[var(--color-border)] pt-4">
      <p className="mb-3 text-sm font-bold">Update status</p>

      <div className="flex flex-col gap-2 sm:flex-row">
        {actions.map((action) => (
          <Button
            key={action.nextStatus}
            type="button"
            variant={action.variant}
            size="lg"
            disabled={isUpdating}
            onClick={() => onUpdateStatus(action.nextStatus)}
            className="flex-1 rounded-full shadow-none"
          >
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
