import { randomUUID } from "node:crypto";
import path from "node:path";

// The config establishes this once and workers inherit it. Historical captures
// in docs are read-only evidence, never the default destination of a new run.
export function evidenceDirectory(kind: string): string {
  process.env.ORDERLY_EVIDENCE_RUN_ID ??= `${Date.now()}-${randomUUID()}`;
  return path.resolve(
    __dirname,
    "../../../..",
    "audit-artifacts/browser-evidence",
    process.env.ORDERLY_EVIDENCE_RUN_ID,
    kind,
  );
}
