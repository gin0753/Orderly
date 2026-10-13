import { ConfigService } from '@nestjs/config';
import { RegistrationMailer } from './registration-mailer';

const settings = (values: Record<string, string>) => {
  const config = new ConfigService(values);
  Object.defineProperty(config, 'skipProcessEnv', { value: true });
  return config;
};
afterEach(() => jest.restoreAllMocks());
it('starts direct production without Resend and never sends even with credentials', async () => {
  const fetchMock = jest.spyOn(globalThis, 'fetch');
  const mailer = new RegistrationMailer(
    settings({ NODE_ENV: 'production', CUSTOMER_REGISTRATION_MODE: 'direct' }),
  );
  await expect(
    mailer.send('synthetic@example.test', 'synthetic'),
  ).rejects.toThrow();
  const configured = new RegistrationMailer(
    settings({
      NODE_ENV: 'production',
      CUSTOMER_REGISTRATION_MODE: 'direct',
      REGISTRATION_EMAIL_API_KEY: 'synthetic',
      REGISTRATION_EMAIL_FROM: 'synthetic@example.test',
    }),
  );
  await expect(
    configured.send('synthetic@example.test', 'synthetic'),
  ).rejects.toThrow();
  expect(fetchMock).not.toHaveBeenCalled();
});
it('rejects an unknown mode before provider startup', () => {
  expect(
    () =>
      new RegistrationMailer(
        settings({ CUSTOMER_REGISTRATION_MODE: 'unknown' }),
      ),
  ).toThrow('CUSTOMER_REGISTRATION_MODE');
});
it('fails closed in production without mail configuration', () => {
  expect(
    () => new RegistrationMailer(settings({ NODE_ENV: 'production' })),
  ).toThrow('Production registration requires');
});
it('never delivers real email in test mode even if keys are configured', async () => {
  const fetchMock = jest.spyOn(globalThis, 'fetch');
  const mailer = new RegistrationMailer(
    settings({
      NODE_ENV: 'test',
      REGISTRATION_EMAIL_API_KEY: 'synthetic',
      REGISTRATION_EMAIL_FROM: 'synthetic@example.test',
    }),
  );
  await expect(
    mailer.send(
      'recipient@example.test',
      'https://app.example.test/verify-email#token=synthetic',
    ),
  ).rejects.toThrow();
  expect(fetchMock).not.toHaveBeenCalled();
});
it('uses transactional plain-text delivery with a timeout and sanitizes provider failures', async () => {
  const fetchMock = jest
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(new Response('secret-provider-error', { status: 500 }));
  const mailer = new RegistrationMailer(
    settings({
      NODE_ENV: 'production',
      REGISTRATION_EMAIL_API_KEY: 'synthetic-key',
      REGISTRATION_EMAIL_FROM: 'Orderly <mail@example.test>',
    }),
  );
  await expect(
    mailer.send(
      'recipient@example.test',
      'https://app.example.test/verify-email#token=synthetic',
    ),
  ).rejects.toThrow('Registration delivery unavailable');
  expect(fetchMock).toHaveBeenCalledWith(
    'https://api.resend.com/emails',
    expect.objectContaining({
      method: 'POST',
    }),
  );
});
