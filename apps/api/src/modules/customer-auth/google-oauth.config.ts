import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CustomerAuthConfig } from './customer-auth.config';

@Injectable()
export class GoogleOAuthConfig {
  readonly enabled: boolean;
  readonly clientId: string;
  readonly clientSecret: string;
  readonly callbackUrl: string;
  readonly fixture: boolean;

  constructor(config: ConfigService, customer: CustomerAuthConfig) {
    const values = [
      config.get<string>('GOOGLE_CLIENT_ID')?.trim() ?? '',
      config.get<string>('GOOGLE_CLIENT_SECRET')?.trim() ?? '',
      config.get<string>('GOOGLE_CALLBACK_URL')?.trim() ?? '',
    ];
    if (values.some(Boolean) && values.some((value) => !value)) {
      throw new Error(
        'Google OAuth requires GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_CALLBACK_URL together.',
      );
    }
    this.enabled = values.every(Boolean);
    [this.clientId, this.clientSecret, this.callbackUrl] = values;
    this.fixture =
      config.get<string>('NODE_ENV') === 'test' &&
      config.get<string>('GOOGLE_OAUTH_TEST_PROVIDER') === '1';
    if (this.fixture && !this.enabled)
      throw new Error(
        'The Google test provider requires complete OAuth configuration.',
      );
    if (this.enabled) {
      const url = new URL(this.callbackUrl);
      if (
        url.origin !== customer.webOrigin ||
        url.pathname !== '/api/customer/auth/google/callback' ||
        url.search ||
        url.hash
      ) {
        throw new Error(
          'GOOGLE_CALLBACK_URL must be the exact customer Google callback on WEB_ORIGIN.',
        );
      }
    }
  }
}
