import { getTrackingLookup, clearTrackingLookup } from "@/features/order-tracking/utils/order-tracking-storage";
import { scrubAccountCheckoutDraft } from "@/features/checkout/checkout-customer";

export function clearDeletedCustomerData(customerId: string, clearSavedReceipt = false, clearAccountDraft = true) {
  if (clearSavedReceipt || getTrackingLookup()?.customerUserId === customerId) clearTrackingLookup();
  if (clearAccountDraft) {
    scrubAccountCheckoutDraft();
    try { sessionStorage.removeItem("orderly-registration-email"); } catch { /* Storage is optional. */ }
  }
}
