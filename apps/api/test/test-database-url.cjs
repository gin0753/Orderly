const fs = require('node:fs');
const path = require('node:path');

const EXPECTED_TEST_DATABASE_NAME = 'orderly_test';
const ENV_PATH = path.resolve(__dirname, '../.env');

function getSafeTestDatabaseUrl(environment = process.env) {
  const rawTestUrl =
    environment.TEST_DATABASE_URL?.trim() ?? readEnvValue('TEST_DATABASE_URL');

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
      `TEST_DATABASE_URL must target the dedicated ${EXPECTED_TEST_DATABASE_NAME} database; received ${
        databaseName || '<missing>'
      }.`,
    );
  }

  const developmentUrl =
    environment.DATABASE_URL?.trim() ?? readEnvValue('DATABASE_URL');

  if (
    developmentUrl &&
    normalizeDatabaseUrl(developmentUrl) === normalizeDatabaseUrl(rawTestUrl)
  ) {
    throw new Error(
      'TEST_DATABASE_URL must not be the same as DATABASE_URL. Refusing destructive test database work.',
    );
  }

  return {
    databaseName,
    url: rawTestUrl,
    parsedUrl: testUrl,
  };
}

function readEnvValue(name) {
  if (!fs.existsSync(ENV_PATH)) {
    return undefined;
  }

  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const match = fs
    .readFileSync(ENV_PATH, 'utf8')
    .match(
      new RegExp(
        `^\\s*${escapedName}\\s*=\\s*["']?([^\\r\\n"']+)["']?\\s*$`,
        'm',
      ),
    );

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
