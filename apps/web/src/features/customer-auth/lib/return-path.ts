export const DEFAULT_CUSTOMER_RETURN_PATH = "/account";
const BASE = "https://orderly.invalid";
const ALLOWED = /^(?:\/|\/checkout|\/account(?:\/orders(?:\/[0-9a-fA-F-]{36})?)?|\/track-order(?:\/[0-9]+)?)$/;

export function safeCustomerReturnPath(value: string | null): string {
  if (!value?.startsWith("/") || value.startsWith("//") || /[\\\s]/.test(value)) return DEFAULT_CUSTOMER_RETURN_PATH;
  try {
    const url = new URL(value, BASE);
    const pathname = url.pathname.replace(/\/$/, "") || "/";
    if (url.origin !== BASE || !ALLOWED.test(pathname) || /%|[\\\s]/.test(pathname)) return DEFAULT_CUSTOMER_RETURN_PATH;
    // Keep only the parameters understood by current/planned customer destinations.
    const query = new URLSearchParams();
    for (const [key, entry] of url.searchParams) {
      if (["page", "pageSize"].includes(key) && /^[1-9]\d{0,5}$/.test(entry)) query.set(key, entry);
      if (key === "status" && /^(PENDING|ACCEPTED|PREPARING|READY|COMPLETED|CANCELLED)$/.test(entry)) query.set(key, entry);
      if (key === "sort" && /^(newest|oldest|amount_high|amount_low)$/.test(entry)) query.set(key, entry);
      if (key === "orderNumber" && /^\d{1,30}$/.test(entry)) query.set(key, entry);
    }
    return `${pathname}${query.size ? `?${query}` : ""}`;
  } catch { return DEFAULT_CUSTOMER_RETURN_PATH; }
}
