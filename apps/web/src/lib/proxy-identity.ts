import { createHmac } from "node:crypto";
import { isIP } from "node:net";

export const CLIENT_IP_HEADER = "X-Orderly-Client-IP";
export const CLIENT_IP_SIGNATURE_HEADER = "X-Orderly-Client-IP-Signature";

export function normalizeClientIp(value: string | null): string | null {
  if (!value || value !== value.trim() || value.includes(",")) return null;
  if (isIP(value) === 4) return value;
  if (isIP(value) === 6) return new URL(`http://[${value}]`).hostname.slice(1, -1);
  return null;
}

export function signedProxyHeaders(
  incoming: Headers,
  secret: string | undefined,
): Headers {
  const headers = new Headers(incoming);
  headers.delete(CLIENT_IP_HEADER);
  headers.delete(CLIENT_IP_SIGNATURE_HEADER);

  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ORDERLY_PROXY_IDENTITY_SECRET must contain at least 32 bytes.");
    }
    return headers;
  }

  const ip = normalizeClientIp(incoming.get("x-forwarded-for"));
  if (!ip) return headers;
  headers.set(CLIENT_IP_HEADER, ip);
  headers.set(
    CLIENT_IP_SIGNATURE_HEADER,
    createHmac("sha256", secret).update(`v1:${ip}`).digest("hex"),
  );
  return headers;
}
