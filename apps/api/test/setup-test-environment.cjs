const { getSafeTestDatabaseUrl } = require('./test-database-url.cjs');

const { url } = getSafeTestDatabaseUrl(process.env);

process.env.DATABASE_URL = url;
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET ??= 'orderly-e2e-access-secret';
process.env.JWT_REFRESH_SECRET ??= 'orderly-e2e-refresh-secret';
process.env.JWT_ACCESS_TTL ??= '15m';
process.env.JWT_REFRESH_TTL ??= '7d';
process.env.JWT_REFRESH_TTL_DAYS ??= '7';
