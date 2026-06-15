import { apiFetch } from "@/lib/api";

export type CreateOrderFulfillmentType = "PICKUP" | "DELIVERY";

export type CreateOrderRequest = {
  fulfillmentType: CreateOrderFulfillmentType;
  customer: {
    name: string;
    phone: string;
    email: string;
  };
  address?: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postcode: string;
  };
  notes?: string;
  items: Array<{
    productId: string;
    productName: string;
    productImageUrl?: string;
    sizeName?: string;
    sizePriceCents?: number;
    quantity: number;
    unitPriceCents: number;
    lineTotalCents: number;
    addOns: Array<{
      name: string;
      priceCents: number;
    }>;
  }>;
};

export type CreateOrderResponse = {
  orderId: string;
  status: string;
  paymentStatus: string;
  orderType: string;
  totalCents: number;
  createdAt: string;
};

export function createOrder(input: CreateOrderRequest) {
  return apiFetch<CreateOrderResponse>("/orders", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
