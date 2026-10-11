import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./test/browser",
  testMatch: process.env.ORDERLY_TIMELINE_REGRESSION === "1"
    ? "timeline-rendering.audit.ts" : "timeline-connectors.audit.ts",
  workers: 1,
  retries: 0,
  use: { browserName: "chromium", trace: "retain-on-failure" },
  outputDir: process.env.ORDERLY_TIMELINE_REGRESSION === "1"
    ? `${process.env.ORDERLY_TIMELINE_EVIDENCE_DIRECTORY ?? "../../audit-artifacts/timeline-regression/verified-after"}/traces`
    : "../../audit-artifacts/timeline-connectors/results",
});
