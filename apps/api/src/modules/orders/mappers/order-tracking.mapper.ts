import { Prisma } from '@prisma/client';

import { OrderTrackingResponse } from '../types/order-tracking-response.type';

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
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    orderType: order.orderType,
    paymentStatus: order.paymentStatus,

    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,

    addressLine1: order.addressLine1,
    addressLine2: order.addressLine2,
    city: order.city,
    state: order.state,
    postcode: order.postcode,

    notes: order.notes,

    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      name: item.productNameSnapshot,
      imageUrl: item.productImageUrlSnapshot,
      sizeName: item.sizeNameSnapshot,
      sizePriceCents: item.sizePriceCentsSnapshot,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      lineTotalCents: item.lineTotalCents,
      options: item.options.map((option) => ({
        id: option.id,
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
