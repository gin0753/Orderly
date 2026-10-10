import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../..");
const evidence = path.join(root, "docs/stage-15.7-evidence");
const scans = [];
const pictures = [];
const statePictures = (await readdir(path.join(evidence, "states")).catch(() => []))
  .filter((file) => file.endsWith(".png")).map((file) => `states/${file}`);
for (const engine of ["chromium", "firefox", "webkit"]) {
  for (const file of await readdir(path.join(evidence, engine)).catch(() => [])) {
    if (file.endsWith(".json")) scans.push({ file: `${engine}/${file}`, ...JSON.parse(await readFile(path.join(evidence, engine, file), "utf8")) });
    if (file.endsWith(".png")) pictures.push(`${engine}/${file}`);
  }
}
const chunks = [];
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(target);
    else if (entry.name.endsWith(".js")) {
      const source = await readFile(target);
      chunks.push({ file: path.relative(root, target), bytes: (await stat(target)).size, gzipBytes: gzipSync(source).length });
    }
  }
}
await walk(path.join(root, "apps/web/.next/static/chunks"));
const summary = {
  generatedAt: new Date().toISOString(), scanCount: scans.length, screenshotCount: pictures.length, stateScreenshotCount: statePictures.length,
  byBrowser: Object.fromEntries(["chromium", "firefox", "webkit"].map((engine) => [engine, {
    scans: scans.filter((scan) => scan.browser === engine).length,
    screenshots: pictures.filter((file) => file.startsWith(`${engine}/`)).length,
    violations: scans.filter((scan) => scan.browser === engine).reduce((total, scan) => total + scan.violations.length, 0),
    incompleteScans: scans.filter((scan) => scan.browser === engine && scan.incomplete.length).length,
  }])),
  violations: scans.flatMap((scan) => scan.violations.map((violation) => ({ file: scan.file, id: violation.id, impact: violation.impact, nodes: violation.nodes.map((node) => ({ target: node.target, failureSummary: node.failureSummary })) }))),
  incompleteByScan: scans.filter((scan) => scan.incomplete.length).map((scan) => ({ file: scan.file, rules: scan.incomplete.map((rule) => rule.id) })),
  overflows: scans.filter((scan) => scan.overflow > 1).map((scan) => ({ file: scan.file, overflow: scan.overflow })),
  buildChunks: { count: chunks.length, totalBytes: chunks.reduce((total, chunk) => total + chunk.bytes, 0), totalGzipBytes: chunks.reduce((total, chunk) => total + chunk.gzipBytes, 0), chunks: chunks.sort((a, b) => b.bytes - a.bytes) },
};
const performance = JSON.parse(await readFile(path.join(evidence, "performance.json"), "utf8").catch(() => "null"));
if (performance) summary.performance = {
  dialogActionToVisibleMs: performance.dialogActionToVisibleMs,
  samples: performance.samples.map((sample) => {
    const scripts = sample.resources.filter((resource) => resource.initiatorType === "script");
    return { route: sample.route, lcpMs: sample.metrics.lcp, cls: sample.metrics.cls,
      longTaskCount: sample.metrics.longTasks.length, longestTaskMs: Math.max(0, ...sample.metrics.longTasks),
      scriptCount: scripts.length, scriptEncodedBytes: scripts.reduce((total, resource) => total + resource.encodedBodySize, 0),
      scriptTransferBytes: scripts.reduce((total, resource) => total + resource.transferSize, 0),
      scriptDecodedBytes: scripts.reduce((total, resource) => total + resource.decodedBodySize, 0),
      images: sample.images,
    };
  }),
};
await writeFile(path.join(evidence, "summary.json"), JSON.stringify(summary, null, 2));
await writeFile(path.join(evidence, "screenshots.html"), `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Stage 15.7 screenshot evidence</title><style>body{font:16px system-ui;background:#faf8f5;color:#1c1917;margin:24px}section{margin:40px 0}img{max-width:100%;height:auto;border:1px solid #8a8178}a{color:#9a3412}</style><h1>Stage 15.7 rendered evidence</h1><p>Local production build; fixture data. These captures supplement assertions and manual inspection, and are not pixel-baseline tests.</p>${[...pictures, ...statePictures].map((file) => `<section><h2>${file}</h2><a href="${file}"><img loading="lazy" src="${file}" alt="${file.replaceAll("/", " ").replaceAll("-", " ")}"></a></section>`).join("\n")}</html>`);
console.log(JSON.stringify({ scanCount: summary.scanCount, screenshotCount: summary.screenshotCount, violationCount: summary.violations.length, overflows: summary.overflows, buildChunks: { count: chunks.length, totalBytes: summary.buildChunks.totalBytes, totalGzipBytes: summary.buildChunks.totalGzipBytes } }, null, 2));
