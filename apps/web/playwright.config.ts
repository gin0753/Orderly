import { createRequire } from "node:module";

import { defineConfig, devices } from "@playwright/test";

// Playwright failure page snapshots can include bearer credentials, even without traces.
if (process.env.ORDERLY_RECEIPT_SECURITY_TESTS === "1") process.env.PLAYWRIGHT_NO_COPY_PROMPT = "1";

const require = createRequire(__filename);
const { assertDestructiveTestDatabaseAllowed } = require(
  "../api/test/test-database-url.cjs",
) as {
  assertDestructiveTestDatabaseAllowed: (
    environment: NodeJS.ProcessEnv,
  ) => {
    databaseUrl: string;
    directDatabaseUrl: string | null;
  };
};
const testDatabaseTarget = assertDestructiveTestDatabaseAllowed(process.env);

export default defineConfig({
  testDir: "./test/browser",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    // Receipt credentials must not enter diagnostic artifacts during security regressions.
    screenshot: process.env.ORDERLY_RECEIPT_SECURITY_TESTS === "1" ? "off" : "only-on-failure",
    trace: process.env.ORDERLY_RECEIPT_SECURITY_TESTS === "1" ? "off" : "retain-on-failure",
  },
  projects: [
    {
      name: "chromium-desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
  webServer: [
    {
      command: "pnpm --filter api run test:e2e:server",
      cwd: "../..",
      url: "http://localhost:4000/api/menu",
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        NODE_ENV: "test",
        DATABASE_URL: testDatabaseTarget.databaseUrl,
        DIRECT_DATABASE_URL:
          testDatabaseTarget.directDatabaseUrl ??
          testDatabaseTarget.databaseUrl,
        API_PORT: "4000",
        WEB_ORIGIN: "http://localhost:3000",
        JWT_ACCESS_SECRET: "browser-test-access-secret-at-least-32-characters",
        JWT_REFRESH_SECRET: "browser-test-refresh-secret-at-least-32-characters",
        CUSTOMER_JWT_ACCESS_SECRET: "browser-customer-access-secret-at-least-32-characters",
        CUSTOMER_JWT_REFRESH_SECRET: "browser-customer-refresh-secret-at-least-32-characters",
        GOOGLE_CLIENT_ID: "orderly-browser-test-client",
        GOOGLE_CLIENT_SECRET: "orderly-browser-test-client-secret",
        GOOGLE_CALLBACK_URL: "http://localhost:3000/api/customer/auth/google/callback",
        GOOGLE_OAUTH_TEST_PROVIDER: "1",
        JWT_ACCESS_TTL: "15m",
        JWT_REFRESH_TTL: "7d",
        JWT_REFRESH_TTL_DAYS: "7",
      },
    },
    {
      command: process.env.ORDERLY_BROWSER_PRODUCTION === "1" ? "pnpm --filter web start" : "pnpm --filter web dev",
      cwd: "../..",
      url: "http://localhost:3000",
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        NEXT_PUBLIC_API_BASE_URL: "http://localhost:4000/api",
        ORDERLY_API_ORIGIN: "http://localhost:4000",
      },
    },
  ],
});
