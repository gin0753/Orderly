import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const require = createRequire(import.meta.url);
const { environment } =
  require("../../apps/api/test/test-database-url.cjs").createSafeTestDatabaseEnvironment(
    process.env,
  );
if (!process.env.npm_execpath) throw new Error("Run through pnpm.");
Object.assign(environment, {
  PORTFOLIO_PASSWORD: randomBytes(24).toString("hex"),
  ORDERLY_PROXY_IDENTITY_SECRET: randomBytes(32).toString("hex"),
  ORDERLY_BROWSER_PRODUCTION: "1",
  ORDERLY_API_ORIGIN: "http://localhost:4000",
});
function run(args) {
  const r = spawnSync(process.execPath, [process.env.npm_execpath, ...args], {
    cwd: root,
    env: environment,
    stdio: "inherit",
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
run([
  "--filter",
  "api",
  "exec",
  "node",
  "test/scripts/reset-test-database.mjs",
]);
run(["--filter", "api", "exec", "tsx", "../../scripts/portfolio/seed.ts"]);
if (!process.argv.includes("--reuse-build")) {
  run(["--filter", "api", "build"]);
  run(["--filter", "web", "build"]);
}
run([
  "--filter",
  "web",
  "exec",
  "playwright",
  "test",
  "--config",
  "../../scripts/portfolio/playwright.config.ts",
]);
