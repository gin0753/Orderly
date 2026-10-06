import type { PublicCustomer } from "@/features/customer-auth/types";
import type { CheckoutFormState } from "./checkout-types";

export type ContactField = "fullName" | "email" | "phone";
export type CheckoutContactTouched = Record<ContactField, boolean>;
export type CheckoutDraft = { form: CheckoutFormState; touched: CheckoutContactTouched };

const DRAFT_KEY = "orderly-checkout-return-draft";
const DRAFT_TTL_MS = 10 * 60 * 1000;
const CONTACT_FIELDS: ContactField[] = ["fullName", "email", "phone"];

export function withCustomerPrefill(
  form: CheckoutFormState,
  touched: CheckoutContactTouched,
  customer: PublicCustomer | null,
): CheckoutFormState {
  return {
    ...form,
    fullName: touched.fullName ? form.fullName : customer?.name ?? "",
    email: touched.email ? form.email : customer?.email ?? "",
    phone: touched.phone ? form.phone : customer?.phone ?? "",
  };
}

export function saveCheckoutReturnDraft(draft: CheckoutDraft) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, expiresAt: Date.now() + DRAFT_TTL_MS }));
  } catch { /* Checkout remains usable when per-tab storage is unavailable. */ }
}

export function readCheckoutReturnDraft(): CheckoutDraft | null {
  if (typeof window === "undefined") return null;
  let raw: string | null;
  try {
    raw = sessionStorage.getItem(DRAFT_KEY);
  } catch { return null; }
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const value = parsed as Record<string, unknown>;
    if (typeof value.expiresAt !== "number" || value.expiresAt <= Date.now()) return null;
    if (!value.form || typeof value.form !== "object" || !value.touched || typeof value.touched !== "object") return null;
    const form = value.form as Record<string, unknown>;
    const touched = value.touched as Record<string, unknown>;
    const fields: Array<Exclude<keyof CheckoutFormState, "fulfillmentType">> = [
      "fullName", "email", "phone", "address", "apartment", "city", "state", "postcode", "orderNotes",
    ];
    if (form.fulfillmentType !== "pickup" && form.fulfillmentType !== "delivery") return null;
    if (fields.some((field) => typeof form[field] !== "string" || (form[field] as string).length > 500)) return null;
    if (CONTACT_FIELDS.some((field) => typeof touched[field] !== "boolean")) return null;
    return { form: form as CheckoutFormState, touched: touched as CheckoutContactTouched };
  } catch { return null; }
}

export function clearCheckoutReturnDraft() {
  if (typeof window === "undefined") return;
  try { sessionStorage.removeItem(DRAFT_KEY); } catch { /* Storage is optional. */ }
}
