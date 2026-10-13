import { defineConfig } from "../../apps/web/node_modules/@playwright/test";
import base from "../../apps/web/playwright.config";
const servers = Array.isArray(base.webServer)
  ? base.webServer
  : [base.webServer!];
export default defineConfig({
  ...base,
  testDir: ".",
  testMatch: "capture.spec.ts",
  testIgnore: [],
  timeout: 180_000,
  outputDir: "../../audit-artifacts/portfolio/raw",
  use: {
    ...base.use,
    actionTimeout: 15000,
    navigationTimeout: 20000,
    trace: "off",
    screenshot: "off",
    video: "off",
  },
  webServer: servers.map((server) => ({ ...server, cwd: "../.." })),
});
