import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const workspaceRoot = path.resolve(webRoot, "../..");
const pnpmCli = process.env.npm_execpath;
const playwrightArguments = process.argv.slice(2);
const require = createRequire(import.meta.url);
const { createSafeTestDatabaseEnvironment } = require(
  "../../../../api/test/test-database-url.cjs",
);

if (!pnpmCli) {
  throw new Error("This script must be run through pnpm.");
}
const { environment, target } = createSafeTestDatabaseEnvironment(process.env);

run([
  "--filter",
  "api",
  "exec",
  "node",
  "./test/scripts/reset-test-database.mjs",
]);
run([
  "--filter",
  "api",
  "exec",
  "tsx",
  "./test/scripts/seed-browser-test-data.ts",
]);
run(["--filter", "api", "build"]);
if (process.env.ORDERLY_BROWSER_PRODUCTION === "1") {
  environment.ORDERLY_API_ORIGIN = "http://localhost:4000";
  environment.ORDERLY_BROWSER_PRODUCTION = "1";
  run(["--filter", "web", "build"]);
}

console.log("Browser test database preflight:");
console.log(`NODE_ENV=${environment.NODE_ENV}`);
console.log(`host=${target.hostCategory}`);
console.log(`database=${target.databaseName}`);
console.log(`prismaTargetsMatch=${target.targetsMatch}`);

const suites = playwrightArguments.length
  ? [playwrightArguments]
  : process.env.ORDERLY_BROWSER_PRODUCTION === "1"
    ? [["critical-workflow.spec.ts"], ["google-oauth.spec.ts"], ["customer-account.spec.ts"]]
    : [[]];
for (const suite of suites) {
  run(["--filter", "web", "test:e2e:run", ...suite]);
}

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
