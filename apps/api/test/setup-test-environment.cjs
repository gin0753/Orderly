const { assertDestructiveTestDatabaseAllowed } = require('./test-database-url.cjs');

const target = assertDestructiveTestDatabaseAllowed(process.env);

process.env.DATABASE_URL = target.databaseUrl;
process.env.DIRECT_DATABASE_URL =
  target.directDatabaseUrl ?? target.databaseUrl;
process.env.JWT_ACCESS_SECRET ??= 'orderly-e2e-access-secret';
process.env.JWT_REFRESH_SECRET ??= 'orderly-e2e-refresh-secret';
process.env.JWT_ACCESS_TTL ??= '15m';
process.env.JWT_REFRESH_TTL ??= '7d';
process.env.JWT_REFRESH_TTL_DAYS ??= '7';
