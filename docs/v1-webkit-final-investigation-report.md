# Orderly V1 — Final WebKit Hydration and Access-Control Investigation

Date: 2026-10-11. Investigated HEAD: `d1d293b106232283c11f5e76fc16feca41a1db55` plus the accepted, uncommitted cleanup/timeline work. This investigation adds a focused hydration fix; it does not change authentication methods, authorization, API contracts, customer ownership, database schema or deployment configuration. No commit, push, deployment or Packaging work was performed.

## 1. Hydration root cause and affected routes

The five retained combined-run traces contain **13 React #418 events**: eight on `/account` and five on `/account/orders`. All are HTML mismatches. Route attribution uses the last main-frame snapshot before each error, not a guessed component from a minified function name.

A fresh development reproduction identifies `AccountLayout → CustomerRouteGuard`. React's diff shows authenticated account layout children on the client where the server rendered the session-checking `p[role=status]` inside the compact guard wrapper. The reproduction does not use axe. A focused SSR/hydration test independently reproduces the same mismatch: a bootstrap effect outside a Suspense boundary updates customer state before that boundary hydrates.

`StoreProvider` created a fresh initial store on both sides, but passed only `store` to React Redux's Provider. Its bootstrap effects can advance the live store while a streamed boundary still needs the initial server snapshot. This is a store hydration timing issue, rather than evidence for invalid nesting, random values, locale formatting, browser conditional markup or a broken authentication API. The development run additionally exposed a form hydration difference at `CustomerAuthForm`; the same provider snapshot mechanism covers that path, subject to the browser verification below.

**Classification: confirmed production-relevant application defect, P2 in the observed recovery/pass scenarios.** It reproduces locally with optimized application code and a component test; actual authenticated production reproduction was not attempted. There is no demonstrated data exposure, authorization bypass or P1 checkout stall. React describes #418 as a mismatch followed by client regeneration. [React error reference](https://react.dev/errors/418).

### Minimal fix

Capture the initial store state once in `StoreProvider`, and pass it as `serverState` to React Redux's Provider. React Redux uses that snapshot for hydration and then applies live client updates. No bootstrap request, reducer, cookie, redirect, ownership or session lifecycle was changed. This uses an existing dependency's supported SSR mechanism. [React Redux Provider documentation](https://redux.js.org/react-redux/api/provider).

The regression test failed before this application change with the guard placeholder/account-content mismatch and passed afterward. It also asserts that authenticated content eventually appears, preventing a frozen initial-state implementation from passing.

## 2. Access-control evidence

The retained combined journey has **12 access-control events**, naming same-origin frontend GET requests with the `_rsc` query key:

| Destination path | Events | Origin and destination |
| --- | ---: | --- |
| `/login` | 5 | `http://localhost:3000` → same origin; some include `returnTo` |
| `/` | 2 | same origin |
| `/privacy` | 3 | same origin |
| `/track-order` | 1 | same origin |
| `/terms` | 1 | same origin |

The request records have Next.js RSC/prefetch header names, and the stack points into the Next.js fetch chunk. Events cluster around document `goto` transitions from confirmation pages and the final login/menu transitions. Recorded responses in the affected window include same-origin HTTP 200 responses, with no captured HTTP redirects. This does **not** establish that every body completed successfully.

The earlier parser's empty `accessControlPaths` was a diagnostic parsing limitation: WebKit/Playwright splits the browser error into name/message fields in a way that loses the URL prefix when only `message` is read. The original stack's first line retains the resource URL. New sanitized diagnostics extract resource origin/path/query-key names from that line. Query values, headers, cookies and payloads are not published.

The fresh optimized diagnostic passed its immediate and 500ms-delayed authenticated account/history journeys with **zero hydration errors** but seven other access-control events. Its six confirmation/login cycles, with real local anonymous API responses rather than authentication mocks, passed while recording four access-control events. The existence of these warnings does not by itself demonstrate failed customer API access.

### Deployed comparison and limitations

A fresh WebKit context visited deployed `/`, `/login`, `/register`, `/track-order`, `/login`, `/` using GET/HEAD/OPTIONS only. All non-read-only requests were intercepted and blocked, including three attempted refresh POSTs; no live login, Google OAuth, customer order submission or production database mutation was performed. All six public documents rendered, and two access-control page-error events named same-origin `/register?_rsc=…` resources at `https://orderly-web-gamma.vercel.app`. Public `/api/customer/auth/me` GETs returned the expected anonymous HTTP 401 in recorded responses. Some requests were aborted around navigation; blocked refresh failures are instrumentation effects, not production defects.

Thus the message also occurs against deployed frontend resources under automated navigation. This is **not** a verification of authenticated production cookies, refresh, redirects, ownership or native Safari, and the deployed source revision was not established. It does not prove production API CORS is misconfigured. The hydration fix is local and was not deployed.

### Controlled browser/runtime comparison

A sequential optimized WebKit diagnostic waited for all observed RSC prefetches to complete before its stable checkpoint (1304ms). It then made four login/confirmation document-navigation cycles. Six same-origin RSC requests were explicitly cancelled/aborted at document transitions. Two access-control entries followed the latter cancellation group approximately 50ms later, identifying `/login` and `/register` RSC resources. No JavaScript `error` or `unhandledrejection` event occurred; all navigations and final request-drain checks passed.

The installed Playwright 1.62.1 WebKit adapter (`playwright-core/lib/coreBundle.js`, `_onConsoleMessage`) promotes native browser console records with JavaScript source/error level to `pageerror`. Thus a Playwright `pageerror` here is not necessarily an unhandled application exception. The native log text is a misleading access-control diagnosis of interrupted same-origin prefetches in the observed case. No cross-origin API request or failed CORS preflight is identified by these messages.

**Classification: test/browser-navigation diagnostic artifact for the reproduced access-control group; no confirmed API CORS or authentication defect.** Evidence supports cancelled Next.js RSC prefetches and WebKit's native logging as the mechanism. It does not prove that every future access-control warning has this cause. The same log class occurs during automated deployed document navigation, so retain traceability rather than globally suppressing errors. Native Safari and authenticated deployed sessions remain unverified. No CORS, cookie, API or prefetch change was made.

## 3. Changes made in this investigation

| File | Change |
| --- | --- |
| `apps/web/src/store/store-provider.tsx` | Fixed initial hydration snapshot via existing Provider `serverState` |
| `apps/web/test/store-provider-hydration.test.tsx` | Red/green SSR-to-client bootstrap race regression |
| `apps/web/test/browser/customer-hydration.spec.ts` | Focused account/history document hydration checks at 1440px, 390px and 320px, with immediate/delayed mocked session responses |
| `apps/web/test/browser/release-loading-diagnostics.fixture.ts` | Sanitized hydration/access-control categories, resource locations, RSC/prefetch markers and cancellation classification |
| `docs/v1-webkit-final-investigation-report.md` | Findings, actual results and release disposition |

Ignored `audit-artifacts/webkit-investigation/` contains opt-in diagnostic runners/configurations, private traces, screenshots, logs and sanitized summaries. Existing acceptance mirrors, assertions and timeouts are preserved; no standard test is skipped to pass this investigation. Accepted cleanup/timeline source and original evidence are preserved.

## 4. Verification

All local browser work uses `createSafeTestDatabaseEnvironment` and the existing destructive-test guards: loopback host, dedicated `orderly_test`, `schema=public`, matching Prisma targets, `NODE_ENV=test`, no deployment markers. Docker Linux Engine 29.5.3 is available. No production/staging/Railway/Neon database was used. Playwright 1.62.1, WebKit 26.5; browser engine metadata from the acceptance runs remains private.

| Command / comparison | Actual result |
| --- | --- |
| `pnpm --filter web test --runInBand store-provider-hydration.test.tsx` before fix | FAIL as expected: one recoverable hydration mismatch (after correcting the initial diagnostic's missing jsdom annotation) |
| `pnpm --filter web test --runInBand store-provider-hydration.test.tsx customer-account.test.tsx` after fix | PASS: 9 tests, 2 suites |
| `pnpm exec node audit-artifacts/webkit-investigation/run.cjs dev` | Diagnostic failed: first two tests used an incorrect new empty-state locator; third recorded a development login disabled-state timeout and form hydration diff. These traces are preserved; this is not a passing regression result |
| `pnpm exec node audit-artifacts/webkit-investigation/run.cjs build` | PASS optimized build with guarded local-browser environment; initial direct builds rejected missing origin/HTTPS configuration, as designed, and are retained |
| `pnpm --filter web typecheck` | PASS, including final verification after restoring Next's generated configuration edit |
| `pnpm --filter web lint` | PASS |
| `pnpm exec node audit-artifacts/webkit-investigation/run.cjs optimized after` | PASS: 3 focused diagnostics, immediate/delayed account/history and six confirmation/login cycles; 0 hydration errors, 11 access-control events |
| `pnpm exec node audit-artifacts/webkit-investigation/run.cjs public` | PASS for six GET-only deployed anonymous documents; 2 access-control events, no hydration event; production authentication not verified |
| Full web component suite after change | FAIL: 306 passed, 14 failed; 37 suites passed, 5 failed; 696.883s. Original failures retained |
| Sequential retry of all five failed suites plus hydration regression | PASS: 59 tests, 6 suites, 30.348s; unchanged assertions and Jest timeouts |
| Existing combined WebKit acceptance journey after change | FAIL: 1 failed, 3 passed, 1 existing Chromium-only performance skip; 15.2m. Combined rendered journey exceeded its unchanged 600000ms timeout |
| Native WebKit log/runtime/prefetch comparison | PASS: 1 diagnostic, 7.3s test duration; 2 native access-control entries, 0 JavaScript error/rejection events, 6 cancelled RSC requests |
| Fresh focused WebKit selection | PASS: 15 tests (12 hydration cases + 3 existing anonymous/cross-tab session tests); `INVESTIGATION_REGRESSION=1 pnpm exec node audit-artifacts/webkit-investigation/run.cjs optimized regression-webkit-fresh webkit` |
| Fresh focused Firefox selection | PASS: 15 tests; `pnpm exec node audit-artifacts/webkit-investigation/run.cjs regression regression-firefox firefox` |
| Fresh focused Chromium selection | PASS: 15 tests; `pnpm exec node audit-artifacts/webkit-investigation/run.cjs regression regression-chromium chromium` |
| Sequential unchanged combined WebKit retry | PASS: 4 passed, 1 existing Chromium-only performance skip; 549.139s overall. `ORDERLY_ACCEPTANCE_COMBINED_JOURNEY=1 pnpm exec node audit-artifacts/release-resume/run.cjs webkit hydration-sequential` |

During the concurrent expanded component/combined-browser run, a PowerShell process could not start its CLR (`HRESULT 80004005`). A read-only host check found 7556860 KiB visible memory and only 336876 KiB free physical memory (about 329 MiB). Broader component failures included unrelated keyboard/forms suites and passed unchanged when retried sequentially. This is strong evidence of host execution pressure affecting that run, not proof of the cause of every timeout.

The failed combined journey's last retained browser calls include its existing image decode audit. A screenshot/axe stage near the overall deadline is not, by itself, proof of a permanently stalled decode or checkout bootstrap. Its full trace is retained. The same run's separate fixed-checkout, mobile-navigation and repeated-checkout diagnostics passed. Checkout readiness at 1440/768/390/320px was 842/672/607/1310ms, with no recorded errors or failed requests in that isolation result. This does not establish the historical loading timeout's root cause or permanent resolution.

The failed rendered journey's final samples were on `/register`, with no session-checking text, busy state or skeleton detected and no request left pending at teardown. Its final Google branding image and status request recorded HTTP 200 and finished before teardown. The diagnostic's `checkoutForm` flag is only a heuristic based on a name-autocomplete input, which is also present on registration; it is not evidence that checkout was displayed. This failure is not a reproduction of a stuck checkout/session bootstrap.

The first focused WebKit regression invocation passed all 12 hydration cases and two anonymous-auth cases, but the existing cross-tab registration case received HTTP 409 for a retained synthetic identity. The original failure/trace and sanitized registration response summary are preserved. A fresh fixture set was prepared using the existing guarded `seed-browser-test-data.ts`, and the unchanged complete selection then passed **15/15**. Only the allowlisted local test database was seeded.

The three fresh browser selections passed **45 tests**, with no skipped cases, using the original regression 45000ms test/10000ms expectation limits. Each checks authenticated account/history hydration at 1440/390/320px with 0/500ms response delays, plus the existing real local anonymous bootstrap, invalid-cookie and cross-tab login/refresh/logout assertions. These are focused regressions, not the complete application's browser suite. The private runner's `regression` mode seeds fixtures before engine execution through the existing guard; the first WebKit fixture refresh was an explicit preceding command. Syntax above summarizes process environment settings; in PowerShell set `$env:NAME='value'` before the command.

The sequential retry passed the complete four-width rendered journey, fixed checkout controls, mobile navigation and existing repeated-checkout isolation test. The complete rendered journey took about 6.2 minutes within its original 600000ms limit; no timeout or assertion was weakened. It recorded **zero hydration errors**, eight native access-control entries, **70 axe scans with zero reported violations**, zero standard-width overflow failures, and no pending requests at test teardown. Repeated-checkout readiness at 1440/768/390/320px was **712/1306/1273/499ms**, with zero errors or failed requests in the isolation result.

The earlier combined timeout remains recorded as an environment-sensitive diagnostic failure, supported by host memory pressure, a CLR startup failure, the unchanged component retries, and the unchanged sequential browser pass. Its exact causal chain is not proven, and it is not classified as a confirmed production application defect. This investigation does not claim a permanent fix for the historical repeated-navigation timeout.

Versions: Node 24.16.0, pnpm 10.14.0, Playwright 1.62.1, optimized Next.js 16.2.6 on Windows. The unchanged installed browser binaries are Chromium 151.0.7922.34, Firefox 153.0 and WebKit 26.5 as recorded in the preceding release verification; the fresh deployed WebKit diagnostic also recorded 26.5. Desktop engine simulation is not real iPhone Safari. Only WebKit's existing Chromium-only performance test was skipped in the acceptance selection; none of the 45 focused regression cases was skipped.

## 5. Evidence and privacy

- Inputs: `docs/v1-final-release-unblocking-report.md`, `audit-artifacts/release-resume/verification-summary.json`, `trace-error-summary.json`, five original `webkit-combined/browser-results/**/trace.zip` files and sanitized lifecycle diagnostics.
- Trace attribution: `audit-artifacts/webkit-investigation/retained-trace-analysis.json` and extractor. Original trace bytes were not altered.
- Development component diff and initial diagnostic failures: `audit-artifacts/webkit-investigation/dev/`.
- Component before/after logs: `hydration-unit-before.log`, `hydration-unit-after.log` in that evidence directory.
- Optimized route comparison: `after/`; GET-only production comparison: `public/public-summary.json`, retained trace and log.
- Full combined acceptance follow-up: `audit-artifacts/release-resume/webkit-hydration-investigation/` (fresh directory, not replacement of historical evidence).
- Sequential full combined retry: `audit-artifacts/release-resume/webkit-hydration-sequential/`.
- Focused browser results and success/failure traces: `audit-artifacts/webkit-investigation/regression-webkit/`, `regression-webkit-fresh/`, `regression-firefox/`, `regression-chromium/`.
- Native browser/runtime distinction: `audit-artifacts/webkit-investigation/native-comparison/*-native.json`, log and retained trace.
- Failed expanded component run and unchanged sequential retry: `component-suite-after.log`, `component-failures-sequential-retry.log`.
- Timed-out journey lifecycle summary: `failed-journey-loading-summary.json`; stale fixture diagnosis: `registration-failure-summary.json`; source hashes: `verified-source-inventory.json`.
- Aggregated final browser/axe/loading results: `audit-artifacts/webkit-investigation/final-verification-summary.json`.

Raw browser traces and development diffs may contain synthetic test identities, local session cookies, diagnostic request bodies or private headers. They remain in ignored local evidence and require separate publication review. This report prints no credentials, tokens, cookie values or customer records.

`verified-source-inventory.json` records SHA-256 values for the four investigation source/test files and confirms every source/test file in the prior release source snapshot remains byte-identical. It also verifies the acceptance mirror differs from the original only by its diagnostic fixture import: assertions and timeouts are unchanged. The accepted six-file cleanup and timeline implementation were not repeated or changed. Next's development run regenerated a tracked TypeScript configuration; its previously clean content was restored directly from the baseline without changing the Git index or history. Final checks confirm HEAD is unchanged, the staged index is empty, `git diff --check` passes, the TypeScript configuration has no remaining diff, and the remaining tracked changes consist of the pre-existing work plus the listed StoreProvider fix. The new report/tests remain uncommitted; ignored private evidence is retained.

## 6. Remaining risks and Packaging recommendation

**PASS WITH CONDITIONS for this local investigation and review; unconditional Packaging/production acceptance is not granted.** The confirmed hydration defect has a minimal application fix, a red/green component regression, 36 passing hydration browser cases across three engines, and a passing full combined WebKit journey with zero hydration errors. The observed access-control group is classified as a native cancellation/test-navigation artifact with supporting request/runtime evidence; no API access-control patch is justified. No confirmed application P0/P1 was established in this investigation.

The original broad component and combined-browser failures are retained alongside successful unchanged retries. Run browser acceptance sequentially with adequate host memory; do not conceal the failures, increase timeouts or globally suppress access-control messages. Historical repeated-navigation loading timeout causality is still unproven; this hydration fix must not be represented as its verified root cause. Owner review of the local patch and release evidence remains required before Packaging, and separate authorization is required for any commit or deployment.

Real-device Safari/Android, screen-reader, native zoom/keyboard/safe-area, deployed authenticated behavior/performance, historical P2 layout findings, and operational backup/restore evidence remain owner release conditions from the existing reports. In particular, the owner should check actual Safari account/history hydration on the reviewed candidate and confirm authentication/refresh under approved deployed test-session conditions; the GET-only production comparison cannot certify these. Automated axe results do not certify WCAG compliance. No Packaging work was started.
