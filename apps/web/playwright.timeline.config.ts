import { defineConfig } from "@playwright/test";
import path from "node:path";
import { evidenceDirectory } from "./test/browser/evidence-output";

process.env.ORDERLY_TIMELINE_EVIDENCE_DIR ??= evidenceDirectory("timeline-connectors");
process.env.ORDERLY_TIMELINE_EVIDENCE_DIRECTORY ??= evidenceDirectory("timeline-regression");

export default defineConfig({
  testDir: "./test/browser",
  testMatch: process.env.ORDERLY_TIMELINE_REGRESSION === "1"
    ? "timeline-rendering.audit.ts" : "timeline-connectors.audit.ts",
  workers: 1,
  retries: 0,
  use: { browserName: "chromium", trace: "retain-on-failure" },
  outputDir: process.env.ORDERLY_TIMELINE_REGRESSION === "1"
    ? path.join(process.env.ORDERLY_TIMELINE_EVIDENCE_DIRECTORY, "traces")
    : path.join(process.env.ORDERLY_TIMELINE_EVIDENCE_DIR, "results"),
});
