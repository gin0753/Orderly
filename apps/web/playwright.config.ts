import { defineConfig, devices } from "@playwright/test";

const testDatabaseUrl =
  process.env.TEST_DATABASE_URL ??
  "postgresql://orderly_user:orderly_password@localhost:5432/orderly_test?schema=public";

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
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
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
      command: "pnpm --filter api exec nest start",
      cwd: "../..",
      url: "http://localhost:4000/api/menu",
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        DATABASE_URL: testDatabaseUrl,
        API_PORT: "4000",
        WEB_ORIGIN: "http://localhost:3000",
        JWT_ACCESS_SECRET: "browser-test-access-secret-at-least-32-characters",
        JWT_REFRESH_SECRET: "browser-test-refresh-secret-at-least-32-characters",
        JWT_ACCESS_TTL: "15m",
        JWT_REFRESH_TTL: "7d",
        JWT_REFRESH_TTL_DAYS: "7",
      },
    },
    {
      command: "pnpm --filter web dev",
      cwd: "../..",
      url: "http://localhost:3000",
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        NEXT_PUBLIC_API_BASE_URL: "http://localhost:4000/api",
      },
    },
  ],
});
