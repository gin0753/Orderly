import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync, writeFileSync } from "node:fs";
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const encoder = process.env.PORTFOLIO_FFMPEG ?? "ffmpeg";
const input = path.join(root, "docs/portfolio/assets/admin-walkthrough.webm");
const output = path.join(root, "docs/portfolio/assets/admin-walkthrough.mp4");
const probe = spawnSync(encoder, ["-i", input], { encoding: "utf8" });
const match = probe.stderr?.match(/Duration: (\d+):(\d+):(\d+\.\d+)/);
if (!match)
  throw new Error(
    "Cannot read video duration. Set PORTFOLIO_FFMPEG to a full FFmpeg binary.",
  );
const duration =
  Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
const chapters = JSON.parse(
  readFileSync(
    path.join(root, "docs/portfolio/assets/walkthrough-chapters.json"),
    "utf8",
  ),
);
const trimStart = Math.max(0, chapters.chapters[0].seconds - 0.1);
const timeScale = 75 / (duration - trimStart);
const result = spawnSync(
  encoder,
  [
    "-y",
    "-ss",
    String(trimStart),
    "-i",
    input,
    "-an",
    "-vf",
    `setpts=${timeScale}*PTS`,
    "-r",
    "25",
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "20",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    output,
  ],
  { stdio: "inherit" },
);
if (result.status !== 0) process.exit(result.status ?? 1);
writeFileSync(
  path.join(root, "docs/portfolio/assets/mp4-chapters.json"),
  JSON.stringify(
    {
      durationSeconds: 75,
      sourceDurationSeconds: duration,
      trimStart,
      timeScale,
      chapters: chapters.chapters.map((chapter) => ({
        ...chapter,
        seconds: Number(
          (Math.max(0, chapter.seconds - trimStart) * timeScale).toFixed(2),
        ),
      })),
    },
    null,
    2,
  ),
);
