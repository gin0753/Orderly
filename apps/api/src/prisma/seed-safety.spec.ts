import { assertDestructiveSeedAllowed } from '../../prisma/seed-safety';

const safe = {
  NODE_ENV: 'development',
  ALLOW_DESTRUCTIVE_SEED: 'true',
  DATABASE_URL:
    'postgresql://local:local@localhost:5432/orderly_db?schema=public',
};

describe('destructive seed safety (no database connection)', () => {
  it.each([undefined, '', 'false', 'TRUE'])('denies opt-in %s', (value) => {
    expect(() =>
      assertDestructiveSeedAllowed({ ...safe, ALLOW_DESTRUCTIVE_SEED: value }),
    ).toThrow('explicit opt-in');
  });
  it.each([
    { NODE_ENV: 'production' },
    { RAILWAY_ENVIRONMENT_ID: 'deployment' },
    { VERCEL: '1' },
    { NODE_ENV: 'staging' },
  ])('rejects deployed environments even with opt-in: %j', (environment) => {
    expect(() =>
      assertDestructiveSeedAllowed({ ...safe, ...environment }),
    ).toThrow('Destructive seed denied');
  });
  it.each(['localhost', '127.0.0.1', '[::1]'])(
    'accepts explicit disposable local/test target on %s',
    (host) => {
      for (const database of ['orderly_db', 'orderly_test']) {
        expect(() =>
          assertDestructiveSeedAllowed({
            ...safe,
            NODE_ENV: 'test',
            DATABASE_URL: `postgresql://local:local@${host}:5432/${database}?schema=public`,
          }),
        ).not.toThrow();
      }
    },
  );
  it.each([
    'postgresql://secret:secret@production.example/orderly_db',
    'postgresql://local:local@localhost/customer_db',
    'postgresql://local:local@localhost/orderly_test?host=production.example',
    'postgresql://local:local@localhost/orderly_test?schema=protected',
    'invalid',
    '',
  ])(
    'rejects protected or malformed configurations without disclosing them',
    (DATABASE_URL) => {
      expect(() =>
        assertDestructiveSeedAllowed({ ...safe, DATABASE_URL }),
      ).toThrow('Destructive seed denied');
      try {
        assertDestructiveSeedAllowed({ ...safe, DATABASE_URL });
      } catch (error) {
        expect((error as Error).message).not.toMatch(
          /secret|production\.example|postgresql:\/\//,
        );
      }
    },
  );
});
