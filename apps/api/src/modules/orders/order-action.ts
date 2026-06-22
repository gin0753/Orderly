import { OrderStatus } from '@prisma/client';

export enum OrderAction {
  ACCEPT = 'ACCEPT',
  START_PREPARING = 'START_PREPARING',
  MARK_READY = 'MARK_READY',
  COMPLETE = 'COMPLETE',
  CANCEL = 'CANCEL',
}

type OrderActionRule = {
  targetStatus: OrderStatus;
  allowedCurrentStatuses: readonly OrderStatus[];
};

const orderActionRules: Record<OrderAction, OrderActionRule> = {
  [OrderAction.ACCEPT]: {
    targetStatus: OrderStatus.ACCEPTED,
    allowedCurrentStatuses: [OrderStatus.PENDING],
  },

  [OrderAction.START_PREPARING]: {
    targetStatus: OrderStatus.PREPARING,
    allowedCurrentStatuses: [OrderStatus.ACCEPTED],
  },

  [OrderAction.MARK_READY]: {
    targetStatus: OrderStatus.READY,
    allowedCurrentStatuses: [OrderStatus.PREPARING],
  },

  [OrderAction.COMPLETE]: {
    targetStatus: OrderStatus.COMPLETED,
    allowedCurrentStatuses: [OrderStatus.READY],
  },

  [OrderAction.CANCEL]: {
    targetStatus: OrderStatus.CANCELLED,
    allowedCurrentStatuses: [
      OrderStatus.PENDING,
      OrderStatus.ACCEPTED,
      OrderStatus.PREPARING,
    ],
  },
};

export function resolveOrderAction(
  currentStatus: OrderStatus,
  action: OrderAction,
): OrderStatus | null {
  const rule = orderActionRules[action];

  // Idempotency: action has already achieved its intended result.
  if (currentStatus === rule.targetStatus) {
    return rule.targetStatus;
  }

  if (!rule.allowedCurrentStatuses.includes(currentStatus)) {
    return null;
  }

  return rule.targetStatus;
}
