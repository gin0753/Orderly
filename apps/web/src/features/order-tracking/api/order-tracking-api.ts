import { API_BASE_URL } from "@/lib/api-base-url";
import type {
  GuestOrderLookupRequest,
  OrderTrackingResponse,
} from "../types/order-tracking.types";

export const INVALID_TRACKING_DETAILS_MESSAGE =
  "We couldn’t find an order matching those details. Check the order number and the email or phone used at checkout, then try again.";

export const TRACKING_UNAVAILABLE_MESSAGE =
  "Tracking is temporarily unavailable. Try again in a moment.";

export type OrderTrackingErrorKind = "invalid-details" | "unavailable";

export class OrderTrackingLookupError extends Error {
  constructor(public readonly kind: OrderTrackingErrorKind) {
    super(
      kind === "invalid-details"
        ? INVALID_TRACKING_DETAILS_MESSAGE
        : TRACKING_UNAVAILABLE_MESSAGE,
    );
    this.name = "OrderTrackingLookupError";
  }
}

export async function lookupGuestOrder(
  payload: GuestOrderLookupRequest,
): Promise<OrderTrackingResponse> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/orders/guest/lookup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new OrderTrackingLookupError("unavailable");
  }

  if (!response.ok) {
    throw new OrderTrackingLookupError(
      response.status === 400 || response.status === 404
        ? "invalid-details"
        : "unavailable",
    );
  }

  try {
    return (await response.json()) as OrderTrackingResponse;
  } catch {
    throw new OrderTrackingLookupError("unavailable");
  }
}
