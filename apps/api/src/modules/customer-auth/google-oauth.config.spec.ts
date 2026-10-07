import { ConfigService } from '@nestjs/config';
import { CustomerAuthConfig } from './customer-auth.config';
import { GoogleOAuthConfig } from './google-oauth.config';

const customer = { webOrigin: 'https://orderly.example' } as CustomerAuthConfig;
const complete = {
  GOOGLE_CLIENT_ID: 'google-client',
  GOOGLE_CLIENT_SECRET: 'google-secret',
  GOOGLE_CALLBACK_URL:
    'https://orderly.example/api/customer/auth/google/callback',
};

function config(values: Record<string, string | undefined>) {
  return new GoogleOAuthConfig(new ConfigService(values), customer);
}

it('clearly disables Google when no configuration is supplied', () => {
  expect(config({}).enabled).toBe(false);
});

it('rejects partial configuration and callbacks outside the public web origin', () => {
  expect(() => config({ GOOGLE_CLIENT_ID: 'only-id' })).toThrow(/requires/);
  expect(() =>
    config({
      ...complete,
      GOOGLE_CALLBACK_URL:
        'https://api.example/api/customer/auth/google/callback',
    }),
  ).toThrow(/WEB_ORIGIN/);
  expect(() =>
    config({
      ...complete,
      GOOGLE_CALLBACK_URL: 'https://orderly.example/other',
    }),
  ).toThrow(/WEB_ORIGIN/);
});

it('allows the controlled provider only in test mode', () => {
  expect(
    config({
      ...complete,
      NODE_ENV: 'production',
      GOOGLE_OAUTH_TEST_PROVIDER: '1',
    }).fixture,
  ).toBe(false);
  expect(
    config({ ...complete, NODE_ENV: 'test', GOOGLE_OAUTH_TEST_PROVIDER: '1' })
      .fixture,
  ).toBe(true);
});
