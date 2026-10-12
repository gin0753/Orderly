import { customerApiFetch } from "@/features/customer-auth/api/customer-api-fetch";
import { ApiError } from "@/lib/api-fetch";
import type {
  GuestOrderLookupRequest,
  OrderTrackingResponse,
} from "../types/order-tracking.types";

export const INVALID_TRACKING_DETAILS_MESSAGE =
  "Tracking access could not be verified. Check your order number and receipt code, or sign in to the account that placed the order.";

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
  try {
    return await customerApiFetch<OrderTrackingResponse>("/orders/guest/lookup", {
      method: "POST", body: JSON.stringify(payload),
      // Bearer receipts need no session refresh; owner-only access uses existing session handling.
      auth: payload.receiptCode !== undefined ? "public" : "optional",
    });
  } catch (error) {
    throw new OrderTrackingLookupError(error instanceof ApiError && [400, 401, 404].includes(error.status) ? "invalid-details" : "unavailable");
  }
}
