# V1 final release unblocking

11 October 2026. **Latest resumed-verification recommendation: PASS WITH CONDITIONS.** Guarded local browser regression now passes; the historical WebKit loading timeout was not reproduced in isolated and combined coverage. WebKit access-control/hydration errors and native-device/assistive-technology/deployed acceptance remain conditions. No Packaging, commit, push or deployment was performed.

The initial blocked attempt below is retained as historical evidence. Its FAIL/infrastructure status is superseded by the resumed-verification section at the end.

## Revision and exact changes

HEAD remains `d1d293b106232283c11f5e76fc16feca41a1db55` plus the previously accepted, uncommitted six-file cleanup and this timeline change. HEAD alone is not the tested artifact. No commit, push, deployment, database/environment change, new dependency or architectural change was performed. The existing six cleanup application files were left untouched.

New/modified files in this task:

- `apps/web/src/features/order-tracking/components/result/order-status-timeline.tsx`: three decorative connectors between existing chronological steps. Below 768px they connect circles vertically; at/above 768px horizontally. Reached transitions use the existing orange token, upcoming transitions use the existing control-border token. Earlier checks, current-step semantics, future labels, ACCEPTED mapping, recorded dates and pickup/delivery wording remain unchanged. Cancelled orders have no progress list or connectors. No backend logic or new timestamps.
- `apps/web/test/order-timeline-connectors.test.tsx`: focused status/cancellation/decoration tests and optional synthetic DOM captures for before/after comparisons.
- `apps/web/test/browser/timeline-connectors.audit.ts`: opt-in isolated Chromium render audit; checks line endpoints meet adjacent circles within 1px and no horizontal overflow. Uses captured DOM and built CSS with all requests aborted; no API/database or authentication. Missing capture inputs fail the audit.
- `apps/web/playwright.timeline.config.ts`: explicit isolated audit configuration, one worker, no retries, failure traces preserved. Separate from ordinary guarded application regression discovery.
- `docs/v1-timeline-connector-evidence/`: 48 before/after PNGs and SHA-256 manifest. Six recorded states at 320/390/768/1440px in each phase. These use synthetic timestamps and isolated component rendering, including a font fallback, not a deployed full page.
- This report, the cleanup report's narrow unblocking addendum and Stage 15.7's later-status note: current results and unresolved conditions without rewriting historical outcomes.

Local ignored capture inputs/results remain at `audit-artifacts/timeline-connectors/`: baseline and edited DOM, baseline production CSS, browser results. Existing cleanup and Stage 15 evidence was preserved.

## Timeline before/after evidence

| View | Before | After |
| --- | --- | --- |
| Preparing, mobile 390px | [Before](v1-timeline-connector-evidence/before/preparing-390.png) | [After](v1-timeline-connector-evidence/after/preparing-390.png) |
| Ready, desktop 1440px | [Before](v1-timeline-connector-evidence/before/ready-1440.png) | [After](v1-timeline-connector-evidence/after/ready-1440.png) |
| Preparing, narrow 320px | [Before](v1-timeline-connector-evidence/before/preparing-320.png) | [After](v1-timeline-connector-evidence/after/preparing-320.png) |
| Completed, tablet 768px | [Before](v1-timeline-connector-evidence/before/completed-768.png) | [After](v1-timeline-connector-evidence/after/completed-768.png) |
| Cancelled, mobile 390px | [Before](v1-timeline-connector-evidence/before/cancelled-390.png) | [After](v1-timeline-connector-evidence/after/cancelled-390.png) |

Before capture preceded the application edit. Visually reviewed representative mobile/desktop after states. Connectors are `aria-hidden`; ordered list/current-step/status text still convey chronology without color alone. There is no new motion or focus behavior.

## Actual commands and results

| Command | Result |
| --- | --- |
| `ORDERLY_TIMELINE_CAPTURE_PHASE=before pnpm --filter web test --runInBand order-timeline-connectors` | Baseline: **6 passed** before connector tests were added. |
| `ORDERLY_TIMELINE_CAPTURE_PHASE=after pnpm --filter web test --runInBand order-timeline-connectors premium-tracking-accessibility order-tracking-safety` | **3 suites, 23 passed**, including all recorded status mappings, completed connector counts, cancellation, pickup/delivery labels and existing tracking validation/error safety. |
| `pnpm --filter web typecheck` | Passed, including test TypeScript. |
| `pnpm --filter web lint` and targeted lint of new audit/tests/config | Passed. |
| `ORDERLY_API_ORIGIN=http://localhost:4000 ORDERLY_BROWSER_PRODUCTION=1 pnpm --filter web build` | Passed; existing guarded local build override, no production API request. |
| `pnpm --filter web exec playwright test --config playwright.timeline.config.ts` | **1 passed**; 48 captures, endpoint alignment and no overflow across four widths/six states. Static Chromium component audit only. |
| `docker info --format '{{.ServerVersion}}'` outside sandbox | Exit 1, `dockerDesktopLinuxEngine` pipe absent. |
| Existing `createSafeTestDatabaseEnvironment(process.env)` invoked without connecting/resetting | Guard rejected test configuration: outside allowlist because required public-schema query setting is absent. |
| Sanitized configuration/deployment-marker inspection | Test URL is loopback and targets `orderly_test`; `schema=public` absent. No nonempty process environment marker matching the guard's `RAILWAY`/`VERCEL` pattern. No credentials or URL values printed. |

Set the listed environment variables in the invoking PowerShell process on Windows; these command descriptions are not environment-file edits. Baseline reproduction needs the retained baseline capture inputs; this isolated comparison is deliberately separate from the fresh-clone application suite.

Environment: Windows; Node 24.16.0, pnpm 10.14.0, Playwright 1.62.1. Installed engines were verified in the preceding same-day release verification as Chromium 151.0.7922.34, Firefox 153.0 and WebKit 26.5. Only Chromium's isolated timeline coverage ran here; Firefox/WebKit application acceptance did not run.

## Phase B — concrete manual blocker

**Stop infrastructure restoration here.** Open **Docker Desktop**, ensure Linux-container mode is active, and wait until its Linux engine is running. If Desktop cannot start the engine, resolve its WSL2/virtualization startup error first. Successful `docker info` must precede further local database work; do not substitute a remote service.

There is also a local test configuration correction pending: the existing loopback dedicated `TEST_DATABASE_URL` needs its required `schema=public` query parameter. Preserve existing local credentials/host/database; do not edit production/staging targets. Once the engine runs, use the repository's guarded preparation/runner to verify and prepare only `orderly_test`. The normal compose database is `orderly_db`, which is not the destructive-test target.

The wrapper explicitly creates a test-process environment with `NODE_ENV=test` and identical `DATABASE_URL`/`DIRECT_DATABASE_URL` derived from `TEST_DATABASE_URL`; it then validates loopback host, database, public schema, matching targets and absent deployment markers. Current configuration fails before the environment is accepted. No connection/reset/seed was attempted, no guard bypassed and no database was mutated. Start/verify the engine and correct the local test URL before retrying the unchanged guard. Do not claim successful matching-target verification from construction alone.

## Phases C/D — application coverage and WebKit

Application Chromium regression and existing Firefox/WebKit acceptance are **blocked, not passed**. They were not run after the known daemon/configuration failure; this follows the requested stop condition rather than skipping a failing browser case. The previous guarded runner already refused before database connection. No browser timeout, test assertion or acceptance configuration was weakened.

Historical WebKit classification: **Unresolved**. The current infrastructure failure is confirmed, but is not evidence that infrastructure caused the historical repeated-navigation stall. The retained checkout/session-loading failures and passing isolated visits remain as previously documented. This turn could not reproduce session bootstrap→menu→configurator→cart→checkout→account/history, so no new application trace, request lifecycle/pending-request list, console capture, bootstrap/loading state or navigation timing exists. The isolated timeline audit cannot establish that a checkout/session issue is resolved.

After safe infrastructure restoration, run unchanged guarded Chromium regressions and the existing Firefox/WebKit acceptance config, writing evidence to a **new** directory. Compare isolated visits against the repeated full journey with trace plus sanitized request/console/bootstrap/loading diagnostics. Preserve failures. If a normal checkout stall is confirmed P1, report its minimal cause/fix before modifying application code; no such defect or fix is inferred here.

## Remaining release risks

- No confirmed new P0/P1 in available focused tests. Historical WebKit loading remains a **potential P1**, unresolved.
- Browser regression/real application focus, URL history, checkout, Admin workflows and responsive release verification remain blocked.
- The timeline closure item is now implemented and tested; it no longer blocks implementation review.
- Previously retained P2 auth layout stability/enlargement findings and manual device/assistive-technology/operations checks remain open; this task does not audit or redesign them.
- Real Safari/Android, VoiceOver/NVDA, actual safe areas/keyboard, deployed performance and production configuration are not certified by component screenshots or headless engines.

**Phase A: PASS. Overall release-unblocking recommendation: FAIL (external verification blockers remain).** No Packaging begun. Resume application verification only after the concrete local engine/configuration intervention.

## Resumed final release verification — actual results

### Safe infrastructure restored

Docker Desktop Linux Engine reports **29.5.3**. Safely corrected only the ignored local `apps/api/.env` entry `TEST_DATABASE_URL` by adding `schema=public`, after verifying its loopback host and dedicated `orderly_test` database and validating the candidate through the existing destructive-test guard. Credentials were preserved and never printed. Regular/direct non-test environment-file URLs were not edited.

The existing `createSafeTestDatabaseEnvironment` now passes: `NODE_ENV=test`, loopback host, dedicated `orderly_test`, public schema, identical Prisma targets and no deployment markers. The existing guarded prepare/reset script applied migrations only to the dedicated test database and seeded its synthetic fixtures. No production, Railway, Neon or staging connection/reset was used. A read-only Docker query confirmed **`orderly_test|public`**, PostgreSQL **16.14**. Existing guard code remains unchanged.

### Exact tested revision and commands

HEAD remains `d1d293b106232283c11f5e76fc16feca41a1db55` plus the accepted uncommitted cleanup/timeline changes and focused tests. `audit-artifacts/release-resume/source-snapshot.json` records SHA-256 for the modified application/test files; the final comparison confirms **all unchanged during this verification**. Both existing evidence manifests were checked: **84 screenshots, zero mismatches**. HEAD alone is not the tested artifact.

| Actual command | Result |
| --- | --- |
| `docker info --format '{{.ServerVersion}}'` | Passed, Linux Engine 29.5.3. |
| Sanitized local URL correction and existing guard verification | Passed; only missing public-schema parameter corrected. |
| `pnpm exec node audit-artifacts/release-resume/run.cjs chromium` | Passed. Runs existing guarded reset/preparation, existing browser fixture seed, API/web production builds, then the same 11 existing application suites with server restarts between suites. |
| `pnpm exec node audit-artifacts/release-resume/run.cjs firefox` | Passed existing acceptance assertions through an instrumented mirror: **6 passed, 2 existing engine-specific skips**. |
| `pnpm exec node audit-artifacts/release-resume/run.cjs webkit` | Passed: **7 passed, 1 existing Chromium-only performance skip**. |
| `pnpm exec node audit-artifacts/release-resume/run.cjs webkit combined` | Passed: **4 passed, 1 existing Chromium-only performance skip**, including the four-width journey in one context. |
| `pnpm --filter web typecheck:test` | Passed after diagnostic additions. |
| Targeted ESLint for `release-loading-diagnostics.fixture.ts` and `final-release-loading.audit.ts` | Passed. |
| `git diff --check` | Passed. |
| `docker compose exec -T db psql -U orderly_user -d orderly_test -tAc 'SELECT current_database(), current_schema(), version();'` | Read-only identity/version verification passed. |

The local ignored launcher initially failed before preparation because `pnpm exec` did not set `npm_execpath`; its fallback was corrected to the installed Corepack pnpm entry point. Diagnostic fixture lint initially interpreted the callback named `use` as a React hook; renamed the callback. These were resolved harness setup failures, not application browser failures. No assertions or timeouts were changed to fix them.

### Chromium application coverage

| Existing suite | Passed |
| --- | ---: |
| critical-workflow | 18 |
| design-foundation | 2 |
| customer-navigation | 2 |
| google-oauth | 6 |
| customer-account | 3 |
| customer-checkout-ownership | 6 |
| customer-order-history | 6 |
| customer-anonymous-auth | 3 |
| storefront-configurator | 8 |
| premium-transactions | 5 |
| premium-auth-orders-tracking | 2 |
| **Total** | **61** |

Coverage includes actual local guest ordering/confirmation/tracking, Admin order acceptance, protected Admin navigation, controlled Google OAuth, registration/login/session replacement/recovery, checkout ownership, URL-based order-history behavior, cross-customer detail protection, responsive controls, dialogs, long-cart scrolling, reduced motion and Customer/Admin design isolation. The existing Chromium suite is not a claim of exhaustive Admin menu CRUD/keyboard ordering UAT. No new commercial feature or general UI audit was introduced.

Firefox and WebKit acceptance cover rendered customer journeys at 1440/768/390/320px, keyboard containment, fixed checkout actions, navigation, history/tracking states and accessibility. This supplemental acceptance uses controlled auth/history/tracking responses and the guarded local menu/database; it does not replace Chromium's actual backend session/ownership regression or native-device UAT. Firefox's two existing skips are Chromium-only performance and WebKit-only checkout isolation; WebKit skips only Chromium performance. **No new skip, retry, timeout extension or weakened assertion** was introduced. The instrumented mirror was verified byte-for-byte against the original acceptance source after normalizing its sole fixture-import replacement.

Installed/runtime engines: Chromium **151.0.7922.34**, Firefox **153.0**, WebKit **26.5** on Windows; Node 24.16.0, pnpm 10.14.0, Playwright 1.62.1. API runs in guarded test mode; Next serves an optimized build using the existing local-origin production-browser override. This does not certify deployed production configuration equivalence.

### WebKit root-cause classification

**Historical loading issue: NOT REPRODUCED WITH SUFFICIENT LOCAL AUTOMATED EVIDENCE. Root cause remains unproven; no application fix or permanent resolution is claimed.**

The isolated WebKit run passed all four complete rendered journeys and fixed checkout controls. The combined run passed the same four widths in a single context, including repeated menu→configuration→cart→checkout→tracking→account/history navigation. Both also passed the original screenshots/DOM checkout-hydration diagnostic without axe. The original assertions/timeouts remain intact; the no-axe diagnostic is existing comparative coverage, not a substitute for the passing axe journey.

| Width | Isolated-context run's repeated-checkout readiness | Combined run's repeated-checkout readiness |
| --- | ---: | ---: |
| 1440px | 1327ms | 760ms |
| 768px | 636ms | 615ms |
| 390px | 1233ms | 620ms |
| 320px | 577ms | 510ms |

All eight explicitly timed visits were ready, with zero errors/failed requests in those existing isolation result files. Additional rendered and fixed-control checkout visits also passed. Request lifecycle, navigation, session-checking/busy/skeleton presence and pending-request age were sampled; state sampling resolution is 500ms, not an exact bootstrap-duration measurement. Complete timestamped records are retained privately.

**Important separate findings:** WebKit's isolated run recorded 21 page-error events in otherwise passing tests; initial sanitized logs withheld message details. The fully traced combined run recorded 25 page-error events: **12 access-control messages and 13 React error #418 hydration messages**. No other page-error category was found in its five traces. React documents #418 as a server/client hydration mismatch followed by client regeneration; the precise source of this mismatch here has not been established. [React error reference](https://react.dev/errors/418).

These errors are not silently treated as clean console acceptance. The tested journeys recovered/passed; there is no demonstrated normal-checkout stall or confirmed P1 caused by them. Record them as **open P2/diagnostic follow-ups** requiring a focused source/deployment comparison before unconditional production sign-off. Do not attribute them to axe, configuration, prefetch redirects or the historical timeout without further evidence.

The combined diagnostics ended with four pending `/login` or `/track-order` requests aged 47–82ms at journey teardown and one new static-chunk request aged 0ms at isolation teardown. These are recorded transient requests, not evidence of a prolonged stalled bootstrap. Isolated WebKit/Firefox tests ended with no pending requests. Firefox recorded zero page errors; some image-request failures remain in passing journey diagnostics with unspecified failure codes, and are not rewritten as successful requests.

There was **no genuine P1 reproduction**, so no application root-cause patch is proposed or implemented. The earlier missing-Docker/schema blockers were confirmed infrastructure issues and are now corrected; they are not retroactive proof of what caused Stage 15.7's WebKit failure.

### Evidence, privacy and changed-file inventory for this resumption

All new evidence is under the ignored **`audit-artifacts/release-resume/`**, separate from original Stage 15 captures:

- `chromium/*.log`: guarded preparation, seed/build and each of the 11 suite results.
- `firefox/`, `webkit/`, `webkit-combined/`: run logs, JSON reporter results, fresh rendered PNG/axe JSON/engine metadata, per-test sanitized lifecycle/loading diagnostics.
- `webkit-combined/browser-results/**/trace.zip`: **five retained traces**, including successful diagnostic journeys. Raw traces may contain local test cookies/session identifiers and fixture data; keep private and do not publish without separate privacy review.
- `verification-summary.json`, `trace-error-summary.json`, `source-snapshot.json`: machine-readable outcomes, sanitized trace-error counts and exact source identity.

Each of the three acceptance runs retained **70 scans**, **zero reported axe violations** and **zero standard-width overflow assertion failures** (210 scans total). Incomplete/manual rule findings are not converted into passes or a WCAG certification. Existing screenshot/trace originals and external archive were not moved, regenerated or altered.

Changed/new files for this resumption only:

- Ignored `apps/api/.env`: local dedicated test schema correction, no secrets published.
- `apps/web/test/browser/release-loading-diagnostics.fixture.ts`: opt-in automatic lifecycle/loading diagnostics; omits query strings, request bodies, response payloads, headers and arbitrary console/error message values.
- `apps/web/test/browser/final-release-loading.audit.ts`: opt-in mirror of existing acceptance assertions/timeouts with only the diagnostic fixture import changed. Its `.audit.ts` suffix keeps it out of normal regression discovery.
- Ignored `audit-artifacts/release-resume/run.cjs`, two config adapters, summary helpers and resulting evidence: reuse the existing guarded preparation/suite logic and change output paths/instrumentation only. Config adapters preserve original checks/timeouts; traces retained on success for comparison.
- This report and the cleanup/Stage 15.7 status addenda: current outcomes, without rewriting historical test results.

### Final release recommendation

**PASS WITH CONDITIONS for completed local release verification and owner review.** Infrastructure and application-browser execution blockers are cleared, and the historical loading timeout was not reproduced in this local comparison. No confirmed P0/P1 remains from this run.

Unconditional production acceptance still requires disposition of the WebKit access-control/hydration findings and historical P2 auth CLS/enlarged-header findings, plus named real Safari/Android, screen-reader, native zoom/keyboard/safe-area, deployed performance/configuration and operational/backup-restore evidence. Automated desktop WebKit is not actual iPhone Safari. No Packaging, commit, push or deployment started; stop for review.
