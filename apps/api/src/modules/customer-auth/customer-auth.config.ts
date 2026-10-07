import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const CUSTOMER_COOKIES = {
  access: 'orderly_customer_access',
  refresh: 'orderly_customer_refresh',
} as const;

@Injectable()
export class CustomerAuthConfig {
  readonly accessSecret: string;
  readonly refreshSecret: string;
  readonly issuer: string;
  readonly audience: string;
  readonly accessSeconds: number;
  readonly refreshSeconds: number;
  readonly absoluteSeconds: number;
  readonly webOrigin: string;
  readonly secure: boolean;

  constructor(config: ConfigService) {
    this.accessSecret = config.getOrThrow<string>('CUSTOMER_JWT_ACCESS_SECRET');
    this.refreshSecret = config.getOrThrow<string>(
      'CUSTOMER_JWT_REFRESH_SECRET',
    );
    const secrets = [this.accessSecret, this.refreshSecret];
    const adminSecrets = [
      config.get<string>('JWT_ACCESS_SECRET'),
      config.get<string>('JWT_REFRESH_SECRET'),
    ];
    if (
      secrets.some(
        (secret) => secret.trim().length < 32 || adminSecrets.includes(secret),
      ) ||
      secrets[0] === secrets[1]
    ) {
      throw new Error(
        'Customer JWT secrets must be distinct from each other and Admin secrets, and contain at least 32 characters.',
      );
    }
    this.issuer =
      config.get<string>('CUSTOMER_JWT_ISSUER') ?? 'orderly-customer';
    this.audience =
      config.get<string>('CUSTOMER_JWT_AUDIENCE') ?? 'orderly-customer-api';
    if (!this.issuer.trim() || !this.audience.trim()) {
      throw new Error('Customer JWT issuer and audience must not be blank.');
    }
    this.accessSeconds = duration(
      config.get<string>('CUSTOMER_JWT_ACCESS_TTL') ?? '15m',
    );
    this.refreshSeconds = duration(
      config.get<string>('CUSTOMER_JWT_REFRESH_TTL') ?? '7d',
    );
    this.absoluteSeconds = duration(
      config.get<string>('CUSTOMER_SESSION_ABSOLUTE_TTL') ?? '30d',
    );
    if (
      this.accessSeconds >= this.refreshSeconds ||
      this.refreshSeconds > this.absoluteSeconds
    ) {
      throw new Error(
        'Customer access TTL must be shorter than refresh TTL, which must not exceed the absolute session TTL.',
      );
    }
    this.secure = config.get<string>('NODE_ENV') === 'production';
    this.webOrigin =
      config.get<string>('WEB_ORIGIN') ?? 'http://localhost:3000';
    const origin = new URL(this.webOrigin);
    if (
      origin.origin !== this.webOrigin ||
      !['http:', 'https:'].includes(origin.protocol) ||
      (this.secure && origin.protocol !== 'https:')
    ) {
      throw new Error(
        'WEB_ORIGIN must be an exact origin, using HTTPS in production.',
      );
    }
  }
}

function duration(value: string): number {
  const match = /^(\d+)(s|m|h|d)$/.exec(value);
  const units: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  const seconds = match ? Number(match[1]) * units[match[2]] : 0;
  if (!Number.isSafeInteger(seconds) || seconds <= 0 || seconds > 365 * 86400) {
    throw new Error(
      'Customer TTL must be a positive duration such as 15m, 7d or 30d, no longer than one year.',
    );
  }
  return seconds;
}
