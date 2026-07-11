import { apiFetch } from "@/lib/api-fetch";

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
  orderNumber: string;
  status: string;
  paymentStatus: string;
  orderType: "PICKUP" | "DELIVERY";
  totalCents: number;
  createdAt: string;
};

export function createOrder(input: CreateOrderRequest) {
  return apiFetch<CreateOrderResponse>("/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}
