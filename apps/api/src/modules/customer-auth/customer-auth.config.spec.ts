import { ConfigService } from '@nestjs/config';
import { CustomerAuthConfig } from './customer-auth.config';

const environment = {
  CUSTOMER_JWT_ACCESS_SECRET:
    'customer-access-secret-with-at-least-32-characters',
  CUSTOMER_JWT_REFRESH_SECRET:
    'customer-refresh-secret-with-at-least-32-characters',
  JWT_ACCESS_SECRET: 'admin-access-secret-with-at-least-32-characters',
  JWT_REFRESH_SECRET: 'admin-refresh-secret-with-at-least-32-characters',
  WEB_ORIGIN: 'https://orderly.example',
};

function configuration(patch: Record<string, string | undefined> = {}) {
  const config = new ConfigService({ ...environment, ...patch });
  Object.defineProperty(config, 'skipProcessEnv', { value: true });
  return new CustomerAuthConfig(config);
}

it('uses 15-minute access, seven-day sliding refresh and 30-day absolute cap', () => {
  expect(configuration()).toMatchObject({
    accessSeconds: 900,
    refreshSeconds: 604800,
    absoluteSeconds: 2592000,
  });
});

it.each([
  { CUSTOMER_JWT_ACCESS_SECRET: undefined },
  { CUSTOMER_JWT_REFRESH_SECRET: 'short' },
  { CUSTOMER_JWT_ACCESS_SECRET: environment.CUSTOMER_JWT_REFRESH_SECRET },
  { CUSTOMER_JWT_ACCESS_SECRET: environment.JWT_ACCESS_SECRET },
  { CUSTOMER_JWT_REFRESH_SECRET: environment.JWT_REFRESH_SECRET },
  { CUSTOMER_JWT_ACCESS_TTL: '0m' },
  { CUSTOMER_JWT_ACCESS_TTL: '7d' },
  { CUSTOMER_SESSION_ABSOLUTE_TTL: '1d' },
  { CUSTOMER_JWT_REFRESH_TTL: 'forever' },
  { CUSTOMER_JWT_ISSUER: ' ' },
  { CUSTOMER_JWT_AUDIENCE: '' },
  { WEB_ORIGIN: 'https://orderly.example/path' },
  { WEB_ORIGIN: 'https://orderly.example/' },
  { WEB_ORIGIN: 'null' },
  { NODE_ENV: 'production', WEB_ORIGIN: 'http://orderly.example' },
])('fails startup on unsafe customer configuration %j', (patch) => {
  expect(() => configuration(patch)).toThrow();
});

it('requires Secure cookies in production with an exact HTTPS browser origin', () => {
  expect(configuration({ NODE_ENV: 'production' }).secure).toBe(true);
});
