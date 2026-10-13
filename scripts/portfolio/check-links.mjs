import { readFileSync, existsSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const gitPaths = (args) => execFileSync("git", args, {
  cwd: root, encoding: "utf8", maxBuffer: 16 * 1024 * 1024,
}).split("\0").filter(Boolean);
const publicPaths = new Set([
  ...gitPaths(["ls-files", "-z"]),
  ...gitPaths(["ls-files", "--others", "--exclude-standard", "-z"]),
].filter((file) => existsSync(path.join(root, file))));
const files = [...publicPaths].filter((file) => file.endsWith(".md"));
const missing = [], fragments = [], privateTargets = [];
const anchorCache = new Map();

function anchors(file) {
  if (anchorCache.has(file)) return anchorCache.get(file);
  const text = readFileSync(file, "utf8"), result = new Set(), counts = new Map();
  for (const match of text.matchAll(/\b(?:id|name)=["']([^"']+)["']/g)) result.add(match[1]);
  let fenced = false;
  for (const line of text.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) { fenced = !fenced; continue; }
    if (fenced) continue;
    const heading = line.match(/^#{1,6}\s+(.+?)(?:\s+#+)?\s*$/);
    if (!heading) continue;
    const slug = heading[1].replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/<[^>]*>/g, "").toLowerCase()
      .replace(/[^\p{L}\p{N}\p{M}_\-\s]/gu, "").replace(/\s/g, "-");
    const ordinal = counts.get(slug) ?? 0;
    counts.set(slug, ordinal + 1);
    result.add(ordinal ? `${slug}-${ordinal}` : slug);
  }
  anchorCache.set(file, result);
  return result;
}

for (const file of files) {
  const source = readFileSync(path.join(root, file), "utf8");
  const navigation = source.replace(/^\s*(```|~~~)[^\n]*\n[\s\S]*?^\s*\1[^\n]*$/gm, "")
    .replace(/`[^`\n]+`/g, "");
  const expressions = /!?\[[^\]]*\]\(([^)]+)\)|^\[[^\]]+\]:\s*(\S+)|(?:href|src)=["']([^"']+)["']/gm;
  for (const match of navigation.matchAll(expressions)) {
    const target = (match[1] ?? match[2] ?? match[3]).trim().replace(/^<([^>]+)>.*$/, "$1").replace(/\s+["'][\s\S]*$/, "");
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(target)) continue;
    const hash = target.indexOf("#");
    const filename = decodeURIComponent(hash < 0 ? target : target.slice(0, hash));
    const fragment = hash < 0 ? "" : decodeURIComponent(target.slice(hash + 1));
    const absolute = filename ? path.resolve(path.dirname(path.join(root, file)), filename) : path.join(root, file);
    const relative = path.relative(root, absolute).replaceAll("\\", "/");
    const record = { file, target };
    if (!existsSync(absolute)) { missing.push(record); continue; }
    const directory = statSync(absolute).isDirectory();
    const publicTarget = directory
      ? [...publicPaths].some((entry) => entry.startsWith(relative.replace(/\/$/, "") + "/"))
      : publicPaths.has(relative);
    if (!publicTarget) privateTargets.push(record);
    if (fragment && !directory && absolute.endsWith(".md") && !anchors(absolute).has(fragment)) fragments.push(record);
  }
}
console.log(JSON.stringify({ checkedFiles: files.length, missing, fragments, privateTargets }, null, 2));
process.exitCode = missing.length || fragments.length || privateTargets.length ? 1 : 0;
