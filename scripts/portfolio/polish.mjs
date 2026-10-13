import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const encoder = process.env.PORTFOLIO_FFMPEG ?? "ffmpeg";
const assets = path.join(root, "docs/portfolio/assets");
const work = path.join(root, "audit-artifacts/video-polish");
const input = path.join(assets, "admin-walkthrough.mp4");
const output = path.join(assets, "admin-walkthrough-polished.mp4");
const backup = path.join(work, "admin-walkthrough.original.mp4");
const font =
  process.env.PORTFOLIO_CAPTION_FONT ??
  (process.platform === "win32"
    ? "C:/Windows/Fonts/arial.ttf"
    : "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf");
const hash = (file) =>
  createHash("sha256").update(readFileSync(file)).digest("hex");
function probe(file) {
  const result = spawnSync(encoder, ["-hide_banner", "-i", file], {
    encoding: "utf8",
  });
  const duration = result.stderr?.match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
  if (!duration)
    throw new Error(
      "Cannot inspect media. Set PORTFOLIO_FFMPEG to a full FFmpeg installation.",
    );
  return {
    seconds: +duration[1] * 3600 + +duration[2] * 60 + +duration[3],
    description: result.stderr,
  };
}
const before = probe(input);
if (!existsSync(font))
  throw new Error("Set PORTFOLIO_CAPTION_FONT to an installed TrueType font.");
const timing = JSON.parse(
  readFileSync(path.join(assets, "mp4-chapters.json"), "utf8"),
);
const raw = JSON.parse(
  readFileSync(path.join(assets, "walkthrough-chapters.json"), "utf8"),
);
const labels = [
  "Order queue and status counts",
  "Filter orders by status",
  "Search orders and inspect details",
  "Order status: accepted",
  "Order status: preparing",
  "Order status: ready",
  "Order status: completed",
  "Browse and filter the product catalog",
  "Create a product",
  "Edit and save product details",
  "API-only: change product availability",
  "API-only: archive the product",
  "Manage menu categories",
  "Deactivate and reactivate a category",
  "Reorder categories and save",
  "Category order saved",
];
if (
  timing.chapters.length !== labels.length ||
  raw.chapters.length !== labels.length
)
  throw new Error(
    "Chapter structure changed; review the caption labels before encoding.",
  );
if (Math.abs(before.seconds - timing.durationSeconds) > 0.1)
  throw new Error(
    "Input duration does not match the reviewed MP4 chapter metadata.",
  );
for (let i = 0; i < labels.length; i++) {
  const expected =
    Math.max(0, raw.chapters[i].seconds - timing.trimStart) * timing.timeScale;
  if (Math.abs(expected - timing.chapters[i].seconds) > 0.015)
    throw new Error(
      `Chapter ${i} no longer matches the original time mapping.`,
    );
}
mkdirSync(work, { recursive: true });
if (!existsSync(backup)) copyFileSync(input, backup);
if (hash(input) !== hash(backup))
  throw new Error(
    "Existing original backup differs; resolve it without overwriting the backup.",
  );
copyFileSync(font, path.join(work, "caption-font.ttf")); // local rendering only; font is not published
function textFile(name, text) {
  writeFileSync(path.join(work, name), text, "utf8");
  return name;
}
function draw(name, size, y, extras = "") {
  return `drawtext=fontfile=caption-font.ttf:textfile=${name}:fontsize=${size}:fontcolor=white:x=(w-text_w)/2:y=${y}${extras}`;
}
const introSeconds = 2.4;
const closingSeconds = 3;
// The recorded overlays were added after screenshot/drag waits. Frame review shows
// the catalog and drag panel earlier; only these two editorial labels move forward.
const timingAdjustments = [
  {
    chapter: 7,
    from: timing.chapters[7].seconds,
    to: 26.8,
    reason: "Product list is visible before its recorded overlay is added.",
  },
  {
    chapter: 14,
    from: timing.chapters[14].seconds,
    to: 64.15,
    reason:
      "Reorder panel and drag begin before the recorded post-drag caption.",
  },
];
const starts = timing.chapters.map((chapter) => chapter.seconds);
starts[0] = 0;
for (const adjustment of timingAdjustments)
  starts[adjustment.chapter] = adjustment.to;
const captions = labels.map((text, i) => ({
  sourceStart: starts[i],
  sourceEnd: i + 1 < labels.length ? starts[i + 1] : before.seconds,
  text,
}));
const footer = captions.map((caption, i) =>
  draw(
    textFile(`caption-${i}.txt`, caption.text),
    44,
    870,
    `:box=1:boxcolor=black@0.55:boxborderw=16:enable='gte(t,${caption.sourceStart})*lt(t,${caption.sourceEnd})'`,
  ),
);
const filters = [
  `[0:v]setpts=PTS-STARTPTS,scale=1344:840:flags=lanczos,pad=1920:1080:288:0:color=0x14201b,setsar=1,drawbox=x=0:y=840:w=1920:h=2:color=white@0.12:t=fill,${footer.join(",")}[demo]`,
  `[1:v]setsar=1,${draw(textFile("intro-title.txt", "Orderly"), 96, 340)},drawbox=x=880:y=470:w=160:h=4:color=0xff5a1f:t=fill,${draw(textFile("intro-subtitle.txt", "Admin Walkthrough"), 44, 530)},${draw(textFile("intro-context.txt", "Local synthetic data"), 30, 610)}[intro]`,
  `[2:v]setsar=1,${draw(textFile("closing-title.txt", "Explore Orderly"), 72, 245)},${draw(textFile("closing-demo-label.txt", "Customer Live Demo"), 32, 420)},${draw(textFile("closing-demo-url.txt", "https://orderly-web-gamma.vercel.app"), 32, 470)},${draw(textFile("closing-repo-label.txt", "GitHub Repository"), 32, 610)},${draw(textFile("closing-repo-url.txt", "https://github.com/gin0753/Orderly"), 32, 660)}[closing]`,
  "[intro][demo][closing]concat=n=3:v=1:a=0[out]",
];
writeFileSync(path.join(work, "polish-filter.txt"), filters.join(";\n"));
const result = spawnSync(
  encoder,
  [
    "-hide_banner",
    "-loglevel",
    "warning",
    "-y",
    "-i",
    input,
    "-f",
    "lavfi",
    "-i",
    `color=c=0x14201b:s=1920x1080:r=25:d=${introSeconds}`,
    "-f",
    "lavfi",
    "-i",
    `color=c=0x14201b:s=1920x1080:r=25:d=${closingSeconds}`,
    "-filter_complex_script",
    "polish-filter.txt",
    "-map",
    "[out]",
    "-an",
    "-r",
    "25",
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "18",
    "-profile:v",
    "high",
    "-level:v",
    "4.1",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    output,
  ],
  { cwd: work, stdio: "inherit" },
);
if (result.status !== 0) process.exit(result.status ?? 1);
const after = probe(output);
if (after.seconds < 75 || after.seconds > 90)
  throw new Error("Output duration is outside the requested range.");
if (hash(input) !== hash(backup))
  throw new Error("Original integrity check failed.");
writeFileSync(
  path.join(assets, "polished-chapters.json"),
  JSON.stringify(
    {
      input: "admin-walkthrough.mp4",
      inputSha256: hash(input),
      output: "admin-walkthrough-polished.mp4",
      outputSha256: hash(output),
      sourceDurationSeconds: before.seconds,
      durationSeconds: after.seconds,
      introSeconds,
      closingSeconds,
      sourcePlaybackSpeedChanged: false,
      timingAdjustments,
      originalInBrowserCaptionsRetained: true,
      resolution: "1920x1080",
      captionFontSize: 44,
      captionPlacement:
        "Dedicated bottom-center footer outside the complete recorded viewport",
      chapters: captions.map((caption) => ({
        seconds: Number((caption.sourceStart + introSeconds).toFixed(2)),
        endSeconds: Number((caption.sourceEnd + introSeconds).toFixed(2)),
        caption: caption.text,
      })),
    },
    null,
    2,
  ),
);
writeFileSync(path.join(work, "codec-inspection.txt"), after.description);
console.log(
  `Polished MP4: ${after.seconds}s; original and backup hashes match. No capture, database or application operations performed.`,
);
