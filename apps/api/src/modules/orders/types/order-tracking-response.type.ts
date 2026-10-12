import { OrderStatus, OrderType, PaymentStatus } from '@prisma/client';

export type OrderTrackingOptionResponse = {
  optionGroupName: string;
  name: string;
  priceDeltaCents: number;
};

export type OrderTrackingItemResponse = {
  name: string;
  imageUrl: string | null;
  sizeName: string | null;
  sizePriceCents: number | null;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  options: OrderTrackingOptionResponse[];
};

export type OrderTrackingResponse = {
  orderNumber: string;
  status: OrderStatus;
  orderType: OrderType;
  paymentStatus: PaymentStatus;

  items: OrderTrackingItemResponse[];

  subtotalCents: number;
  deliveryFeeCents: number;
  serviceFeeCents: number;
  totalCents: number;

  createdAt: string;
  updatedAt: string;
};
