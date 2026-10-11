# V1 final pre-packaging UI/UX cleanup

Phase 2 implementation is complete within the approved six application files. Current results and limitations are recorded below; the Phase 1 section is retained as the original inspection and approval boundary.

## Phase 1 inspection — approval required before implementation

Inspected 11 October 2026. Baseline HEAD: `d1d293b106232283c11f5e76fc16feca41a1db55`. Initial working tree was clean. This report is the only change made in this phase. No application changes, test execution, new screenshots, commit, push, deployment or packaging were performed.

Read the Stage 15.7 final production acceptance report, manual UAT checklist and AI visibility fix report. No prior pre-packaging cleanup report was found. Reviewed current customer cart, order-history controls, configurator, account navigation/hash handling, authentication/Profile/Security feedback, Admin order filters/summary/detail and product forms, plus all three drag-and-drop implementations and existing test coverage. Retained screenshots and WebKit diagnostic results were reviewed as historical evidence; they are not screenshots of this current HEAD.

The owner's desktop/iPhone visual review is acknowledged. The historical UAT checklist still says “not executed”; its unchecked items cannot be treated as completed without named revision/device/outcome evidence.

## Findings matrix

Severity: P1 potentially blocks a normal journey; P2 materially affects usability; P3 polish. No P0 was established. Static inspection and historical tests do not constitute fresh browser verification.

| ID / pages | Severity | Disposition | Evidence and justification | Coverage / regression risk |
| --- | --- | --- | --- | --- |
| C-01 mobile cart | P3 | FIX | Item card combines `p-4`, `gap-y-4`, a full-width divider and `pt-3` above quantity/price. Retained 390px cart shows this redundant separation. Reduce mobile spacing and divider emphasis only; retain image, complete modifiers, price, remove action and 44px quantity/remove controls. Large blank space below a single item is the flexible drawer body, not excess card padding. | Existing cart feedback and checkout browser tests; new multi-item/long-modifier geometry checks needed. Low risk if CSS remains mobile-only. |
| C-02 mobile order history | P2 | FIX | Both status and sort use `flex-wrap`; retained 320px capture shows three status rows and two sort rows, with first order starting around 800px down the full page. Use separately labelled horizontal mobile control rows with nonshrinking items, visible scroll affordance and focus clearance; retain desktop wrapping. Preserve links, query parsing, status/sort/page values and reset-to-page-1 behavior. | Existing history browser regression covers URL/history state. Add last-control keyboard visibility and Back/Forward checks at 320/390px. Moderate accessibility/layout risk. |
| C-03 configurator | P2 if reproduced | VERIFY ONLY | Current dialog has a bounded viewport shell, scrollable content, mobile sticky heading, persistent close and separate purchase footer. Existing safe-area CSS is present. No new clipping defect established. Verify long options, heading/price visibility and selected/scrolled states at all requested widths. | Existing storefront/configurator and acceptance tests; long-text fixtures and fresh browser geometry required. Avoid changing accepted layout on source assumptions. |
| C-04 account navigation | P3 | VERIFY ONLY | One shared navigation selects Orders for history/detail paths, Security for `#security`, otherwise Profile. `aria-current="location"` is valid for hash sections. Hash/popstate subscriptions and heading focus already exist. No scroll observer needed. | Existing account-navigation test checks Profile/Security current semantics. Extend/verify Orders detail, mobile layout, modified-click and Back/Forward. Low risk; no proposed implementation. |
| C-05 Login/Register | P2 historic layout stability | VERIFY ONLY | Existing invalid-field and server-error focus, busy guards and associated errors are present. Official Google artwork/OAuth remain intact. Stage 15.7 recorded CLS above 0.1; contributing causes were candidates, not a completed diagnosis. | Existing auth/component/browser coverage. Re-measure loading/Google transitions before proposing space reservation; avoid blind changes. |
| C-05 Profile/Security validation | P2 | FIX | Both handlers return immediately on validation errors without focusing the invalid field. Fields have associated error text, but errors may be offscreen after submit. Match existing authentication behavior with form-local first-invalid-field focus and immediate scroll; keep current status/alert feedback without adding duplicate live regions. | Extend `customer-account.test.tsx` for focus, invalid input, loading, success and failure. Low/moderate risk; ensure open disclosure and reduced-motion-safe scrolling. |
| A-01 Admin Orders toolbar | P3 | FIX | Disabled “Filters” button has no handler or V1 purpose. Existing search, fulfillment/status toggles and Clear already implement filtering. Remove the inert control and its unused icon; preserve all actual filters. | Existing Admin semantics/correctness coverage; add absence assertion and verify active/clear states. Low risk. |
| A-02 Admin Orders metrics | P3 | FIX | Five cards use a two-column mobile grid (three rows), p-4 content and generous count/helper margins. Reduce mobile padding/gaps and internal margins while retaining all labels/counts/helpers; preserve larger layouts. Exact visual result requires fresh captures before implementation. | Add metric-preservation assertions and browser geometry at 320/390/768px. Low risk; do not hide metrics or replace the grid with another dashboard. |
| A-03 Admin mobile filters | P2 if reproduced | VERIFY ONLY | Current controls are nonshrinking buttons in an overflow-x row with `aria-pressed`, desktop wrapping and existing focus styling. Discoverability/focus clipping require actual browser tests. Search currently relies on placeholder text rather than an explicit label. | Verify keyboard scrolling/selected states; recommend adding an explicit accessible search name as a small confirmed semantic correction alongside A-01. Low risk. |
| A-04 category/group/option ordering | P2 if reproduced | VERIFY ONLY | All three use `KeyboardSensor` and `sortableKeyboardCoordinates`. Handles are buttons with labels, attributes/listeners and activator refs. Order changes are applied on drag end; cancellation does not commit a reorder. Existing library defaults provide instructions/announcements, but actual focus restoration and useful spoken content are not certified. | Fresh Space/arrow/drop/Escape/save tests needed for each level, including nested contexts. Do not add another sensor or replace the library. Speech remains manual. |
| A-05 product forms — AI | — | ALREADY FIXED | Shared basic-fields gate uses `useAdminAiAvailability`; existing flag plus explicit backend boolean is required, and failure defaults hidden. Backend capability is already implemented. | Prior focused web/API tests passed per AI report; rerun visibility tests only. No endpoint changes. |
| A-05 product forms — layout/save | P2 if reproduced | VERIFY ONLY | Responsive grid, inline validation, ordinary document-flow save/cancel footer and pending button disablement exist. Option editor does not receive the parent submitting state; editing during a pending save needs targeted reproduction before a fix recommendation. | Fresh long-form/validation/pending-save/reachability tests needed. No backend changes. |
| A-05 product forms — unsaved departure | P2 potential data loss | DEFER | No dirty-state departure guard found in inspected editor code. Adding route/unload interception would introduce interaction behavior beyond a small styling cleanup. Record existing behavior and request separate scope if owner requires protection; do not invent a router guard in this phase. | Verify cancel/navigation behavior and document limitation. A new guard has moderate routing/browser risk. |
| A-06 Admin order detail | P2 if reproduced | VERIFY ONLY | Master/detail card uses desktop sticky positioning; content follows document flow, footer is sticky on mobile. No confirmed unreachable content established. Preserve design, verify tall orders/notes and footer reachability on short screens. | Existing order correctness tests do not prove scrolling. New viewport/long-content browser check required. |
| Release: repeated WebKit navigation | Potential P1 | BLOCKED | Retained checkout failure lacks “Full name” after 10s; another no-axe run later stalls at session loading. Isolated checkout records four ready visits (~1.2–2.4s), no errors/failed requests. These passes do not establish or eliminate the repeated-run cause. | Requires reproducible guarded local multi-engine journey, request/console/loading-state diagnostics, then matching native Safari evidence. Do not increase timeout or blame axe without evidence. Stop for owner review if a normal checkout stall reproduces and requires work beyond scope. |
| Historic enlarged header / auth CLS | P2 | VERIFY ONLY | Stage 15.7 retains 320px plus 200% root-font overflow and reproducible auth CLS. Current baseline has not been measured here. | Native zoom/text settings and new measurements required; no global header redesign proposed. |
| Historic hero generic-div label / tracking skeleton | P3 | DEFER | Stage 15.7 documents generic-div `aria-label` and fixed-height loading skeleton issues. Outside the requested focused areas; no newly confirmed customer obstruction. | Preserve historical findings and existing evidence. Do not silently expand scope. |
| Real-device speech, native zoom, production performance/configuration | Acceptance conditions | BLOCKED | No new operator/device/screen-reader evidence was provided in this request. | Requires named manual evidence. Desktop Playwright WebKit is not iPhone Safari. |

## Recommended implementation boundaries and complexity

Approve the following narrow batch first. Estimates are relative complexity, not guaranteed elapsed time.

1. **Low:** mobile cart spacing in `apps/web/src/features/cart/components/cart-drawer/cart-item-row.tsx`. Preserve drawer/footer/safe-area structure and all touch targets.
2. **Moderate:** mobile-only status/sort rows in `apps/web/src/features/customer-orders/customer-orders-page.tsx`. Preserve URL-backed link behavior; verify horizontal discoverability, focus outline and last-item reachability.
3. **Low:** first-invalid-field focus in `apps/web/src/features/customer-auth/components/customer-account-profile.tsx` and `customer-password-form.tsx`; keep existing error/status announcements.
4. **Low:** remove inert Filters and name search in `apps/web/src/features/admin-orders/components/admin-orders-filters.tsx`.
5. **Low:** mobile-only metric spacing in `apps/web/src/features/admin-orders/components/admin-orders-summary.tsx`.

Expected application inventory is those six files. Extend relevant existing component/browser tests where practical, with any new narrowly scoped test/evidence paths documented before final handoff. No shared tokens, API, business behavior, dependency or AI capability changes are proposed. Additional fixes require a reproduced defect and explicit scope review rather than automatic expansion.

Verification is moderate overall; WebKit investigation is uncertain and may reveal a release blocker. Start its diagnostics before spending the full polish budget. Use only the existing guarded local test database/server wrappers; if services or safe configuration are missing, record the blocker without bypassing guards.

## Before/after and screenshot inventory

Phase 1 has no after state. Historical before references inspected visually:

- `docs/stage-15.7-evidence/chromium/cart-390.png`: single-item card separation and flexible blank drawer area.
- `docs/stage-15.7-evidence/states/orders-320.png`: wrapped status/sort rows and list position.

Retained configurator/checkout evidence and source were reviewed for existing layout safeguards. Fresh baseline captures at current HEAD remain required after approval, before any visual edit. Capture matching before/after at 1440, 390, 320 and relevant 768px widths, including multi-item/long-modifier cart, status/sort selected and keyboard-scrolled states, all metrics and toolbar active/clear states. Add initial/scrolled configurator, long Admin detail, form validation/loading/error captures for verification even if unchanged. Preserve all existing evidence; no pixel-diff or current deployed equivalence claim is made.

## Test plan and results

**Current Phase 1:** inspection only; no fresh automated test results claimed. Previous AI report records 31 focused tests plus successful typecheck/lint/build; Stage 15.7 historical acceptance records 55 Chromium regression cases and separate engine diagnostics. Neither establishes current full release acceptance.

After approval: focused component suites for changed controls and feedback; existing AI visibility and assistant suites; browser cart/configurator, history URL/Back/Forward, account/auth, Admin ordering/forms/detail and checkout regressions; repeat long WebKit navigation with retained trace/request diagnostics. Then web/API TypeScript as appropriate, lint and production builds using safe local configuration. Check reduced motion, keyboard focus, minimum targets, horizontal overflow, fixed action clearance and Customer/Admin theme boundaries. Do not treat an unavailable service as a pass.

## Outstanding severity and recommendation

- **P0:** none established.
- **P1:** repeated-navigation WebKit loading remains a potential release blocker pending diagnosis; no confirmed new P1 found by this static audit.
- **P2:** mobile history density, Profile/Security error focus; historic auth CLS/enlargement overflow and potential unsaved product departure remain recorded.
- **P3:** cart/metric density, inert Admin Filters control, search naming and historical deferred semantics/skeleton findings.

**Phase 1 recommendation: PASS WITH CONDITIONS for proceeding to the approved cleanup batch, not for production release or packaging.** Complete fresh browser verification and resolve or explicitly disposition remaining manual conditions. The six-file application batch is proposed only; stop here for approval before modifying application code.

## Phase 2 — implementation and verification

Implemented the approved batch only. No backend, endpoint, schema, dependency, business-rule, theme-token or AI capability changes. No confirmed new P0/P1 was found in available tests. Existing WebKit repeated-navigation loading remains open, potentially P1; no fix is claimed.

### Exact changed-file inventory

| File | Change and purpose |
| --- | --- |
| `apps/web/src/features/cart/components/cart-drawer/cart-item-row.tsx` | Mobile padding 16→12px and row gap 16→8px; divider/top padding retained from `sm` upward. Product image/modifiers/actions/quantity/price preserved. No drawer/footer change. |
| `apps/web/src/features/customer-orders/customer-orders-page.tsx` | Mobile status and sort rows scroll horizontally; links do not shrink, 4px inset protects focus, visible “Scroll for more” text supports discoverability. `sm` upward retains wrapping. Status/sort/page link generation is unchanged. |
| `apps/web/src/features/customer-auth/components/customer-account-profile.tsx` | After client validation fails, capture the submitting form and focus/scroll its first invalid field on the next frame. No initial-load or server-response focus. |
| `apps/web/src/features/customer-auth/components/customer-password-form.tsx` | Same form-local validation focus for Current/New/Confirm fields. Values, messages, API/session behavior unchanged. |
| `apps/web/src/features/admin-orders/components/admin-orders-filters.tsx` | Remove permanently disabled Filters and unused icon; add accessible search name “Search orders, customers or items”. Existing actual filter callbacks remain. |
| `apps/web/src/features/admin-orders/components/admin-orders-summary.tsx` | Mobile grid gap 12→8px, padding 16→12px, count margin 8→4px and bottom margin 20→16px; original spacing restored at `sm` upward. All metrics/helpers remain. |
| `apps/web/test/customer-account.test.tsx` | Tests first and subsequent invalid fields in document order for both forms; assert no API submission and preservation of entered values. |
| `apps/web/test/pre-packaging-layout.test.tsx` | Focused content/action/URL/label/metric regression and optional isolated DOM fixture capture. Uses synthetic data and mocked history query/navigation. |
| `apps/web/test/browser/pre-packaging-layout.audit.ts` | Opt-in Chromium render checks and screenshots using captured DOM and production CSS. All browser requests are fulfilled from a local image or aborted; no API, credentials or database. Checks overflow, cart touch geometry, last-choice keyboard visibility, reduced motion and larger-screen geometry. The audit extension keeps fixture-only checks out of standard regression discovery. |
| `apps/web/playwright.cleanup.config.ts` | Explicit isolated capture-audit configuration without servers or database. |
| This report | Actual results, evidence, reproduction and remaining release conditions. |
| `docs/v1-pre-packaging-cleanup-evidence/` | 36 fresh PNG captures, geometry JSON and SHA-256 screenshot manifest. Synthetic component evidence; no customer data or private traces. |

Local ignored infrastructure: `audit-artifacts/pre-packaging/playwright.config.ts`, baseline CSS, before/after DOM captures and browser output. Retain these for reproduction; no cleanup or archival performed. No existing Stage 15 evidence was altered.

### Before/after comparison

These are isolated component captures at current baseline/edited source, not full authenticated pages or a deployed visual audit. Before HTML was captured before the six edits; before CSS came from the existing optimized baseline build. After HTML and CSS use the edited sources/production build. The same data and font fallback are used for each pair; font requests are blocked in this isolated harness. Heights include the fixture's 32px wrapper padding and margins, so they are comparison measurements rather than standalone card heights.

| Area | 320px height before→after | 390px height before→after | 768 / 1440px |
| --- | --- | --- | --- |
| Cart item | 247→218px | 207→178px | 219 / 219px unchanged |
| History | 899→759px | 815→727px | 675 / 683px unchanged |
| Admin metrics | 430→382px | 430→382px | 454 / 178px unchanged |
| Admin toolbar | 254→254px | 254→254px | 214 / 170px unchanged; inert control removed |

Representative comparisons: [cart before](v1-pre-packaging-cleanup-evidence/before/cart-390.png), [cart after](v1-pre-packaging-cleanup-evidence/after/cart-390.png); [history before](v1-pre-packaging-cleanup-evidence/before/history-320.png), [history after](v1-pre-packaging-cleanup-evidence/after/history-320.png); [metrics before](v1-pre-packaging-cleanup-evidence/before/admin-metrics-320.png), [metrics after](v1-pre-packaging-cleanup-evidence/after/admin-metrics-320.png).

Screenshot inventory: `before/` and `after/` each contain `cart`, `history`, `admin-toolbar`, `admin-metrics` at 320, 390, 768 and 1440px (32 total). `after/history-keyboard-{width}.png` adds four focused/scrolled captures. See `manifest.json` for exact paths/bytes/hashes and `geometry.json` for all measurements. After mobile history initially shows the start of each scroll row; a selected choice farther along remains represented by its existing current-state attributes and is reachable by scrolling/keyboard. No automatic focus or new scroll observer was added.

### Actual validation results

- Baseline fixture component run: **4 tests passed** before application edits.
- Focused component regression: **7 suites, 36 tests passed**, covering account feedback/navigation, cart feedback, Admin semantics/correctness, AI visibility and the new layout checks.
- Isolated Chromium browser check: **1 passed**, repeated after adding height/reduced-motion assertions: **1 passed**, and rerun through the final opt-in configuration: **1 passed**. All four widths had no document overflow; cart buttons measured at least 44×44px; Tab reached the last status and sort links and scrolled them into the viewport. Relevant 768/1440px component heights match the baseline exactly.
- Web TypeScript (including component/browser tests), full web lint, targeted new-test lint, API TypeScript, web production build and API production build: **passed**. Web build used the existing local API-origin/browser-production override, without production requests.
- Full web Jest regression: **40 suites, 307 tests passed**.
- `git diff --check`: passed at verification time.

An initial fixture assertion incorrectly required literal `page=1`; the existing URL helper deliberately omits default values. Corrected the test to check the parsed default page without changing URL behavior. Initial test typecheck identified a missing fixture `total`; corrected synthetic data, then reran typecheck. These were test-authoring failures, not application failures or weakened regressions.

### Blocked end-to-end checks and remaining conditions

Attempted `pnpm test:browser customer-account.spec.ts`. The existing guard stopped **before reset/connection** because configured `DATABASE_URL` is outside the destructive-test allowlist. `docker info` also reported the local daemon pipe unavailable. No guard was bypassed, no environment file modified, and no production data touched.

Consequently real application Chromium cart/sticky checkout, history Back/Forward and query refresh, authenticated validation focus in a native page, checkout journey and full Customer/Admin theme isolation are **not newly end-to-end verified**. Component assertions preserve URL construction and current-state semantics; static browser fixtures cannot prove React routing, authentication or sticky drawer behavior. Existing footer/safe-area code was left untouched. Isolated metrics/toolbar captures prove sampled rendering, not a complete dashboard. Reduced-motion CSS duration was checked; native form/keyboard/device behavior still requires its normal environment.

WebKit repeated navigation is **not reproduced or resolved in this phase** because its guarded application environment is unavailable. Its retained checkout/session loading failures remain a release condition and potential P1. No timeout was increased, no failing test skipped, and no historical outcome rewritten. Physical Safari/Android, actual screen-reader speech, native zoom, production performance/configuration, historical auth CLS/enlargement issues and unsaved product departure remain as documented in Phase 1. Complete the blocked Chromium journeys and repeated WebKit diagnostics on guarded `orderly_test` before release acceptance.

### Reproduction and recommendation

Capture edited component DOM with `ORDERLY_CLEANUP_CAPTURE_PHASE=after pnpm --filter web test --runInBand pre-packaging-layout` (set the environment variable in the invoking shell on Windows), build web against the permitted local API origin, then run `pnpm --filter web exec playwright test --config playwright.cleanup.config.ts`. The browser comparison also requires preserved baseline DOM/CSS under `audit-artifacts/pre-packaging/before`; this is not a fresh-clone standalone end-to-end suite. It fails if required capture inputs are missing and intentionally has no external services. The standard browser wrapper must still run separately when safe local infrastructure is available.

**Phase 2 recommendation: PASS WITH CONDITIONS for review of this scoped cleanup. Production release and Packaging remain conditional on the blocked regressions and unresolved potential P1 WebKit issue.** No commit, push, deployment or Packaging started. Stop here for review.

## Final pre-packaging release verification — 11 October 2026

**Release recommendation: NOT CLEARED for Packaging.** Cleanup code review remains accepted with conditions, but the missing timeline connector implementation, unavailable guarded browser infrastructure and unresolved potential P1 WebKit loading issue prevent verification closure. No new application defect was confirmed by this blocked run. This is not a production-readiness certification.

### Cleanup and timeline closure

Verified HEAD `d1d293b106232283c11f5e76fc16feca41a1db55` plus the **uncommitted** six-file Phase 2 cleanup and focused tests/configuration. HEAD alone does not represent that cleanup. Reviewed the six-file diff against the approved implementation: mobile spacing, horizontal history rows, validation-only focus and Admin toolbar/metrics remain unchanged. No application file was edited during this verification. Current source SHA-256 values are recorded below for future exact comparisons; no earlier source-checksum receipt existed, so continuity with code review is based on diff/source review rather than a claim of comparison to an earlier hash receipt.

| Approved application file (relative to `apps/web/src/features/`) | SHA-256 |
| --- | --- |
| `cart/components/cart-drawer/cart-item-row.tsx` | `e104905ed561ec83fbe107e5adc49920ffceb0e7e27bd2212ad4af862221cde7` |
| `customer-orders/customer-orders-page.tsx` | `b779be1c7d7e6753f8262b54c349dac08cf8d27bc22afea35074aabbb2a2016e` |
| `customer-auth/components/customer-account-profile.tsx` | `5fda656e8a0175541eab059141b0b30f7f1406f1e22ba74cf4c8d068cd39f5da` |
| `customer-auth/components/customer-password-form.tsx` | `863c1f8901e3f10e292204046eb91420b9a041a44f125d9c92182ef11a456240` |
| `admin-orders/components/admin-orders-filters.tsx` | `5a4eaf35b55fb661d13af7d2004469a9137b5615d330e4e19a4f33872113cf7e` |
| `admin-orders/components/admin-orders-summary.tsx` | `20453cf2e78b3fc581ae15b41deaeea34bfea6d6f469d15ca9328d0a363d5ba8` |

**Order Progress Timeline connector fix: missing.** `apps/web/src/features/order-tracking/components/result/order-status-timeline.tsx` renders steps/circles/text but has no connector element, pseudo-element utility or associated connector CSS. Its latest path-specific commit is `8438b67` (Stage 15.6); no timeline working-tree diff exists. Search of related tracking/history styles and documentation found no connector implementation report. The separate approval's implementation specification is not present in this conversation. Missing status was reported before further environment verification; no timeline fix or broadened implementation was attempted.

Rehashed all **36** existing cleanup screenshots against `v1-pre-packaging-cleanup-evidence/manifest.json`: **zero mismatches**. Existing screenshot, trace and diagnostic evidence was only read, not regenerated, moved or altered.

### Safe environment inspection and actual commands

| Command/check | Result |
| --- | --- |
| `git status --short`, `git rev-parse HEAD`, six-file `git diff`, timeline `git log -1 --format='%h %s' -- <path>` | Same baseline HEAD; six approved application changes remain uncommitted; no staged changes. Timeline connector absent. |
| `docker info --format '{{.ServerVersion}}'` inside sandbox | Exit 1: configuration access restriction plus unavailable daemon pipe. |
| Same Docker command outside sandbox | Exit 1: `dockerDesktopLinuxEngine` pipe absent. Confirms daemon unavailable independently of sandbox configuration access. No container started or configuration changed. |
| Sanitized Node inspection of process variables and `apps/api/.env` | Process overrides absent; `TEST_DATABASE_URL` comes from API env, targets loopback `orderly_test`, but required `schema=public` is absent/nonmatching. Regular/direct database variables target another local database and are not allowlisted for destructive tests. Values, credentials and exact non-test database identity withheld. |
| `pnpm test:browser` | Exit 1 at `createSafeTestDatabaseEnvironment`: destructive reset denied because rewritten test `DATABASE_URL` is outside allowlist. Failed **before reset, seed, connection, builds or any browser suite**. |
| `node --version`, `pnpm --version`, `pnpm --filter web exec playwright --version` | Node 24.16.0; pnpm 10.14.0; Playwright 1.62.1. |
| Read-only headless launch/version/close via installed Playwright for Chromium, Firefox and WebKit | Chromium 151.0.7922.34, Firefox 153.0, WebKit 26.5; all three engines launch. This is an engine smoke check, not application regression. |
| Screenshot manifest SHA-256 verification | 36 files checked, zero mismatches. |
| `git diff --check` | Passed. |

The initial sanitized inspection used a nonexistent `apps/api/test/.env` path and failed without reading values; corrected to the guard's actual `apps/api/.env` source. No environment file or database URL was changed. The existing guard requires loopback `orderly_test`, public schema, matching Prisma targets, `NODE_ENV=test` and absence of deployment markers. No alternative database was tried and no guard bypassed.

Infrastructure restoration must supply the existing Docker/local test service and a valid allowlisted test configuration before rerunning. Because the daemon remains unavailable, stop that portion here; changing environment settings alone would not establish a safe running service. Do not replace this with a staging/production connection.

### Browser regression coverage status

**Zero application browser tests executed in this verification turn.** Storefront/configurator/cart, checkout/confirmation, auth/account, history/tracking, Admin order/menu workflows, URL history, native focus and responsive application behavior remain blocked. Do not count headless engine launches or the prior isolated fixture captures as these regressions.

The standard config supports Chromium; `playwright.acceptance.config.ts` defines Chromium/Firefox/WebKit projects for the supplemental customer acceptance suite and inherits the same guarded application setup. These are different coverage scopes: the multi-engine acceptance suite is not a full Admin/customer business regression in all three engines. Admin menu keyboard ordering/product forms still need their requested workflow coverage assessed once infrastructure is restored. No config/timeouts/tests were changed here.

### WebKit repeated-navigation investigation

Classification: **intermittent unresolved issue; current reproduction blocked by test infrastructure.** The infrastructure blocker is established for this run, but is not proven to be the root cause of the historic WebKit issue.

Reviewed retained failure contexts: `stage-15.7-evidence/webkit-rerun-failure/.../error-context.md` and `webkit-second-run-failures/.../error-context.md` record checkout “Full name” missing at 10 seconds; `webkit-no-axe.log` records an empty-history heading timeout. The Stage 15.7 report records checkout skeleton/session-bootstrap loading. `webkit-checkout-isolation.json` records four successful visits at 1440/768/390/320px (1649/1482/1239/2378ms), with no recorded errors/failed requests. These observations establish neither a deterministic application defect nor resolution, and they do not justify blaming axe.

No fresh customer navigation could run, so there is **no new trace, console-error capture, failed/pending-request inventory, session/bootstrap state, navigation timeline or loading-duration measurement**. Existing failure traces remain at `stage-15.7-evidence/webkit-rerun-failure/` and `webkit-second-run-failures/`; originals are preserved. Fresh evidence must use a new output directory, retaining console/page errors, request starts/completions/failures and pending ages, relevant non-secret bootstrap states and navigation/loading timestamps. Do not capture cookie/token values. Repeat the original multi-visit journey with unchanged assertions; compare isolated visits and instrumented/uninstrumented runs. A timeout's actual state and requests must be retained, not converted to a pass.

If normal checkout reproducibly stalls, report its minimal root cause/fix proposal as P1 before touching application code. No root cause or application patch is proposed from the currently insufficient evidence.

### Remaining conditions and handoff

- **P0:** none confirmed.
- **Potential P1:** WebKit repeated-navigation checkout/session loading unresolved; normal-journey reproduction remains required.
- **Verification blocker:** Docker/test configuration prevent application browser regression.
- **Cleanup closure blocker:** separately approved timeline connector fix has not been implemented; obtain its exact specification/implementation separately.
- **P2:** historical auth CLS/enlarged-header overflow and unsaved product departure remain recorded. Phase 2 focus/history changes passed previous component/fixture checks but await full application browser closure.
- **Manual gaps:** owner's visual iPhone review does not by itself certify repeated Safari navigation, soft keyboard/safe areas, VoiceOver/NVDA, native zoom, Android or production performance/operations. Obtain named revision/device/outcome evidence rather than changing the historical unchecked checklist automatically.

Only acceptance documentation was updated in this verification turn. No new features, UI/application changes, dependencies, database/environment changes, commit, push or deployment. Stop with release verification **blocked**, preserving the prior Phase 2 conditional code acceptance.

### Subsequent approved narrow unblocking

The separately approved timeline connector implementation is now complete; see [Final release unblocking](v1-final-release-unblocking-report.md) for its focused tests and new before/after evidence. The earlier “missing” finding above is historical and superseded for that item. The six cleanup application files remain unchanged. Docker/test-schema blockers and unresolved WebKit loading still prevent release clearance; no production readiness or application regression pass is claimed.

### Resumed release verification outcome

The [latest final release results](v1-final-release-unblocking-report.md#resumed-final-release-verification--actual-results) supersede the infrastructure blockers above: Docker and the guarded local schema configuration are restored; Chromium passed 61 application cases, Firefox 6 acceptance cases, isolated WebKit 7 and combined WebKit 4, with only existing engine-specific skips. The historical loading timeout was not reproduced. WebKit access-control/hydration findings and real-device/deployment/operations acceptance remain conditions. Cleanup/timeline application files and all 84 retained screenshots are unchanged. No Packaging, commit, push or deployment performed.
