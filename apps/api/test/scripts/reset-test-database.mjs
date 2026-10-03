import { createRequire } from 'node:module';

import { run } from './process-utils.mjs';

const require = createRequire(import.meta.url);
const { assertDestructiveTestDatabaseAllowed } = require('../test-database-url.cjs');

const target = assertDestructiveTestDatabaseAllowed(process.env);
const prismaEnvironment = {
  ...process.env,
  DATABASE_URL: target.databaseUrl,
  DIRECT_DATABASE_URL: target.directDatabaseUrl ?? target.databaseUrl,
};

run('node', ['./test/scripts/prepare-test-database.mjs'], {
  cwd: new URL('../../', import.meta.url),
  env: prismaEnvironment,
});

const prismaCliPath = require.resolve('prisma/build/index.js');

run(
  process.execPath,
  [prismaCliPath, 'migrate', 'reset', '--force', '--skip-seed'],
  {
    cwd: new URL('../../', import.meta.url),
    env: prismaEnvironment,
  },
);

console.log('Test database reset and migrations applied.');
