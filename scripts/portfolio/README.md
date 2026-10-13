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

