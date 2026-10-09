import type { GuestOrderLookupRequest } from "../types/order-tracking.types";

const TRACKING_LOOKUP_STORAGE_KEY = "orderly:tracking-lookup";

export type StoredTrackingLookup = GuestOrderLookupRequest & {
  verifiedAt: number;
};

export function saveTrackingLookup(payload: GuestOrderLookupRequest) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(
      TRACKING_LOOKUP_STORAGE_KEY,
      JSON.stringify({
        ...payload,
        verifiedAt: Date.now(),
      }),
    );
  } catch {
    // Order creation must still reach success when browser storage is unavailable.
  }
}

export function getTrackingLookup(): StoredTrackingLookup | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.sessionStorage.getItem(TRACKING_LOOKUP_STORAGE_KEY);
    if (!rawValue) return null;
    const parsed = JSON.parse(rawValue) as StoredTrackingLookup;

    if (!parsed.orderNumber || (!parsed.email && !parsed.phone)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function clearTrackingLookup() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(TRACKING_LOOKUP_STORAGE_KEY);
  } catch {
    // Tracking verification remains available without persisted contact details.
  }
}
