import type { Prisma } from '@prisma/client';

import type { OrderTrackingResponse } from '../types/order-tracking-response.type';

type OrderWithTrackingRelations = Prisma.OrderGetPayload<{
  include: {
    items: {
      include: {
        options: true;
      };
    };
  };
}>;

export function mapOrderToTrackingResponse(
  order: OrderWithTrackingRelations,
): OrderTrackingResponse {
  return {
    orderNumber: order.orderNumber,
    status: order.status,
    orderType: order.orderType,
    paymentStatus: order.paymentStatus,

    items: order.items.map((item) => ({
      name: item.productNameSnapshot,
      imageUrl: item.productImageUrlSnapshot,
      sizeName: item.sizeNameSnapshot,
      sizePriceCents: item.sizePriceCentsSnapshot,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      lineTotalCents: item.lineTotalCents,
      options: item.options.map((option) => ({
        optionGroupName: option.optionGroupNameSnapshot,
        name: option.optionNameSnapshot,
        priceDeltaCents: option.priceDeltaCentsSnapshot,
      })),
    })),

    subtotalCents: order.subtotalCents,
    deliveryFeeCents: order.deliveryFeeCents,
    serviceFeeCents: order.serviceFeeCents,
    totalCents: order.totalCents,

    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}
