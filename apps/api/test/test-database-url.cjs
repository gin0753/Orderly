const fs = require('node:fs');
const path = require('node:path');

const EXPECTED_TEST_DATABASE_NAME = 'orderly_test';

function getSafeTestDatabaseUrl(environment = process.env) {
  const rawTestUrl = environment.TEST_DATABASE_URL?.trim();

  if (!rawTestUrl) {
    throw new Error(
      'TEST_DATABASE_URL is required. Refusing to prepare or reset a database.',
    );
  }

  let testUrl;

  try {
    testUrl = new URL(rawTestUrl);
  } catch {
    throw new Error('TEST_DATABASE_URL must be a valid PostgreSQL URL.');
  }

  if (!['postgres:', 'postgresql:'].includes(testUrl.protocol)) {
    throw new Error('TEST_DATABASE_URL must use PostgreSQL.');
  }

  const databaseName = decodeURIComponent(testUrl.pathname.replace(/^\//, ''));

  if (databaseName !== EXPECTED_TEST_DATABASE_NAME) {
    throw new Error(
      `TEST_DATABASE_URL must target the dedicated ${EXPECTED_TEST_DATABASE_NAME} database; received ${databaseName || '<missing>'}.`,
    );
  }

  const developmentUrl =
    environment.DATABASE_URL?.trim() ?? readDevelopmentDatabaseUrl();

  if (
    developmentUrl &&
    normalizeDatabaseUrl(developmentUrl) === normalizeDatabaseUrl(rawTestUrl)
  ) {
    throw new Error(
      'TEST_DATABASE_URL must not be the same as DATABASE_URL. Refusing destructive test database work.',
    );
  }

  return { databaseName, url: rawTestUrl, parsedUrl: testUrl };
}

function readDevelopmentDatabaseUrl() {
  const envPath = path.resolve(__dirname, '../.env');

  if (!fs.existsSync(envPath)) {
    return undefined;
  }

  const match = fs
    .readFileSync(envPath, 'utf8')
    .match(/^\s*DATABASE_URL\s*=\s*["']?([^\r\n"']+)["']?\s*$/m);

  return match?.[1]?.trim();
}

function normalizeDatabaseUrl(value) {
  try {
    const url = new URL(value);
    url.searchParams.sort();
    return url.toString();
  } catch {
    return value;
  }
}

module.exports = { getSafeTestDatabaseUrl };
