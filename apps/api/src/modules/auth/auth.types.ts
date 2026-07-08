import type { AdminRole } from '@prisma/client';
import type { Request } from 'express';

export type AuthenticatedAdmin = {
  id: string;
  email: string;
  role: AdminRole;
};

export type AccessTokenPayload = {
  sub: string;
  sid: string;
  email: string;
  role: AdminRole;
};

export type RefreshTokenPayload = AccessTokenPayload & {
  version: number;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthResponse = AuthTokens & {
  user: AuthenticatedAdmin;
};

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedAdmin;
}
