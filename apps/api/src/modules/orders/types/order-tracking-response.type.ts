import { OrderStatus, OrderType, PaymentStatus } from '@prisma/client';

export type OrderTrackingOptionResponse = {
  id: string;
  optionGroupName: string;
  name: string;
  priceDeltaCents: number;
};

export type OrderTrackingItemResponse = {
  id: string;
  productId: string | null;
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
  id: string;
  orderNumber: string;
  status: OrderStatus;
  orderType: OrderType;
  paymentStatus: PaymentStatus;

  customerName: string;
  customerEmail: string;
  customerPhone: string;

  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postcode: string | null;

  notes: string | null;

  items: OrderTrackingItemResponse[];

  subtotalCents: number;
  deliveryFeeCents: number;
  serviceFeeCents: number;
  totalCents: number;

  createdAt: string;
  updatedAt: string;
};
