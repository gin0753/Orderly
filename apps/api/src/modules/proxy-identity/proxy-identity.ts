import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';
import type { Request } from 'express';

const IP_HEADER = 'x-orderly-client-ip';
const SIGNATURE_HEADER = 'x-orderly-client-ip-signature';

export function normalizeClientIp(value: string): string | null {
  if (value !== value.trim() || value.includes(',')) return null;
  if (isIP(value) === 4) return value;
  if (isIP(value) === 6)
    return new URL(`http://[${value}]`).hostname.slice(1, -1);
  return null;
}

export function resolveProxyIdentity(
  request: Pick<Request, 'headers' | 'socket'>,
  secret: string | undefined,
): { tracker: string; source: 'vercel-signed' | 'railway-direct' } {
  const rawIp = request.headers[IP_HEADER];
  const rawSignature = request.headers[SIGNATURE_HEADER];
  if (
    secret &&
    Buffer.byteLength(secret, 'utf8') >= 32 &&
    typeof rawIp === 'string' &&
    typeof rawSignature === 'string' &&
    /^[a-f0-9]{64}$/.test(rawSignature)
  ) {
    const ip = normalizeClientIp(rawIp);
    if (ip) {
      const expected = createHmac('sha256', secret).update(`v1:${ip}`).digest();
      const supplied = Buffer.from(rawSignature, 'hex');
      if (timingSafeEqual(expected, supplied)) {
        return {
          tracker: createHash('sha256').update(`vercel:${ip}`).digest('hex'),
          source: 'vercel-signed',
        };
      }
    }
  }

  // The socket peer is set by the transport, not by forwarded request headers.
  const socketIp = normalizeClientIp(request.socket.remoteAddress ?? '');
  return {
    tracker: createHash('sha256')
      .update(`railway-direct:${socketIp ?? 'unknown'}`)
      .digest('hex'),
    source: 'railway-direct',
  };
}

export function proxyTracker(
  request: Pick<Request, 'headers' | 'socket'>,
  secret: string | undefined,
): string {
  return resolveProxyIdentity(request, secret).tracker;
}
