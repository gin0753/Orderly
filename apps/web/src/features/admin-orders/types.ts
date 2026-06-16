export type AdminOrderStatus =
  | "PENDING"
  | "ACCEPTED"
  | "PREPARING"
  | "READY"
  | "COMPLETED"
  | "CANCELLED";

export type AdminOrderType = "PICKUP" | "DELIVERY";

export type AdminPaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export type AdminOrderItem = {
  id: string;
  orderId: string;
  productId?: string | null;

  productNameSnapshot: string;
  productImageUrlSnapshot?: string | null;

  sizeNameSnapshot?: string | null;
  sizePriceCentsSnapshot?: number | null;

  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;

  options: AdminOrderItemOption[];

  createdAt: string;
};

export type AdminOrderItemOption = {
  id: string;
  orderItemId: string;
  optionId?: string | null;

  optionGroupNameSnapshot: string;
  optionNameSnapshot: string;
  priceDeltaCentsSnapshot: number;

  createdAt: string;
};

export type AdminOrder = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;

  orderType: AdminOrderType;
  status: AdminOrderStatus;
  paymentStatus: AdminPaymentStatus;

  subtotalCents: number;
  deliveryFeeCents: number;
  serviceFeeCents: number;
  taxCents?: number | null;
  totalCents: number;

  deliveryAddress?: string | null;
  deliverySuburb?: string | null;
  deliveryPostcode?: string | null;
  notes?: string | null;

  items: AdminOrderItem[];

  createdAt: string;
  updatedAt: string;
};

export type AdminOrderFilters = {
  orderType?: AdminOrderType;
  status?: AdminOrderStatus;
};
