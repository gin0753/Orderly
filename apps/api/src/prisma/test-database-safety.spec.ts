import fs from 'node:fs';
import path from 'node:path';

const { assertDestructiveTestDatabaseAllowed } =
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('../../test/test-database-url.cjs') as {
    assertDestructiveTestDatabaseAllowed: (
      environment: Record<string, string | undefined>,
    ) => unknown;
  };

const safeUrl =
  'postgresql://test-user:test-password@localhost:5432/orderly_test?schema=public';
const safeEnvironment = {
  NODE_ENV: 'test',
  DATABASE_URL: safeUrl,
  DIRECT_DATABASE_URL: safeUrl,
};

describe('destructive test database safety (no database connection)', () => {
  it('accepts the dedicated local test database', () => {
    expect(() =>
      assertDestructiveTestDatabaseAllowed(safeEnvironment),
    ).not.toThrow();
  });

  it.each(['localhost', '127.0.0.1', '[::1]'])(
    'accepts the loopback host form %s',
    (host) => {
      const url = `postgresql://test-user:test-password@${host}:5432/orderly_test?schema=public`;

      expect(() =>
        assertDestructiveTestDatabaseAllowed({
          NODE_ENV: 'test',
          DATABASE_URL: url,
          DIRECT_DATABASE_URL: url,
        }),
      ).not.toThrow();
    },
  );

  it('accepts an absent direct URL because the reset pins it to DATABASE_URL', () => {
    expect(() =>
      assertDestructiveTestDatabaseAllowed({
        NODE_ENV: 'test',
        DATABASE_URL: safeUrl,
      }),
    ).not.toThrow();
  });

  it.each(['orderly_db', 'customer_test', 'orderly_test_backup'])(
    'rejects the local database %s',
    (databaseName) => {
      expect(() =>
        assertDestructiveTestDatabaseAllowed({
          ...safeEnvironment,
          DATABASE_URL: `postgresql://test-user:test-password@localhost:5432/${databaseName}?schema=public`,
        }),
      ).toThrow('Destructive test reset denied');
    },
  );

  it('rejects remote database hosts', () => {
    expect(() =>
      assertDestructiveTestDatabaseAllowed({
        ...safeEnvironment,
        DATABASE_URL:
          'postgresql://test-user:test-password@database.example/orderly_test?schema=public',
      }),
    ).toThrow('Destructive test reset denied');
  });

  it.each([
    { NODE_ENV: 'production' },
    { NODE_ENV: 'staging' },
    { RAILWAY_ENVIRONMENT_ID: 'deployment' },
    { VERCEL: '1' },
  ])('rejects production or deployed environments: %j', (override) => {
    expect(() =>
      assertDestructiveTestDatabaseAllowed({
        ...safeEnvironment,
        ...override,
      }),
    ).toThrow('Destructive test reset denied');
  });

  it.each([
    {},
    { DATABASE_URL: '' },
    { DATABASE_URL: 'not-a-url' },
    { DATABASE_URL: 'https://localhost/orderly_test?schema=public' },
  ])('rejects missing or malformed URLs: %j', (override) => {
    expect(() =>
      assertDestructiveTestDatabaseAllowed({
        NODE_ENV: 'test',
        ...override,
      }),
    ).toThrow('Destructive test reset denied');
  });

  it('rejects Prisma URLs that resolve to different targets', () => {
    expect(() =>
      assertDestructiveTestDatabaseAllowed({
        ...safeEnvironment,
        DIRECT_DATABASE_URL:
          'postgresql://test-user:test-password@localhost:5433/orderly_test?schema=public',
      }),
    ).toThrow('do not resolve to the same target');
  });

  it('rejects a direct URL that points to orderly_db', () => {
    expect(() =>
      assertDestructiveTestDatabaseAllowed({
        ...safeEnvironment,
        DIRECT_DATABASE_URL:
          'postgresql://test-user:test-password@localhost:5432/orderly_db?schema=public',
      }),
    ).toThrow('Destructive test reset denied');
  });

  it.each([
    'postgresql://test-user:test-password@localhost:5432/orderly_test',
    'postgresql://test-user:test-password@localhost:5432/orderly_test?schema=private',
    'postgresql://test-user:test-password@localhost:5432/orderly_test?schema=public&sslmode=require',
    'postgresql://test-user:test-password@localhost:5432/orderly_test?schema=public#fragment',
  ])('rejects an unexpected schema, query, or fragment', (DATABASE_URL) => {
    expect(() =>
      assertDestructiveTestDatabaseAllowed({
        ...safeEnvironment,
        DATABASE_URL,
      }),
    ).toThrow('Destructive test reset denied');
  });

  it('does not disclose credentials, hosts, or complete URLs', () => {
    const unsafeUrl =
      'postgresql://private-user:private-password@private.example/orderly_db?schema=public';

    let message = '';

    try {
      assertDestructiveTestDatabaseAllowed({
        ...safeEnvironment,
        DATABASE_URL: unsafeUrl,
      });
    } catch (error) {
      message = (error as Error).message;
    }

    expect(message).toContain('Destructive test reset denied');
    expect(message).not.toContain('private-user');
    expect(message).not.toContain('private-password');
    expect(message).not.toContain('private.example');
    expect(message).not.toContain('postgresql://');
    expect(message).not.toContain(unsafeUrl);
  });

  it.each([
    ['reset-test-database.mjs', "run('node'"],
    ['prepare-test-database.mjs', "run('docker'"],
    ['seed-browser-test-data.ts', 'new PrismaClient'],
  ])(
    'guards %s before its first destructive operation',
    (fileName, operation) => {
      const source = fs.readFileSync(
        path.resolve(__dirname, `../../test/scripts/${fileName}`),
        'utf8',
      );
      const guardIndex = source.indexOf(
        'assertDestructiveTestDatabaseAllowed(process.env)',
      );
      const operationIndex = source.indexOf(operation);

      expect(guardIndex).toBeGreaterThanOrEqual(0);
      expect(operationIndex).toBeGreaterThan(guardIndex);
    },
  );
});
