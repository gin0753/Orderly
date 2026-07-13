export type OrderStatus =
  | "PENDING"
  | "ACCEPTED"
  | "PREPARING"
  | "READY"
  | "COMPLETED"
  | "CANCELLED";

export type OrderType = "PICKUP" | "DELIVERY";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export type SubmitStatus = "idle" | "submitting" | "navigating";

export type GuestOrderLookupRequest = {
  orderNumber: string;
  email?: string;
  phone?: string;
};

export type OrderTrackingItemOption = {
  id: string;
  optionGroupName: string;
  name: string;
  priceDeltaCents: number;
};

export type OrderTrackingItem = {
  id: string;
  productId: string | null;
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

  items: OrderTrackingItem[];

  subtotalCents: number;
  deliveryFeeCents: number;
  serviceFeeCents: number;
  totalCents: number;

  createdAt: string;
  updatedAt: string;
};
