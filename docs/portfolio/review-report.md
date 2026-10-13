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
- [Release guide](../operations/release-guide.md): public-demo checklist, environment inventory, Railway/Vercel notes, migration/seed safeguards and remaining manual staging.
- [Architecture/API overview](../architecture/architecture-api.md) and [presentation summary](../README.md).
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


## Polished export review — 13 October 2026

Prepared 13 October 2026. [Polished MP4](assets/admin-walkthrough-polished.mp4) · [Original MP4](assets/admin-walkthrough.mp4) · [FFmpeg editing script](../../scripts/portfolio/polish.mjs) · [Caption timeline/hashes](assets/polished-chapters.json)

## Inspection and before/after

The original in-browser captions are actually visible. Their 17px text is small in embedded playback, disappears briefly during navigation, and the category caption describes available controls rather than operations demonstrated. Two chapter labels lag their visible scenes: product-list navigation and category dragging. The existing `timeScale=1.1137` stretches duration (about 10% slower playback); it does not accelerate the recording. No further playback retiming was applied.

| Before                                    | Review export                                                                                                               |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 74.96 seconds, 1440x900                   | **80.36 seconds, 1920x1080**, 25 fps                                                                                        |
| Small recorded overlays only              | 16 short English FFmpeg-burned captions, **44px white text**, semi-transparent black boxes, consistent bottom-center footer |
| Caption gaps during navigation            | Continuous caption intervals throughout the walkthrough                                                                     |
| Product/reorder labels lag the scene      | Product label starts at source 26.80s (output 29.20s); reorder label at source 64.15s (output 66.55s)                       |
| Broad category feature description        | “Manage menu categories,” followed by actual availability and reorder actions                                               |
| API-only operations labeled in small text | Explicit “API-only” availability/archive captions in the larger footer                                                      |
| Immediate opening/ending                  | 2.4-second branded intro and three-second closing with Customer demo and repository URLs                                    |
| 2,197,915 bytes                           | **2,786,231 bytes** (2.79 MB)                                                                                               |

The complete recorded viewport is scaled to 1344x840 and centered within the new canvas; no application pixels are cropped. New captions occupy a separate 240px footer and sit above the native player toolbar at the tested 720px player width. **Original in-browser overlays remain visible** inside the footage; removing them would require reconstructing covered pixels or recapturing. This export deliberately retains them and adds a more readable editorial layer. Operation order, data and meaning remain unchanged.

## Validation

- FFmpeg 6.1.1 export: **H.264 High, level 4.1, yuv420p, square pixels, 25 fps**; no audio stream. Fast-start `moov` precedes `mdat`.
- Full decode completed without errors. Beginning, middle, end, API-only and reorder frames inspected, including eight local Chromium seek samples.
- Chromium loaded the actual 1920x1080/80.36s media, played and sought successfully, with no media/runtime errors. Native-control overlap found in an initial layout was corrected and the final layout rechecked.
- Sixteen caption intervals validated as continuous and positive. Both original chapter JSON files are unchanged; the new timeline records the two reviewed timing adjustments.
- Original and backup SHA-256 match: `6678df8c62a090a42597a3ef844c66c4ac96218c33acb693b293fd2a76ac083e`. Export SHA-256: `47301a3b165880e3e21e0a4446538636bc2fb5a588b1bcc183358e877a87a356`.
- Editing-script syntax and diff checks passed. [Workflow instructions](../../scripts/portfolio/README.md) describe reproducibility and font/encoder requirements.

The original remains at its existing path and a byte-identical backup is retained at `audit-artifacts/video-polish/admin-walkthrough.original.mp4`. The README still links the original; the polished version is **awaiting manual approval**, with no automatic promotion or backup deletion.

No application changes, database changes, production interactions, full Playwright recapture, new dependencies, music, narration, commits, pushes, uploads or deployment occurred. GitHub upload/playback was not tested; compatibility evidence is the standard H.264 export and local Chromium playback. Existing provider/release limitations and captured UI findings remain unchanged.
