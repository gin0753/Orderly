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
process.env.CUSTOMER_JWT_ACCESS_SECRET = 'customer-e2e-access-secret-at-least-32-characters';
process.env.CUSTOMER_JWT_REFRESH_SECRET = 'customer-e2e-refresh-secret-at-least-32-characters';
process.env.CUSTOMER_JWT_ISSUER = 'orderly-customer';
process.env.CUSTOMER_JWT_AUDIENCE = 'orderly-customer-api';
process.env.CUSTOMER_JWT_ACCESS_TTL = '15m';
process.env.CUSTOMER_JWT_REFRESH_TTL = '7d';
process.env.CUSTOMER_SESSION_ABSOLUTE_TTL = '30d';
process.env.WEB_ORIGIN = 'http://localhost:3000';
