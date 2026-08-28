import { createRequire } from 'node:module';

import { run } from './process-utils.mjs';

const require = createRequire(import.meta.url);
const { getSafeTestDatabaseUrl } = require('../test-database-url.cjs');

const { url } = getSafeTestDatabaseUrl();

run('node', ['./test/scripts/prepare-test-database.mjs'], {
  cwd: new URL('../../', import.meta.url),
});

const prismaCliPath = require.resolve('prisma/build/index.js');

run(
  process.execPath,
  [prismaCliPath, 'migrate', 'reset', '--force', '--skip-seed'],
  {
    cwd: new URL('../../', import.meta.url),
    env: {
      ...process.env,
      DATABASE_URL: url,
    },
  },
);

console.log('Test database reset and migrations applied.');
