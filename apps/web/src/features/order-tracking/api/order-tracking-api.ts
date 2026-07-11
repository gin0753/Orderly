import type {
  GuestOrderLookupRequest,
  OrderTrackingResponse,
} from "../types/order-tracking.types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

type ApiErrorResponse = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};

const getApiErrorMessage = (data: ApiErrorResponse): string => {
  if (Array.isArray(data.message)) {
    return data.message[0] || "Unable to track this order.";
  }

  return (
    data.message?.trim() || data.error?.trim() || "Unable to track this order."
  );
};

export async function lookupGuestOrder(
  payload: GuestOrderLookupRequest,
): Promise<OrderTrackingResponse> {
  const response = await fetch(`${API_BASE_URL}/orders/guest/lookup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data
        ? getApiErrorMessage(data)
        : "Unable to track this order. Please try again.",
    );
  }

  return data as OrderTrackingResponse;
}
