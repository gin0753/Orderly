import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const workspaceRoot = path.resolve(webRoot, "../..");
const pnpmCli = process.env.npm_execpath;

if (!pnpmCli) {
  throw new Error("This script must be run through pnpm.");
}
const testDatabaseUrl =
  process.env.TEST_DATABASE_URL ??
  "postgresql://orderly_user:orderly_password@localhost:5432/orderly_test?schema=public";
const environment = {
  ...process.env,
  TEST_DATABASE_URL: testDatabaseUrl,
};
delete environment.DATABASE_URL;

run(["--filter", "api", "test:db:reset"]);
run([
  "--filter",
  "api",
  "exec",
  "tsx",
  "./test/scripts/seed-browser-test-data.ts",
]);
run(["--filter", "web", "test:e2e:run"]);

function run(args) {
  const result = spawnSync(process.execPath, [pnpmCli, ...args], {
    cwd: workspaceRoot,
    env: environment,
    stdio: "inherit",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
