import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./test/browser",
  testMatch: "timeline-connectors.audit.ts",
  workers: 1,
  retries: 0,
  use: { browserName: "chromium", trace: "retain-on-failure" },
  outputDir: "../../audit-artifacts/timeline-connectors/results",
});
