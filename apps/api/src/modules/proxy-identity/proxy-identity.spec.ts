import { createHmac } from 'node:crypto';
import type { Request } from 'express';

import { normalizeClientIp, proxyTracker } from './proxy-identity';

const secret = 'proxy-test-secret-of-at-least-thirty-two-bytes';
const sign = (ip: string, key = secret) =>
  createHmac('sha256', key).update(`v1:${ip}`).digest('hex');

function request(
  headers: Record<string, string> = {},
  remoteAddress = '10.0.0.5',
): Pick<Request, 'headers' | 'socket'> {
  return {
    headers,
    socket: { remoteAddress } as Request['socket'],
  };
}

describe('signed proxy throttle identity', () => {
  it('normalizes IPv4 and IPv6 deterministically', () => {
    expect(normalizeClientIp('203.0.113.7')).toBe('203.0.113.7');
    expect(normalizeClientIp('2001:0DB8:0:0:0:0:0:1')).toBe('2001:db8::1');
    expect(normalizeClientIp('203.0.113.7, 198.51.100.2')).toBeNull();
  });

  it('uses one bucket for repeated signed requests and separates clients', () => {
    const a = request({
      'x-orderly-client-ip': '203.0.113.7',
      'x-orderly-client-ip-signature': sign('203.0.113.7'),
    });
    const b = request({
      'x-orderly-client-ip': '203.0.113.8',
      'x-orderly-client-ip-signature': sign('203.0.113.8'),
    });
    expect(proxyTracker(a, secret)).toBe(proxyTracker(a, secret));
    expect(proxyTracker(a, secret)).not.toBe(proxyTracker(b, secret));
  });

  it('ignores forged, malformed, unsigned, and old-secret identities', () => {
    const fallback = proxyTracker(request(), secret);
    const forgedHeaders: Array<Record<string, string>> = [
      { 'x-orderly-client-ip': '203.0.113.7' },
      {
        'x-orderly-client-ip': '203.0.113.7',
        'x-orderly-client-ip-signature': 'bad',
      },
      {
        'x-orderly-client-ip': '203.0.113.7',
        'x-orderly-client-ip-signature': sign('203.0.113.7', 'old-secret'),
      },
      {
        'x-orderly-client-ip': 'malformed',
        'x-orderly-client-ip-signature': sign('malformed'),
      },
      { 'x-forwarded-for': '203.0.113.7', 'x-real-ip': '203.0.113.7' },
    ];
    for (const headers of forgedHeaders) {
      expect(proxyTracker(request(headers), secret)).toBe(fallback);
    }
    expect(proxyTracker(request({}, '10.0.0.6'), secret)).not.toBe(fallback);
  });
});
