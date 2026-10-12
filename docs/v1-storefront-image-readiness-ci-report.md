# Storefront image readiness investigation

Date: 12 October 2026. Baseline checkout: `98d4790`. Scope: Chromium storefront image readiness; no business logic, image component, image configuration, production data, commits, pushes or deployment changed.

## Finding and correction

The reported CI failure could not be inspected directly: no matching local CI trace/screenshot was retained, GitHub CLI is unavailable, and direct Actions API access was unavailable. The workflow previously had no artifact upload. Local historical helper-only results do not establish the outcome of the failing CI run.

The same failure class reproduced under a clean production build: all three storefront repetitions failed on **Wings photo sample at 390px**, while the other 21 helper/contrast cases passed. This is evidence of the failure class, not proof that the original Pepperoni CI request had the identical cause.

The reproducible trigger was changing the viewport while the previous storefront document remained loaded, immediately followed by a new navigation. This generates responsive image requests for the outgoing document and again for the incoming document. The failed photo remained connected and visible, with `complete=false`, zero natural dimensions, and empty `currentSrc` for the entire 8-second deadline. Its two 384px optimizer requests had no completed response. The retained screenshot confirms a blank photo. This failed before decoding; it was not a swallowed decode failure or a passing visibility assertion.

The test now navigates to `about:blank` before changing the viewport. This ends the previous document before responsive candidates change, eliminating that overlap while preserving the browser context, product fixtures, assertions, and 8-second deadline. Three corrected production repetitions passed all 24 cases with zero retries. The precise underlying browser/Next.js cancellation or request-coalescing mechanism remains unconfirmed; do not describe this as a proven Next.js optimizer defect.

| Candidate cause | Finding |
| --- | --- |
| Optimization / cold cache | Optimization is active; cold responses succeed. Timing varies, but cold optimization alone is not an established cause of the incomplete 390px request. |
| Missing fixture / failed HTTP response | Packaged fixture exists and both selected widths return 200 after isolation. The reproduced stalled request had no completed response, rather than an observed 404/500. |
| Browser decoding | The reproduced failure remained in the incomplete-load state; decoding had not started. Decode failure/stall assertions still pass their negative tests. |
| Test synchronization | Outgoing-document resize followed immediately by navigation is a reproducible trigger; ending that document first corrects the tested sequence. |
| Application regression | No ordinary browsing regression established; application code unchanged. Rapid resize plus navigation needs separate real-UX confirmation. |
| Hosted CI contention | Unverified without original artifacts or hosted runner measurements. Local timing variability does not prove hosted resource contention. |

## Request and state evidence

The file `apps/web/public/images/menu/pepperoni-pizza-v1.webp` exists (188,552 bytes). Its selected requests are:

| Viewport | Selected `currentSrc` path |
| --- | --- |
| 1440px | `/_next/image?url=%2Fimages%2Fmenu%2Fpepperoni-pizza-v1.webp&w=256&q=75` |
| 390px | `/_next/image?url=%2Fimages%2Fmenu%2Fpepperoni-pizza-v1.webp&w=384&q=75` |
| 320px | `/_next/image?url=%2Fimages%2Fmenu%2Fpepperoni-pizza-v1.webp&w=384&q=75` |

The HTML `src` fallback uses `w=3840&q=75`; it is **not** the selected request. All URLs above are relative to the local test origin `http://localhost:3000`.

In the failed cold production repetition, desktop Pepperoni and Wings returned HTTP 200 / `image/webp` / `x-nextjs-cache: MISS`, finishing in approximately 1,081ms and 1,094ms respectively. At 390px, Pepperoni had two starts and a completed HTTP 200 / HIT response in 12.9ms. Wings had two starts and no completed response; trace HAR status is `-1` (unknown/incomplete, not an HTTP error). Its helper timed out in approximately 8,059ms; subsequent repetitions timed out in 8,074ms and 8,060ms. Cold optimization alone does not explain these observations.

In the first corrected valid repetition, Pepperoni/Wings at 390px each had one request, HTTP 200 / HIT, finishing in 16.9ms / 17.8ms. At 320px the same candidates finished in approximately 0.15ms / 0.13ms using the browser cache. Required photos decoded with positive natural dimensions. No page errors were recorded. The failed trace's console errors were resource HTTP 401 messages for anonymous authentication checks, not hydration errors or image failures. Sanitized future console diagnostics retain only categories/network error codes, never raw messages.

The subsequent full-selection continuation exercised a cleared optimizer cache: all eight storefront cases passed. Pepperoni/Wings at 390px returned HTTP 200 / MISS in 100.7ms / 128.6ms, with one request each. Their readiness calls completed in 139ms / 113ms. Desktop cold total request timings reached approximately 7,555ms / 7,553ms, and recorder request-to-response elapsed time was approximately 7,620ms. Those totals include scheduling/queue/body time and are not isolated server optimization latency (Pepperoni's `requestStart` offset alone was approximately 7,365ms). This variability warrants retaining timing evidence, but does not establish that slow cold optimization caused the original 390px failure. The unchanged readiness assertions passed; no larger budget is proposed without CI measurements.

The readiness helper correctly distinguishes incomplete load, complete load with zero dimensions, decode rejection, decode stall, and successful decode. Existing synthetic tests also distinguish offscreen lazy images from visible pending images. All remain enabled. Diagnostic snapshots are bounded and best effort; they do not extend the readiness work deadline. The helper does not verify HTTP status itself; the request recorder supplies that evidence.

## CI comparison and remaining uncertainty

The checked-in workflow runs `pnpm test:quality` without `ORDERLY_BROWSER_PRODUCTION=1`. The browser runner therefore uses `next dev` in GitHub Actions, despite an earlier production build. Local production validation does not establish Ubuntu/Node 22 CI behavior; this workstation uses Windows/Node 24.16.0. No authenticated CI rerun or CI resource measurements were available. CI contention remains unverified, and no timeout increase or optimization bypass is justified by the measured evidence.

The corrected test also passed three complete local `next dev` repetitions with `CI=true` and `GITHUB_ACTIONS=true`: 24/24, zero retries. First-repetition 390px Pepperoni/Wings each had one optimizer request, HTTP 200 / MISS, completing in approximately 293ms / 298ms. This compares server modes on the workstation; it does not prove hosted CI behavior. Development logs included LCP and Redux middleware performance warnings; they were not image load/decode failures and were not suppressed. A configuration rewrite generated by `next dev` was restored to the clean baseline; it is not an intended source change.

Failure-only CI artifact retention now includes only sanitized `image-state-*.json` and `storefront-image-requests.json`, retained for seven days. It excludes raw traces, screenshots, console text, cookies, authorization headers, arbitrary query parameters and data URLs. Optimizer URLs preserve only a validated public menu asset pathname and numeric width/quality. The upload action version follows the [official upload-artifact usage](https://github.com/actions/upload-artifact#usage).

No ordinary production browsing regression was demonstrated. The correction addresses the test's document/viewport transition. A rapid real browser resize followed immediately by navigation could exercise related behavior and remains an external reproduction question; do not claim production immunity from these local results.

## Exact changed files

- `apps/web/test/browser/storefront-configurator.spec.ts`: end the outgoing document before viewport changes; record sanitized request starts, responses, completion timing, failures, cache/content type and console/page-error categories; persist diagnostics.
- `apps/web/test/browser/image-readiness.ts`: record bounded before/after image state snapshots, selected source, dimensions, connection state and viewport geometry as sanitized JSON; preserve original readiness outcomes and deadline.
- `.github/workflows/ci.yml`: retain the sanitized image JSON after a failed run.
- `docs/v1-storefront-image-readiness-ci-report.md`: this report.

## Validation evidence

All database work targeted guarded loopback `orderly_test`, schema `public`, using synthetic fixtures. Test workers: one; retries: zero. Generated cache deletion was restricted to verified paths under `apps/web/.next`.

| Run | Result | Evidence |
| --- | --- | --- |
| Initial production attempt | Build failed before browser execution because stale generated `.next/dev` types referenced an absent route; generated `.next` removed and clean build succeeded | `audit-artifacts/image-production-1.log` |
| Uncorrected clean production, three repetitions | 21 passed, 3 failed (Wings 390px load timeout) | `audit-artifacts/image-production-focused.log`; corresponding trace, screenshot, error context and JSON directory |
| Preliminary isolation experiment | Interrupted: proxy-secret generation used an unsupported PowerShell/.NET API; excluded from acceptance | `audit-artifacts/image-production-isolated.log` |
| Second harness attempt | Stopped before tests: PowerShell `ErrorActionPreference=Stop` treated a normal stderr warning as fatal; excluded from acceptance | `audit-artifacts/image-production-isolation-valid.log` |
| Corrected production, three valid repetitions | **24 passed** | `audit-artifacts/image-production-isolation-validated.log` and JSON directory |
| Full existing production browser regression, cold optimizer cache | **60 passed / 1 failed across initial run and continuation**; all 61 selected cases executed, no unresolved skips; full regression is not clean | `audit-artifacts/image-production-full.log`; `audit-artifacts/image-production-full-continuation.log`; retained `audit-artifacts/image-full-account-failure/` |
| CI-mode development storefront comparison, three repetitions | **24 passed** | `audit-artifacts/image-ci-mode.log` and JSON directory |
| Product-image component regression | **30 passed** | `audit-artifacts/image-components.log` |
| Web TypeScript, final restored configuration | Passed (`EXIT_CODE=0`) | `audit-artifacts/image-final-state-typecheck.log` |
| Web lint, final source state | Passed (`EXIT_CODE=0`) | `audit-artifacts/image-final-state-lint.log` |
| API/Web production builds | Passed in clean focused build and full-run rebuild | Browser logs |

The existing production runner selects 11 suites / 61 cases. Its first four suites passed all 28 cases. The next account case timed out at `customer-account.spec.ts:53`, waiting for the password input after clicking Sign out and immediately navigating to `/login`. The retained snapshot shows `/account`; the logout request has incomplete trace status `-1`, followed by an authenticated `/me` response (HTTP 200). This is a separate navigation/logout synchronization finding, not an image readiness failure. It is retained and unchanged in this narrowly scoped task. The two serially skipped account cases and six unstarted suites were executed separately, all 32 passed, without retrying or concealing the failed case. Continuation used the same guarded synthetic database state and separate fresh servers. This is complete selection coverage, **not** a passing uninterrupted full run. Additional historical acceptance/diagnostic specs outside the runner's default 11-suite selection are not represented by the 61-case total.

## Disposition

The image-test document-isolation correction is supported by three failing uncorrected repetitions, three passing corrected production repetitions, a passing cold-cache storefront run within the complete regression selection, and three passing local CI-mode repetitions. Required render/decode assertions, real image requests, optimization, zero retries and existing time limits remain intact. There is no evidence to justify a readiness budget increase.

Overall regression acceptance remains conditional: investigate the separate account logout/navigation failure and obtain a clean uninterrupted full run; rerun the changed tests on GitHub Actions when these changes are reviewed and committed by the owner. If the reported Pepperoni CI timeout persists, use the newly retained sanitized diagnostics to distinguish an incomplete outgoing-document request from a slow completed optimizer response or decode failure before making any further change. The original hosted-CI root cause and precise browser/Next cancellation mechanism remain uncertain. No production UX defect has been established by this investigation.
