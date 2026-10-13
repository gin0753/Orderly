import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
const files = [
  "README.md",
  "docs/portfolio/release-guide.md",
  "docs/portfolio/architecture-api.md",
  "docs/portfolio/presentation-summary.md",
  "docs/portfolio/screenshots.md",
  "docs/portfolio/review-report.md",
  "scripts/portfolio/README.md",
];
const missing = [];
for (const file of files)
  for (const match of readFileSync(file, "utf8").matchAll(
    /!?\[[^\]]*\]\(([^)]+)\)/g,
  )) {
    const target = match[1];
    if (/^https?:/.test(target) || target.startsWith("#")) continue;
    const resolved = path.resolve(path.dirname(file), target.split("#")[0]);
    if (!existsSync(resolved)) missing.push({ file, target });
  }
console.log(JSON.stringify({ checkedFiles: files.length, missing }, null, 2));
process.exitCode = missing.length ? 1 : 0;
