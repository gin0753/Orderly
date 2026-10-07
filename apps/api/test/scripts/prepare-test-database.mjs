import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { PrismaClient } from '@prisma/client';

import { run } from './process-utils.mjs';

const require = createRequire(import.meta.url);
const { assertDestructiveTestDatabaseAllowed } = require('../test-database-url.cjs');

const target = assertDestructiveTestDatabaseAllowed(process.env);
const databaseUrl = new URL(target.databaseUrl);
const databaseName = target.databaseName;

if (process.env.GITHUB_ACTIONS === 'true') {
  // The workflow's ephemeral PostgreSQL service creates orderly_test for us.
  // Still verify that the guarded URL connects to that database before reset.
  const prisma = new PrismaClient();
  try {
    const [row] = await prisma.$queryRaw`SELECT current_database() AS name`;
    if (row?.name !== databaseName) {
      throw new Error('The CI PostgreSQL service is not the test database.');
    }
  } finally {
    await prisma.$disconnect();
  }
  console.log(`Test database ${databaseName} is available.`);
  process.exit(0);
}

run('docker', ['compose', 'up', '-d', 'db']);

const postgresUser = decodeURIComponent(databaseUrl.username);

const maxAttempts = 30;

// The official Postgres image uses a temporary socket-only server during
// first-time initialization. Probe TCP so we wait for the final server.
for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
  const readiness = spawnSync(
    'docker',
    [
      'compose',
      'exec',
      '-T',
      'db',
      'pg_isready',
      '-h',
      '127.0.0.1',
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
    '-h',
    '127.0.0.1',
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
    '-h',
    '127.0.0.1',
    '-U',
    postgresUser,
    databaseName,
  ]);
}

console.log(`Test database ${databaseName} is available.`);
