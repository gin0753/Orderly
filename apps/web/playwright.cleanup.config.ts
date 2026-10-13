import { defineConfig } from "@playwright/test";
import path from "node:path";
import { evidenceDirectory } from "./test/browser/evidence-output";

process.env.ORDERLY_CLEANUP_EVIDENCE_DIR ??= evidenceDirectory("cleanup-layout");

// Opt-in render audit, separate from guarded application regression.
export default defineConfig({
  testDir: "./test/browser",
  testMatch: "pre-packaging-layout.audit.ts",
  workers: 1,
  retries: 0,
  use: { browserName: "chromium" },
  outputDir: path.join(process.env.ORDERLY_CLEANUP_EVIDENCE_DIR, "results"),
});
