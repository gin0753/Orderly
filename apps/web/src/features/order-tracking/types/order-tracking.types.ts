export type OrderStatus =
  | "PENDING"
  | "ACCEPTED"
  | "PREPARING"
  | "READY"
  | "COMPLETED"
  | "CANCELLED";

export type OrderType = "PICKUP" | "DELIVERY";

export type PaymentStatus = "UNPAID" | "PAID" | "FAILED" | "REFUNDED";

export type SubmitStatus = "idle" | "submitting" | "navigating";

export type GuestOrderLookupRequest = {
  orderNumber: string;
  receiptCode?: string;
};

export type OrderTrackingItemOption = {

  optionGroupName: string;
  name: string;
  priceDeltaCents: number;
};

export type OrderTrackingItem = {

  name: string;
  imageUrl: string | null;
  sizeName: string | null;
  sizePriceCents: number | null;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  options: OrderTrackingItemOption[];
};

export type OrderTrackingResponse = {

  orderNumber: string;
  status: OrderStatus;
  orderType: OrderType;
  paymentStatus: PaymentStatus;

  items: OrderTrackingItem[];

  subtotalCents: number;
  deliveryFeeCents: number;
  serviceFeeCents: number;
  totalCents: number;

  createdAt: string;
  updatedAt: string;
};
