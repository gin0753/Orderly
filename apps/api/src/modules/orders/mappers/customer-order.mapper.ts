import type { Prisma } from '@prisma/client';

export const customerOrderListSelect = {
  id: true,
  orderNumber: true,
  status: true,
  orderType: true,
  totalCents: true,
  createdAt: true,
  items: { select: { quantity: true } },
} satisfies Prisma.OrderSelect;

export const customerOrderDetailSelect = {
  id: true,
  orderNumber: true,
  status: true,
  orderType: true,
  customerName: true,
  customerEmail: true,
  customerPhone: true,
  addressLine1: true,
  addressLine2: true,
  city: true,
  state: true,
  postcode: true,
  notes: true,
  subtotalCents: true,
  deliveryFeeCents: true,
  serviceFeeCents: true,
  totalCents: true,
  createdAt: true,
  updatedAt: true,
  items: {
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      productNameSnapshot: true,
      productImageUrlSnapshot: true,
      sizeNameSnapshot: true,
      sizePriceCentsSnapshot: true,
      quantity: true,
      unitPriceCents: true,
      lineTotalCents: true,
      options: {
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        select: {
          id: true,
          optionGroupNameSnapshot: true,
          optionNameSnapshot: true,
          priceDeltaCentsSnapshot: true,
        },
      },
    },
  },
} satisfies Prisma.OrderSelect;

type ListOrder = Prisma.OrderGetPayload<{
  select: typeof customerOrderListSelect;
}>;
type DetailOrder = Prisma.OrderGetPayload<{
  select: typeof customerOrderDetailSelect;
}>;

export function mapCustomerOrderSummary(order: ListOrder) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    orderType: order.orderType,
    itemCount: order.items.reduce((total, item) => total + item.quantity, 0),
    totalCents: order.totalCents,
    createdAt: order.createdAt.toISOString(),
  };
}

export function mapCustomerOrderDetail(order: DetailOrder) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    orderType: order.orderType,
    customer: {
      name: order.customerName,
      email: order.customerEmail,
      phone: order.customerPhone,
    },
    address:
      order.orderType === 'DELIVERY'
        ? {
            addressLine1: order.addressLine1,
            addressLine2: order.addressLine2,
            city: order.city,
            state: order.state,
            postcode: order.postcode,
          }
        : null,
    notes: order.notes,
    items: order.items.map((item) => ({
      id: item.id,
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
