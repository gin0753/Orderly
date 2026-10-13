# Stage 17 packaging audit and review

Prepared 13 October 2026. Accepted decision supersedes the feasibility audit's earlier recommendation: V1 has neither an editable nor read-only public Admin demo. Existing Admin functionality/authorization remains unchanged; V1.1 is a possible future enhancement.

## Audit findings

| Existing claim/material | Evidence and correction |
| --- | --- |
| “Production-grade”, complete production deployment/security | Removed categorical release-readiness framing. Current source has scoped local acceptance plus open provider/operational/cross-engine conditions. Deployed revisions and console settings were not inspected. |
| Guest tracking using email/phone | Outdated after receipt security work. README now describes order number plus receipt capability, with no contact-only claim. |
| Product archive/availability presented as Admin interface capabilities | API controllers implement both, but current product table only exposes Edit. README/video distinguish protected API operations from available UI controls. Category controls exist in UI. |
| CI/CD and migrations before API activation | CI workflow runs quality/build jobs; it contains no deployment job. Docker CMD starts Node only. Explicit migration coordination is now an operator checklist, not an assumed Railway setting. |
| Google/browser coverage implied provider acceptance | Browser provider fixtures are synthetic. Real Google freshness and Resend inbox/configuration acceptance remain open. |
| Registration overview without configurable evidence policy | Both verified and direct modes implemented. Direct/legacy emails stay unverified; no fabricated verification timestamps or reclamation claims. |
| Missing current lifecycle documentation | Added deletion, verification, receipt security and remaining limitations with links to authoritative reports. |
| Existing screenshot/report assets | Prior stage/evidence directories retained unchanged. New portfolio assets are generated from current local optimized builds, with realistic catalog and synthetic populated orders. No old evidence is silently replaced. |
| API/database documentation | Prisma schema/controllers reviewed; added concise route/auth/data map. Legacy User distinguished from current CustomerUser. No OpenAPI, payment processor, analytics or settings UI invented. |
| Feasibility decision | Original audit remains historical evidence; its read-only recommendation is superseded by the accepted Stage 17 decision, explicitly recorded here and in README. |

Root README, package scripts/dependencies, Docker/compose/Next proxy/CI configuration, catalog seeds, Prisma schema/migrations, Customer/Admin controllers/components and browser fixture runners were inspected. Latest security and dual-registration reports are linked rather than reinterpreted as unconditional release approval.

## Materials

- [Root README](../../README.md): introduction, demo/video, screenshots, feature distinctions, stack/architecture/security, data/API, testing, local setup, release conditions and roadmap.
- [Release guide](release-guide.md): public-demo checklist, environment inventory, Railway/Vercel notes, migration/seed safeguards and remaining manual staging.
- [Architecture/API overview](architecture-api.md) and [presentation summary](presentation-summary.md).
- [Capture workflow](../../scripts/portfolio/README.md), seeded fixtures, Playwright script/config, and MP4 encoder; no application feature or authorization changes.

## Live verification boundary

Read-only requests on 13 October 2026 returned HTTP 200 for the Customer root and API health (`status=ok`, `service=orderly-api`). The health timestamp was 2026-10-13T04:25:51.850Z. Browser web retrieval was unavailable, so this is endpoint reachability only; deployed registration mode, source revision and complete workflows are **not verified**. No production authentication, checkout, mutation or provider interaction was performed.

## Validation and media review

Final capture/encoding results and artifact inventory are recorded below after review. Earlier capture attempts failed on script integration/selectors; they do not indicate passing acceptance and do not justify weakening application guards. Existing broad automated-test counts in README are attributed to the prior dual-registration report; Stage 17 does not claim a new full security/provider acceptance run.

## Release conditions and scope

Resend/Google real-provider checks, backup/restore/populated migration and rollout, deployed logging/redaction, focused Firefox/Safari/assistive-technology checks and expired security-metadata cleanup ownership remain unresolved. Process-local HTTP counters and unverified direct registration remain documented limitations. Publication is separate from preparation: no commit, push, media-host upload or deployment was performed. Only the guarded local `orderly_test` database was reset/seeded; production data and Customer/Admin authorization were preserved.

### Final Stage 17 validation

| Check | Result |
| --- | --- |
| API and optimized Next.js builds | Passed. No application code changed during packaging. |
| Guarded synthetic capture | Final Chromium run: **1 complete workflow passed**, zero automatic retries (test ~1.4 minutes; runner ~1.6 minutes). All four order transitions, product create/edit, protected API availability/archive, category deactivate/reactivate and saved drag reorder executed. API confirmed Pizza's persisted position was 2. |
| Safety preflight | Intended local target accepted; production environment, remote host, ordinary local database, deployed marker and mismatched Prisma port rejected without DB operations. Existing guards unchanged. |
| PNG consistency | **10 screenshots**, each 1440x900, loaded/populated states, synthetic contacts only. Individually inspected; ordinary below-fold cropping retained. |
| MP4 | **74.96 seconds**, 1440x900 H.264/yuv420p, 25 fps, no audio, 2,197,915 bytes. Full decode completed without errors. Sampled frames and final frame visually inspected; captions readable, no login/credential/receipt screens. |
| Source media | Original WebM retained with raw and normalized caption chapters. Encoder trims initial setup and modestly retimes the real capture; it fabricates no application operations. |
| Documentation links | Seven packaging Markdown files checked; zero missing local targets. External Customer/API reachability separately checked as described above. |
| Syntax/style/diff | Recording utilities formatted; Node syntax checks and `git diff --check` passed. |
| Broad application/provider acceptance | Not rerun or newly asserted in Stage 17; prior scoped evidence remains attributed to its reports. |

Seven unsuccessful capture iterations preceded the final pass: missing Customer mutation header (two setup attempts), order-history text locator, unbounded font-readiness wait, product cell locator including metadata, required category label locator, and a keyboard reorder sequence that produced no change. They were script/workflow findings; no application guard, timeout/assertion in existing acceptance tests, or feature implementation was weakened. The final script bounds presentation-readiness waits and uses actual pointer drag handles with persisted API verification.

Presentation observation: the category list's Order column displayed blank values in the captured build, although its saved reorder was verified through the protected API and the reorder panel displayed positions. This is retained as a UI follow-up; packaging does not conceal it or alter the UI. Product lifecycle UI controls also remain absent, as explicitly documented and captioned.

[Asset manifest](asset-manifest.json) records file sizes, SHA-256 digests and dimensions. [Screenshot inventory](screenshots.md) and [review MP4](assets/admin-walkthrough.mp4) are ready for review. These are local materials; the README video link is repository-relative, with no external video upload performed.

Capture runtime: Node.js 24.16.0 on Windows with the repository's installed pnpm/Playwright toolchain. Setup documentation retains the API's supported minimum Node.js 22.12; this capture is not a separate Node 22 compatibility certification. Temporary downloaded FFmpeg remains in ignored local audit storage; no encoder binary or new dependency was added to the project.
