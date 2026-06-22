import { OrderStatus } from '@prisma/client';

import { OrderAction, resolveOrderAction } from './order-action';

describe('resolveOrderAction', () => {
  it('maps valid actions to the next order status', () => {
    expect(resolveOrderAction(OrderStatus.PENDING, OrderAction.ACCEPT)).toBe(
      OrderStatus.ACCEPTED,
    );

    expect(
      resolveOrderAction(OrderStatus.ACCEPTED, OrderAction.START_PREPARING),
    ).toBe(OrderStatus.PREPARING);

    expect(
      resolveOrderAction(OrderStatus.PREPARING, OrderAction.MARK_READY),
    ).toBe(OrderStatus.READY);

    expect(resolveOrderAction(OrderStatus.READY, OrderAction.COMPLETE)).toBe(
      OrderStatus.COMPLETED,
    );
  });

  it('keeps repeated actions idempotent', () => {
    expect(resolveOrderAction(OrderStatus.ACCEPTED, OrderAction.ACCEPT)).toBe(
      OrderStatus.ACCEPTED,
    );

    expect(
      resolveOrderAction(OrderStatus.COMPLETED, OrderAction.COMPLETE),
    ).toBe(OrderStatus.COMPLETED);
  });

  it('rejects invalid actions for the current state', () => {
    expect(
      resolveOrderAction(OrderStatus.PENDING, OrderAction.COMPLETE),
    ).toBeNull();

    expect(
      resolveOrderAction(OrderStatus.ACCEPTED, OrderAction.MARK_READY),
    ).toBeNull();

    expect(
      resolveOrderAction(OrderStatus.COMPLETED, OrderAction.START_PREPARING),
    ).toBeNull();
  });
});
