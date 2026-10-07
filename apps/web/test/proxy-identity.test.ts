/** @jest-environment node */

import { createHmac } from "node:crypto";

import {
  CLIENT_IP_HEADER,
  CLIENT_IP_SIGNATURE_HEADER,
  normalizeClientIp,
  signedProxyHeaders,
} from "@/lib/proxy-identity";

const secret = "proxy-test-secret-of-at-least-thirty-two-bytes";

describe("Vercel proxy identity", () => {
  it("normalizes valid addresses and rejects malformed input", () => {
    expect(normalizeClientIp("203.0.113.7")).toBe("203.0.113.7");
    expect(normalizeClientIp("2001:0DB8:0:0:0:0:0:1")).toBe("2001:db8::1");
    expect(normalizeClientIp("203.0.113.7, 198.51.100.2")).toBeNull();
    expect(normalizeClientIp("not-an-ip")).toBeNull();
  });

  it("overwrites forged identity headers while preserving unrelated headers", () => {
    const incoming = new Headers({
      "x-forwarded-for": "203.0.113.7",
      "X-Orderly-Client-IP": "198.51.100.2",
      "X-Orderly-Client-IP-Signature": "forged",
      Cookie: "session=example",
      Origin: "https://web.example",
      "X-Orderly-Client": "customer-web",
    });
    const result = signedProxyHeaders(incoming, secret);
    expect(result.get(CLIENT_IP_HEADER)).toBe("203.0.113.7");
    expect(result.get(CLIENT_IP_SIGNATURE_HEADER)).toBe(
      createHmac("sha256", secret).update("v1:203.0.113.7").digest("hex"),
    );
    expect(result.get("Cookie")).toBe("session=example");
    expect(result.get("Origin")).toBe("https://web.example");
    expect(result.get("X-Orderly-Client")).toBe("customer-web");
    expect(result.has("forged")).toBe(false);
    expect([...result.values()].join(" ")).not.toContain(secret);
  });

  it("produces stable signatures, separates clients, and omits malformed values", () => {
    const a = signedProxyHeaders(new Headers({ "x-forwarded-for": "2001:db8::1" }), secret);
    const again = signedProxyHeaders(new Headers({ "x-forwarded-for": "2001:0DB8:0:0:0:0:0:1" }), secret);
    const b = signedProxyHeaders(new Headers({ "x-forwarded-for": "2001:db8::2" }), secret);
    expect(a.get(CLIENT_IP_SIGNATURE_HEADER)).toBe(again.get(CLIENT_IP_SIGNATURE_HEADER));
    expect(a.get(CLIENT_IP_SIGNATURE_HEADER)).not.toBe(b.get(CLIENT_IP_SIGNATURE_HEADER));

    const malformed = signedProxyHeaders(new Headers({
      "x-forwarded-for": "unknown",
      "X-Orderly-Client-IP": "203.0.113.7",
      "X-Orderly-Client-IP-Signature": "forged",
    }), secret);
    expect(malformed.has(CLIENT_IP_HEADER)).toBe(false);
    expect(malformed.has(CLIENT_IP_SIGNATURE_HEADER)).toBe(false);
  });
});
