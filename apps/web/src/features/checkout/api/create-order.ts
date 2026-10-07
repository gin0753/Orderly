import { customerApiFetch } from "@/features/customer-auth/api/customer-api-fetch";

export type CreateOrderFulfillmentType = "PICKUP" | "DELIVERY";

export type CreateOrderRequestItem = {
  productId: string;
  quantity: number;
  selectedOptionIds: string[];
};

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
  items: CreateOrderRequestItem[];
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

export function createOrder(input: CreateOrderRequest, options: { expectCustomer?: boolean } = {}) {
  return customerApiFetch<CreateOrderResponse>("/orders", {
    method: "POST",
    body: JSON.stringify(input),
    auth: "optional",
    headers: options.expectCustomer ? { "X-Orderly-Customer-Intent": "authenticated" } : undefined,
  });
}
