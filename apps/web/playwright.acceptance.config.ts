import { defineConfig, devices } from "@playwright/test";
import base from "./playwright.config";
import path from "node:path";
import { evidenceDirectory } from "./test/browser/evidence-output";

process.env.ORDERLY_ACCEPTANCE_EVIDENCE_DIR ??= evidenceDirectory("acceptance");
process.env.ORDERLY_ACCEPTANCE_RESULTS_FILE ??= path.join(
  process.env.ORDERLY_ACCEPTANCE_EVIDENCE_DIR,
  "cross-browser-results.json",
);

export default defineConfig({
  ...base,
  testMatch: "final-acceptance.spec.ts",
  timeout: 240_000,
  expect: { timeout: 30_000 },
  reporter: [["list"], ["json", { outputFile: process.env.ORDERLY_ACCEPTANCE_RESULTS_FILE }]],
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
