import type { CustomerUser } from '@prisma/client';
import type { Request } from 'express';

export type PublicCustomer = Pick<
  CustomerUser,
  'id' | 'email' | 'name' | 'phone'
>;
export type CustomerPrincipal = PublicCustomer & { sessionId: string };
export interface CustomerRequest extends Request {
  user: CustomerPrincipal;
}
export type CustomerTokenPayload = {
  sub: string;
  sid: string;
  tokenType: 'customer_access' | 'customer_refresh';
  jti: string;
  version?: number;
};
export type CustomerTokens = {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
};
export type CustomerAuthResult = CustomerTokens & { user: PublicCustomer };

export function publicCustomer(user: PublicCustomer): PublicCustomer {
  return { id: user.id, email: user.email, name: user.name, phone: user.phone };
}

export function isCustomerPayload(
  value: unknown,
  tokenType: CustomerTokenPayload['tokenType'],
): value is CustomerTokenPayload {
  if (!value || typeof value !== 'object') return false;
  const payload = value as Record<string, unknown>;
  const uuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return (
    typeof payload.sub === 'string' &&
    uuid.test(payload.sub) &&
    typeof payload.sid === 'string' &&
    uuid.test(payload.sid) &&
    typeof payload.jti === 'string' &&
    uuid.test(payload.jti) &&
    payload.tokenType === tokenType &&
    Number.isInteger(payload.exp) &&
    Number.isInteger(payload.iat) &&
    (tokenType !== 'customer_refresh' ||
      (Number.isSafeInteger(payload.version) && Number(payload.version) >= 0))
  );
}
