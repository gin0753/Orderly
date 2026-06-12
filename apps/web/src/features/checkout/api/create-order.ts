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

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

export async function createOrder(input: CreateOrderRequest) {
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    let message = "Failed to create order.";

    try {
      const error = await response.json();

      if (typeof error.message === "string") {
        message = error.message;
      }
    } catch {
      // Keep fallback message.
    }

    throw new Error(message);
  }

  return response.json() as Promise<CreateOrderResponse>;
}
