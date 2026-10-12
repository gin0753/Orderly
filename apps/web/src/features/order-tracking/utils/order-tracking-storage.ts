import type { GuestOrderLookupRequest } from "../types/order-tracking.types";

const TRACKING_LOOKUP_STORAGE_KEY = "orderly:tracking-lookup";
export type StoredTrackingLookup = GuestOrderLookupRequest & { expiresAt?: string; customerUserId?: string };
let memoryReceipt: StoredTrackingLookup | null = null;

function valid(value: StoredTrackingLookup): boolean {
  return typeof value.orderNumber === "string" && /^[A-Za-z0-9_-]{43}$/.test(value.receiptCode ?? "") &&
    (value.expiresAt === undefined || (typeof value.expiresAt === "string" && Date.parse(value.expiresAt) > Date.now()));
}
export function saveTrackingLookup(payload: StoredTrackingLookup) {
  memoryReceipt = valid(payload) ? {
    orderNumber: payload.orderNumber, receiptCode: payload.receiptCode,
    ...(payload.expiresAt !== undefined ? { expiresAt: payload.expiresAt } : {}),
    ...(typeof payload.customerUserId === "string" ? { customerUserId: payload.customerUserId } : {}),
  } : null;
  if (typeof window === "undefined") return;
  try {
    if (memoryReceipt) window.sessionStorage.setItem(TRACKING_LOOKUP_STORAGE_KEY, JSON.stringify(memoryReceipt));
    else window.sessionStorage.removeItem(TRACKING_LOOKUP_STORAGE_KEY);
  } catch { /* In-memory receipt preserves confirmation when storage is unavailable. */ }
}
export function getTrackingLookup(): StoredTrackingLookup | null {
  if (typeof window === "undefined") return null;
  if (memoryReceipt && valid(memoryReceipt)) return { ...memoryReceipt };
  try {
    const raw = window.sessionStorage.getItem(TRACKING_LOOKUP_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredTrackingLookup;
      if (parsed && valid(parsed)) {
        memoryReceipt = { orderNumber: parsed.orderNumber, receiptCode: parsed.receiptCode, ...(parsed.expiresAt !== undefined ? { expiresAt: parsed.expiresAt } : {}), ...(typeof parsed.customerUserId === "string" ? { customerUserId: parsed.customerUserId } : {}) };
        return { ...memoryReceipt };
      }
    }
  } catch { /* Storage is optional. */ }
  clearTrackingLookup();
  return null;
}
export function clearTrackingLookup() {
  memoryReceipt = null;
  if (typeof window === "undefined") return;
  try { window.sessionStorage.removeItem(TRACKING_LOOKUP_STORAGE_KEY); } catch { /* Optional. */ }
}
