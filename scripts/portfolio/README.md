# Reproducible portfolio media

Run from the repository root with Node 22.12+, pnpm 10.14.0, Docker, installed dependencies and Playwright Chromium. Close any existing servers on ports 3000/4000 and stop other database tests.

```powershell
$env:TEST_DATABASE_URL='postgresql://orderly_user:orderly_password@localhost:5432/orderly_test?schema=public'
pnpm portfolio:capture
```

**This resets the local `orderly_test` database.** The existing guard requires loopback, public schema, matching Prisma targets, test environment and no deployment markers before every reset/seed. No target override is offered. Never use this workflow against staging or production. Do not remove the guard to accommodate another environment.

`run.mjs` resets/migrates, seeds the existing realistic catalog plus 12 synthetic orders and private identities, then builds both apps and runs `capture.spec.ts`. The configuration starts fresh local servers; no reused remote server is allowed. Credentials are random per run; authentication happens before the recorded browser context, cookies remain in memory, and traces/failure screenshots are disabled. No checkout success/receipt codes or provider interactions are recorded. The seeded customer has `emailVerifiedAt=null`.

Assets land in `docs/portfolio/assets`: ten 1440x900 PNG screenshots, Admin WebM and caption chapter metadata. The Admin workflow uses actual UI order/product/category mutations, plus actual protected product availability/archive API requests (clearly captioned as API-only). Captions are an editorial overlay added by the recording script, not application UI. No analytics/settings screens are fabricated. No narration/music/audio track is added.

Encode the review MP4 with a full FFmpeg installation (Playwright's bundled encoder cannot output MP4):

```powershell
$env:PORTFOLIO_FFMPEG='C:\path\to\ffmpeg.exe'
pnpm exec node scripts/portfolio/encode.mjs
```

The encoder makes a 75-second H.264/yuv420p MP4 with fast-start metadata, adjusting the real recording speed to fit the 60–90-second target. Keep the script/chapter metadata, inspect the resulting video and screenshots, and run `git diff --check` before review. The encode script fails if its input or encoder is missing. Raw capture/error artifacts stay under ignored `audit-artifacts/portfolio`; do not publish them without review.

No commit, push, hosting upload or deployment is part of this workflow. The relative MP4 README link becomes usable when these materials are published through a separately approved repository/hosting step.

## Polish the existing MP4 without recapturing

Use the existing MP4 and both chapter JSON files. This step is file-only: it starts no application servers, makes no database calls and installs no dependencies.

```powershell
$env:PORTFOLIO_FFMPEG='C:\path\to\ffmpeg.exe'
node scripts/portfolio/polish.mjs
```

Use a full FFmpeg build with `drawtext` and `libx264`. An installed Arial font is used on Windows; DejaVu Sans is the Linux default. Set `PORTFOLIO_CAPTION_FONT` to an installed TrueType font if needed. The script copies the font into ignored render storage only; it does not distribute the font.

Output: `docs/portfolio/assets/admin-walkthrough-polished.mp4`, plus `polished-chapters.json` containing caption intervals, timing adjustments and source/output hashes. The export adds a 2.4-second Orderly intro and three-second closing card, and frames the complete recorded viewport in a 1920x1080 canvas. New white 44px captions are burned into a dedicated bottom-center footer with a semi-transparent dark box, leaving application controls unobstructed by the new captions. The complete recording is scaled to 1344x840; the 240px footer places caption text above the native browser playback toolbar at a tested 720px player width. Original in-browser captions remain visible in the source footage; they are not removed or reconstructed.

The script reuses normalized chapter timing and advances two labels based on frame review: the product-list label starts at source 26.80 seconds and reordering at 64.15 seconds. Both original chapter files stay unchanged. Source playback speed and operation order stay unchanged; no narration/music/audio is added.

The original `admin-walkthrough.mp4` remains untouched. Before rendering, a byte-identical backup is created at `audit-artifacts/video-polish/admin-walkthrough.original.mp4`. If an existing backup differs, the script stops instead of overwriting it. The script may regenerate only the separate polished output; retain the original and backup until manual approval.

[Polish validation and before/after comparison](../../docs/portfolio/review-report.md). Review the separate polished MP4 manually before promoting it to the README's existing video link. The script does not change that link or commit, publish, deploy or upload media.
