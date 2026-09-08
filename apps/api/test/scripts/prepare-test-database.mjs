import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

import { run } from './process-utils.mjs';

const require = createRequire(import.meta.url);
const { getSafeTestDatabaseUrl } = require('../test-database-url.cjs');

const { databaseName, parsedUrl } = getSafeTestDatabaseUrl();

if (!['localhost', '127.0.0.1', '::1'].includes(parsedUrl.hostname)) {
  throw new Error(
    'Automatic test database creation is restricted to the local Docker PostgreSQL service.',
  );
}

run('docker', ['compose', 'up', '-d', 'db']);

const postgresUser = decodeURIComponent(parsedUrl.username);

const maxAttempts = 30;

for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
  const readiness = spawnSync(
    'docker',
    [
      'compose',
      'exec',
      '-T',
      'db',
      'pg_isready',
      '-U',
      postgresUser,
      '-d',
      'postgres',
    ],
    {
      cwd: new URL('../../../../', import.meta.url),
      encoding: 'utf8',
    },
  );

  if (!readiness.error && readiness.status === 0) {
    break;
  }

  if (attempt === maxAttempts) {
    throw new Error(
      'PostgreSQL did not become ready within the expected time.',
    );
  }

  await new Promise((resolve) => setTimeout(resolve, 1000));
}

const lookup = spawnSync(
  'docker',
  [
    'compose',
    'exec',
    '-T',
    'db',
    'psql',
    '-U',
    postgresUser,
    '-d',
    'postgres',
    '-tAc',
    `SELECT 1 FROM pg_database WHERE datname = '${databaseName}'`,
  ],
  {
    cwd: new URL('../../../../', import.meta.url),
    encoding: 'utf8',
  },
);

if (lookup.error) {
  throw lookup.error;
}

if (lookup.status !== 0) {
  process.stderr.write(
    lookup.stderr ?? 'Unable to inspect the test database.\n',
  );
  throw new Error('Could not connect to the local PostgreSQL container.');
}

if (lookup.stdout.trim() !== '1') {
  run('docker', [
    'compose',
    'exec',
    '-T',
    'db',
    'createdb',
    '-U',
    postgresUser,
    databaseName,
  ]);
}

console.log(`Test database ${databaseName} is available.`);
