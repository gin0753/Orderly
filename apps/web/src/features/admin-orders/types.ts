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
  productId?: string | null;
  name: string;
  imageUrl?: string | null;
  quantity: number;
  unitPriceCents: number;
  totalPriceCents: number;
  sizeName?: string | null;
  addOns?: unknown;
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
