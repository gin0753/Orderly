export type OrderStatus =
  | "PENDING"
  | "PREPARING"
  | "READY"
  | "COMPLETED"
  | "CANCELLED";

export type OrderType = "PICKUP" | "DELIVERY";

export type SubmitStatus = "idle" | "submitting" | "navigating";

export type GuestOrderLookupRequest = {
  orderNumber: string;
  email?: string;
  phone?: string;
};

export type OrderTrackingItemOption = {
  id: string;
  name: string;
  priceCents: number;
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
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string | null;
  notes: string | null;
  items: OrderTrackingItem[];
  subtotalCents: number;
  deliveryFeeCents: number;
  taxCents: number;
  totalCents: number;
  createdAt: string;
  updatedAt: string;
};
