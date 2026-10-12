import { defineConfig } from "@playwright/test";

// Opt-in render audit, separate from guarded application regression.
export default defineConfig({
  testDir: "./test/browser",
  testMatch: "pre-packaging-layout.audit.ts",
  workers: 1,
  retries: 0,
  use: { browserName: "chromium" },
  outputDir: "../../audit-artifacts/pre-packaging/results",
});
