import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import type { CookieOptions, Response } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { CustomerAuthConfig, CUSTOMER_COOKIES } from './customer-auth.config';
import { CustomerAuthService } from './customer-auth.service';

const settings = new ConfigService({
  CUSTOMER_JWT_ACCESS_SECRET:
    'unit-customer-access-secret-at-least-32-characters',
  CUSTOMER_JWT_REFRESH_SECRET:
    'unit-customer-refresh-secret-at-least-32-characters',
  NODE_ENV: 'production',
  WEB_ORIGIN: 'https://orderly.example',
});
Object.defineProperty(settings, 'skipProcessEnv', { value: true });
const config = new CustomerAuthConfig(settings);
const jwt = new JwtService();

it('rejects a lost rotation compare-and-swap without deleting the winner session', async () => {
  const id = randomUUID();
  const customerUserId = randomUUID();
  const refresh = await jwt.signAsync(
    {
      sub: customerUserId,
      sid: id,
      jti: randomUUID(),
      tokenType: 'customer_refresh',
      version: 4,
    },
    {
      secret: config.refreshSecret,
      issuer: config.issuer,
      audience: config.audience,
      expiresIn: 600,
    },
  );
  const session = {
    id,
    customerUserId,
    refreshTokenVersion: 4,
    refreshTokenHash: createHash('sha256').update(refresh).digest('hex'),
    expiresAt: new Date(Date.now() + 600000),
    createdAt: new Date(),
    customerUser: {
      id: customerUserId,
      email: 'unit@example.test',
      passwordHash: 'hash',
      googleSubject: null,
      isActive: true,
      name: 'Ada',
      phone: null,
    },
  };
  const persistence = {
    customerSession: {
      findUnique: jest.fn().mockResolvedValue(session),
      updateMany: jest
        .fn<Promise<{ count: number }>, [unknown]>()
        .mockResolvedValue({ count: 0 }),
      deleteMany: jest.fn(),
    },
  };
  const service = new CustomerAuthService(
    persistence as unknown as PrismaService,
    jwt,
    config,
  );
  await expect(service.refresh(refresh)).rejects.toThrow(UnauthorizedException);
  const update: unknown =
    persistence.customerSession.updateMany.mock.calls[0][0];
  expect(update).toMatchObject({
    where: {
      id,
      refreshTokenVersion: 4,
      refreshTokenHash: session.refreshTokenHash,
    },
  });
  expect(persistence.customerSession.deleteMany).not.toHaveBeenCalled();
});

it('writes production cookies with separate names, host scope, matching clear options and bounded persistence', () => {
  const response = {
    cookie: jest.fn<void, [string, string, CookieOptions]>(),
    clearCookie: jest.fn(),
    setHeader: jest.fn(),
  };
  const service = new CustomerAuthService({} as PrismaService, jwt, config);
  const refreshExpiresAt = new Date(Date.now() + 60000);
  service.setCookies(response as unknown as Response, {
    accessToken: 'access',
    refreshToken: 'refresh',
    refreshExpiresAt,
  });
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/api',
  };
  expect(response.cookie).toHaveBeenCalledWith(
    CUSTOMER_COOKIES.access,
    'access',
    options,
  );
  const refreshCookie = response.cookie.mock.calls[1];
  expect(refreshCookie.slice(0, 2)).toEqual([
    CUSTOMER_COOKIES.refresh,
    'refresh',
  ]);
  expect(refreshCookie[2]).toMatchObject(options);
  expect(refreshCookie[2].maxAge).toBeGreaterThan(59000);
  expect(refreshCookie[2].maxAge).toBeLessThanOrEqual(60000);
  service.clearCookies(response as unknown as Response);
  expect(response.clearCookie).toHaveBeenCalledWith(
    CUSTOMER_COOKIES.access,
    options,
  );
  expect(response.clearCookie).toHaveBeenCalledWith(
    CUSTOMER_COOKIES.refresh,
    options,
  );
  expect(response.setHeader).toHaveBeenCalledWith(
    'Cache-Control',
    'private, no-store',
  );
});

it('propagates logout persistence failures so the browser can retry revocation', async () => {
  const persistence = {
    customerSession: {
      deleteMany: jest
        .fn()
        .mockRejectedValue(new Error('database unavailable')),
    },
  };
  const service = new CustomerAuthService(
    persistence as unknown as PrismaService,
    jwt,
    config,
  );
  const refresh = await jwt.signAsync(
    {
      sub: randomUUID(),
      sid: randomUUID(),
      jti: randomUUID(),
      tokenType: 'customer_refresh',
      version: 0,
    },
    {
      secret: config.refreshSecret,
      issuer: config.issuer,
      audience: config.audience,
      expiresIn: 600,
    },
  );
  await expect(service.logout(refresh)).rejects.toThrow('database unavailable');
});
