import { createRequire } from 'node:module';

import { run } from './process-utils.mjs';

const require = createRequire(import.meta.url);
const { createSafeTestDatabaseEnvironment } = require('../test-database-url.cjs');
const { environment } = createSafeTestDatabaseEnvironment(process.env);
const apiRoot = new URL('../../', import.meta.url);

run('node', ['./test/scripts/reset-test-database.mjs'], {
  cwd: apiRoot,
  env: environment,
});

const jestCliPath = require.resolve('jest/bin/jest');

run(
  process.execPath,
  [
    jestCliPath,
    '--config',
    './test/jest-e2e.json',
    '--runInBand',
  ],
  {
    cwd: apiRoot,
    env: environment,
  },
);
