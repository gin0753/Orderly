const fs = require('node:fs');
const path = require('node:path');

const EXPECTED_TEST_DATABASE_NAME = 'orderly_test';
const EXPECTED_SCHEMA = 'public';
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);
const ENV_PATH = path.resolve(__dirname, '../.env');
const GUIDANCE =
  'Both Prisma URLs must target local orderly_test with schema=public and NODE_ENV=test.';

function assertDestructiveTestDatabaseAllowed(environment = process.env) {
  if (hasDeploymentMarker(environment)) {
    deny('a deployed environment was detected');
  }

  if (environment.NODE_ENV !== 'test') {
    deny('NODE_ENV must be test');
  }

  const databaseUrl = parseAllowedTarget(
    'DATABASE_URL',
    environment.DATABASE_URL,
  );
  const directDatabaseUrl = environment.DIRECT_DATABASE_URL
    ? parseAllowedTarget(
        'DIRECT_DATABASE_URL',
        environment.DIRECT_DATABASE_URL,
      )
    : null;

  if (
    directDatabaseUrl &&
    normalizedTarget(databaseUrl) !== normalizedTarget(directDatabaseUrl)
  ) {
    deny('DATABASE_URL and DIRECT_DATABASE_URL do not resolve to the same target');
  }

  return {
    databaseName: EXPECTED_TEST_DATABASE_NAME,
    databaseUrl: databaseUrl.toString(),
    directDatabaseUrl: directDatabaseUrl?.toString() ?? null,
    hostCategory: 'loopback',
    targetsMatch: true,
  };
}

function createSafeTestDatabaseEnvironment(environment = process.env) {
  const testDatabaseUrl =
    environment.TEST_DATABASE_URL?.trim() ??
    readEnvValue('TEST_DATABASE_URL');

  if (!testDatabaseUrl) {
    deny('TEST_DATABASE_URL is missing');
  }

  const safeEnvironment = {
    ...environment,
    NODE_ENV: 'test',
    TEST_DATABASE_URL: testDatabaseUrl,
    DATABASE_URL: testDatabaseUrl,
    DIRECT_DATABASE_URL: testDatabaseUrl,
  };
  const target = assertDestructiveTestDatabaseAllowed(safeEnvironment);

  return { environment: safeEnvironment, target };
}

function parseAllowedTarget(variableName, rawValue) {
  if (typeof rawValue !== 'string' || rawValue.length === 0) {
    deny(`${variableName} is missing or malformed`);
  }

  if (rawValue !== rawValue.trim()) {
    deny(`${variableName} is missing or malformed`);
  }

  let url;

  try {
    url = new URL(rawValue);
  } catch {
    deny(`${variableName} is missing or malformed`);
  }

  let databaseName;

  try {
    databaseName = decodeURIComponent(url.pathname.replace(/^\//, ''));
  } catch {
    deny(`${variableName} is missing or malformed`);
  }

  const queryEntries = [...url.searchParams.entries()];
  const hasOnlyPublicSchema =
    queryEntries.length === 1 &&
    queryEntries[0][0] === 'schema' &&
    queryEntries[0][1] === EXPECTED_SCHEMA;

  if (
    !['postgresql:', 'postgres:'].includes(url.protocol) ||
    !LOOPBACK_HOSTS.has(url.hostname) ||
    databaseName !== EXPECTED_TEST_DATABASE_NAME ||
    !hasOnlyPublicSchema ||
    url.hash
  ) {
    deny(`${variableName} is outside the destructive test allowlist`);
  }

  return url;
}

function normalizedTarget(url) {
  return [
    'loopback',
    url.port || '5432',
    EXPECTED_TEST_DATABASE_NAME,
    EXPECTED_SCHEMA,
  ].join(':');
}

function hasDeploymentMarker(environment) {
  return Object.entries(environment).some(
    ([name, value]) =>
      /^(RAILWAY|VERCEL)(_|$)/.test(name) &&
      typeof value === 'string' &&
      value.trim().length > 0,
  );
}

function deny(reason) {
  throw new Error(`Destructive test reset denied: ${reason}. ${GUIDANCE}`);
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

module.exports = {
  assertDestructiveTestDatabaseAllowed,
  createSafeTestDatabaseEnvironment,
};
