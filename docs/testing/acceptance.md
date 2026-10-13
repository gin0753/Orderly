# Acceptance evidence and chronology

Consolidated 13 October 2026. This page records earlier scoped executions; no application suite or production flow was rerun for documentation hygiene. Counts belong to the named revision/run, are not added together across repeats and do not prove live provider behavior.

## Current references

[Registration-mode evidence](registration-modes.md) records the latest README-cited scoped local results: 164 API unit cases across 16 suites, 188 PostgreSQL integration cases across 14 suites, 342 component cases across 47 suites, and 45 selected optimized Chromium cases (3 direct-registration, 37 Security 2B, 5 presentation), with zero retries. Lint, application/test typechecking and API/web builds passed at that checkpoint.

[Security findings](../security/security-acceptance.md) retain the original failed runs and later F-04/F-15 closure. [Release audit](../portfolio/final-release-report.md) records production deployment metadata and owner dashboard confirmation at `81da702`, source equivalence of the portfolio candidate, and owner-confirmed functional UAT. Its exact date/devices/per-flow provider matrix were not supplied. [Exposure gate](../portfolio/final-release-gate.md) is bounded privacy/release assessment, not a fresh full security audit.

## Earlier checkpoints and failures

| Date / source boundary | Recorded result | Failure and interpretation |
| --- | --- | --- |
| 7 October, baseline `479392f` plus acceptance fixes | 150 API unit, 118 integration, 228 components and 38 Chromium workflows; complete quality gate and Docker image build passed | Initial web run 226/228; initial integration run 73/117 with competing-resource initialization and fixture throttling; later complete reruns passed. Initial complete browser gate had failures; do not recast its fragments as a clean run. |
| 8 October P2 follow-up | 150 unit, 118 integration, 235 components and 38 browser workflows; complete `test:quality` exited 0 | Focused checkout boundary and private-response cache findings resolved; 20 focused web and 19 focused integration cases passed. Ready for production UAT, not unconditional release approval. |
| Stage 15.7 historical acceptance | 292 components, 150 API unit, 121 integration and 55 Chromium regressions passed in earlier run; 210 final axe scans, 70 per engine | Combined audit 8 passed / 2 failed / 2 skipped; incomplete axe rules remained manual findings. Initial Firefox text-enlargement overflow and WebKit loading/keyboard failures are retained. PASS WITH CONDITIONS. |
| C1–C3 source validation at `85d9046` | C1 recorded 54 passing unique Chromium cases | Storefront decode timeout prevented a complete runner pass. C2 browser confirmation and C3 multi-engine execution blocked when Docker/Postgres became unavailable. Historical evidence cannot certify those newer commits. |
| 11 October resumed release verification | 61 Chromium cases; Firefox/WebKit isolated and combined comparisons; 210 scans without reported violations | Historical loading timeout not reproduced; WebKit retained 13 hydration and 12 native access-control errors. This was not clean console/native Safari acceptance. |
| 11 October hydration investigation, baseline `d1d293b` plus cleanup | Red/green store hydration test; 36 hydration cases across three engines and 45 total focused browser cases passed; sequential combined WebKit retry 4 passed / 1 existing skip | Earlier broad component/combined browser attempt failed under host pressure; stale fixture caused a WebKit 409; unchanged sequential retries/fresh fixtures passed. Historical repeated-loading cause still unproven. |
| 12 October image investigation, baseline `98d4790` | Corrected production storefront 24/24 (three repetitions), local development-mode comparison 24/24, image components 30/30 | Uncorrected 21 passed / 3 failed. Full selection plus continuation 60 passed / 1 failed was complete coverage, not an uninterrupted green gate; failure was separate logout synchronization. |
| 12 October logout correction | Complete production regression 11 suites / 62 cases; 121 API integration, 23 focused API unit and 27 web component cases passed | Two exploratory cancellation diagnostics timed out; those failures did not prove where a request was aborted. Ordinary Menu navigation and completed revocation passed. |
| 12 October registration fixture correction, baseline `5ed14b8` | Production Security 2B 8 suites / 37 cases and local CI-mode account 4/4 passed | Old fourth fixture timed out at removed `/register` Password field; fixture-only full-file retry exposed separate premature logout navigation, failing first case with three not run. Both failures precede final complete passes. |

The older stage reports remain compatibility references where the unchanged held report requires them. The historical [C4 handoff](../c4-acceptance-publication-handoff.md) and [scan catalog](../c4-public-axe-scan-catalog.json) retain individual original IDs/hashes without requiring permanent raw DOM publication. Retired originals are not promised durable retrieval under the [owner's revised policy](evidence-retention.md).

## Guarantees represented by source and regression tests

The baseline acceptance fixes corrected displayed delivery fees and server-calculated totals, nonblank contact/address and optional-note validation, successful-order cleanup when browser storage fails, concurrent Admin transitions and idempotence, and persistence failures during Admin login/refresh/logout. API pricing reloads catalog selections and snapshots prices/items transactionally. Atomic sequence numbers are unique rather than gapless. Owner-scoped history reads, receipt proof, private-cache headers, session replay/revocation and checkout/deletion coordination remain current requirements. Later email-verification/deletion reports supersede older contact-only tracking and credential-establishment assumptions.

Real database tests prove behavior on their guarded synthetic PostgreSQL target. Browser OIDC/mail fixtures prove application behavior, not real inbox delivery or Google's production freshness. CI runs quality/build checks and retains only scoped sanitized image diagnostics; its development server mode differs from local optimized-build acceptance. Node 24/Windows observations are not automatic Ubuntu/Node 22 certification.

## Remaining acceptance

Use [manual UAT](manual-uat.md) and [release guide](../operations/release-guide.md). Real Resend domain/inbox/fragment-link/replay/recovery, Google fresh-auth deletion, backup/restore and populated migration/cutover, deployed log redaction, focused Firefox/Safari/real-device assistive checks, metadata-cleanup ownership and process-local throttling limitations remain visible. Direct registration is unverified identity. Owner functional UAT does not retroactively check old device/provider boxes. No payment, public Admin access or whole-site WCAG compliance is claimed.

## Stage 15 scoped validation detail

These extracts preserve original stage scopes and initial failures, rather than summing stage totals. Source documents are tracked at `9c33c3482b81d48607559201797f5f77524ae489`; they are historical observations, not a run on the hygiene working tree. Command excerpts below are original execution records, not current instructions to write into retained docs; use the ignored per-run output described in [UI regressions](ui-regressions.md#generating-new-evidence).

### Stage 15.2

Original document ID: `docs/stage-15.2-premium-design-system-foundation.md`.

| Check | Final result |
| --- | --- |
| `pnpm --filter web test --runInBand` | 34 suites, 262 tests passed |
| `pnpm --filter web typecheck` | Application and test TypeScript checks passed |
| `pnpm --filter web lint` | Passed |
| `git diff --check` | Passed |
| Production `pnpm test:browser` with `ORDERLY_BROWSER_PRODUCTION=1` and local guarded `TEST_DATABASE_URL` | All 44 Chromium tests passed across seven isolated suites |
| API and Next.js production builds inside browser runner | Passed; 20 static pages generated |

Browser coverage includes guest checkout/tracking, admin acceptance/auth, customer login/registration/revocation, Google OAuth, profile/password session replacement, checkout ownership/refresh, history/detail, anonymous auth, responsive layouts, dialog focus handoff, reduced motion and the new foundation checks. The runner reset and seeded only the guarded loopback `orderly_test` database.

An initial standalone web build lacked required `ORDERLY_API_ORIGIN`; the production runner supplied its local test configuration and built successfully. An initial combined-spec invocation bypassed the established per-suite API restarts and encountered an observed auth rate-limit error. Account/session scenarios passed in the final default isolated run. That initial run also exposed shrinking quantity targets and an incorrect placeholder-test target; both were corrected and verified. No throttling or authentication code was changed.

No final automated check remained blocked. Interactive visual inspection was unavailable because the in-app browser tooling failed to initialize; repository Playwright checks ran successfully. Manual assistive-technology and non-Chromium checks were not run.

### Stage 15.3

Original document ID: `docs/stage-15.3-premium-navigation-account-report.md`.

| Check | Result |
| --- | --- |
| `pnpm --filter web test --runInBand` | 35 suites / 268 tests passed |
| `pnpm --filter web typecheck` | Passed for application and tests |
| `pnpm --filter web lint` | Passed in the final standalone rerun |
| API and Next.js production builds | Passed; 20 static pages generated |
| Chromium production browser checks | All 46 checks passed across eight isolated suites |
| `git diff --check` | Passed |

Browser totals: critical workflow 18, foundation 2, navigation 2, Google OAuth 6, account 3, checkout ownership 6, history 6, anonymous authentication 3. Coverage includes guest/authenticated navigation, dropdown keyboard/Tab/Escape/outside dismissal, delayed failed-logout retry, mobile access, hash focus and Back/Forward state, profile draft preservation, profile save/password session replacement, Google-only/linked accounts, OAuth recovery, cart/checkout ownership, historical detail and reduced motion. Responsive checks include 320/390/768/820/1024/1440px.

Production validation used `ORDERLY_BROWSER_PRODUCTION=1` and the guarded loopback `orderly_test` database, never production data. The full default run passed its first six suites, then stopped on an outdated Orders-link assertion in history. After updating that assertion, navigation/history/anonymous suites passed in separate Playwright invocations with the existing successful production builds and fresh guarded fixtures. The API/web servers restarted between suites to retain rate-limit isolation. This is coverage across successful isolated executions, not a claim that the final default command completed all eight suites in one invocation.

Earlier checks exposed the Next hash/active-indicator gap, missing explicit suppression of the new disclosure animation, stale navigation/footer assertions and test queries needing narrower scope/type options. These were corrected. One concurrent lint invocation encountered a transient missing `test-results` directory while Playwright cleaned output; final lint is run separately after browser completion.

Rendered review is limited to local Chromium screenshots with seeded test data: desktop account/disclosure (historical source ID `stage-15.3-visuals/desktop-account-dropdown.png`), 320px account (historical source ID `stage-15.3-visuals/mobile-account.png`), 320px Google entry (historical source ID `stage-15.3-visuals/mobile-google-entry.png`). Captures are at the top of the page, with settled opening motion. The mobile section navigation wraps, profile/security surfaces and footer fit the narrow viewport, and Google artwork renders proportionally. These are after-change review artifacts; no pixel baseline comparison was performed.

Unverified: Safari/Firefox rendering, screen-reader announcements, live interactive visual review across every state, real mobile keyboards/safe areas and zoom/reflow beyond the automated viewport checks. No claim of full WCAG conformance is made.

### Stage 15.4

Original document ID: `docs/stage-15.4-premium-storefront-configurator-report.md`.

| Check | Result |
| --- | --- |
| Full web unit/component suite | Passed: 35 suites, 271 tests. |
| Focused storefront/component checks | Passed: 4 suites, 36 tests; includes option presentation, quantity/total feedback, hero, filtering and cart handoff. |
| Application and test TypeScript | Passed, including a final run after the typography correction. |
| Web ESLint | Passed; final run performed after browser cleanup. |
| API production build | Passed through the browser runner; API application source was unchanged. |
| Web production build | Passed after the typography correction; 20 static pages generated, with existing dynamic routes retained. |
| Complete production Chromium browser run | Passed: 48 tests across all nine isolated suites in one final default-runner invocation. |
| Whitespace check | `git diff --check` passed. |
| Rendered visual comparison | Twelve before/after PNGs captured; desktop and mobile storefront/configurator images reviewed locally. |

Browser counts: critical workflow 18; design foundation 2; customer navigation 2; Google OAuth 6; customer account 3; checkout ownership 6; order history 6; anonymous auth 3; storefront/configurator 2. Coverage includes menu/category selection, rendered typography and contrast, radio keyboard interaction, narrow/short viewport fit, persistent close/purchase controls, reduced motion, focus containment/restoration, cart persistence/recovery, checkout, guest tracking, account/OAuth and Admin regression checks.

The full component run passed before the final CSS class-length correction. The focused component suite was repeated against the final source, and the entire production browser run was repeated against the rebuilt final application. All relevant final checks passed. No requested automated check remains unavailable; manual cross-browser/assistive-technology checks and quantitative performance profiling remain unverified as listed above.

Commands used:

```powershell
pnpm --filter web test --runInBand
pnpm --filter web typecheck
pnpm --filter web lint
$env:TEST_DATABASE_URL='postgresql://orderly_user:orderly_password@localhost:5432/orderly_test?schema=public'
$env:ORDERLY_BROWSER_PRODUCTION='1'
$env:ORDERLY_STOREFRONT_CAPTURE_DIR='C:\dev\Orderly\docs\stage-15.4-visuals\after'
pnpm --filter web test:e2e
git diff --check
```

The production runner performs guarded local database reset/seeding, API and web production builds, then starts fresh servers per suite to retain rate-limit isolation. No production database or deployment was used. The new screenshot fixture restores its changes and removes only its own temporary product IDs. Builds emit the existing Prisma package-configuration deprecation and Node color-environment warnings; neither blocks validation.

An initial direct baseline invocation lacked the required Prisma environment URLs and was safely denied before test execution. Explicit local `DATABASE_URL` and `DIRECT_DATABASE_URL` resolved that setup error. Before captures used the unchanged Stage 15.3 production build; after captures use the Stage 15.4 production build.

### Stage 15.4.1

Original document ID: `docs/stage-15.4.1-visual-refinement-report.md`.

Continuation review confirmed the existing refinement implementation and inspected the before/after screenshots. Final checks:

- Focused component tests: **4 suites, 36 tests passed**.
- Web TypeScript checks (application and tests): **passed**.
- Web lint: **passed**, exit code 0.
- API and web production builds: **passed**.
- Production storefront browser suite: **2 tests passed**, covering 1440px, 390px and 320px, hero contrast, required options, title/base price, persistent close/purchase controls, quantity reachability, keyboard selection, focus return, cart handoff and reduced motion.
- Focused critical-workflow browser regressions: **3 tests passed**, covering mobile dialog/cart/checkout smoke, native modal focus containment and Tab wrapping, Escape/focus restoration, and reduced-motion behavior. The first direct invocation lacked the test-only proxy identity secret and was stopped; supplying that required local test setting resolved the setup issue without application changes.
- All **12 after screenshots refreshed** and representative desktop/mobile/narrow captures visually inspected, including initial-open and scrolled mobile states.
- `git diff --check`: **passed**; the build did not change `apps/web/tsconfig.json`.

Commands used:

```powershell
pnpm --filter web test --runInBand product-option-keyboard site-shell-ux-states homepage-menu homepage-hero
pnpm --filter web typecheck
pnpm --filter web lint
$env:TEST_DATABASE_URL='postgresql://orderly_user:orderly_password@localhost:5432/orderly_test?schema=public'
$env:ORDERLY_BROWSER_PRODUCTION='1'
$env:ORDERLY_STOREFRONT_CAPTURE_DIR='C:\dev\Orderly\docs\stage-15.4.1-visuals\after'
pnpm --filter web test:e2e storefront-configurator.spec.ts
$env:NODE_ENV='test'
$env:DATABASE_URL=$env:TEST_DATABASE_URL
$env:DIRECT_DATABASE_URL=$env:TEST_DATABASE_URL
$env:ORDERLY_PROXY_IDENTITY_SECRET='stage1541-local-browser-test-secret-at-least-32-bytes'
pnpm --filter web test:e2e:run critical-workflow.spec.ts --grep 'native product and cart dialogs|reduced-motion preference|product dialog, keyboard close'
git diff --check
```

The production runner performs guarded loopback test-database preparation and API/web production builds before the selected browser suite. Separate focused critical-workflow checks use the successful build, explicit local test Prisma URLs and fresh servers. Production data and deployments are not involved. Existing Prisma configuration-deprecation and Node color-environment warnings are non-blocking.

### Stage 15.5

Original document ID: `docs/stage-15.5-premium-cart-checkout-report.md`.

| Check | Result |
| --- | --- |
| Web component suite: `pnpm --filter web test --runInBand` | 37 suites / 282 tests passed. |
| Focused components after the final error-focus correction | 4 suites / 28 tests passed: checkout customer page, cart dialog feedback, confirmation and field accessibility. |
| Application and test TypeScript: `pnpm --filter web typecheck` | Passed. |
| Web ESLint: `pnpm --filter web lint` | Passed. |
| Production builds | API build passed; Next production build passed after final source changes with the existing local-browser production flag/origin configuration. |
| Production Chromium transaction suite | 5 passed: responsive transactions at all three widths, minimum/fee/unavailable/paused states, corrupt persistence and long-cart recovery. |
| Production Chromium regression suites | All passed: critical workflow (18), checkout ownership (6), order history (6), storefront configurator (2) and design foundation (2). With the transaction suite, 39 browser tests passed. |
| Screenshot artifacts | 30 before / 38 after PNGs, including initial/scrolled cart, invalid-field viewport, fixed-action clearance, busy/failure/retry and confirmation/recovery. |
| Whitespace/scope inspection | `git diff --check` passed; application API/database, dependency manifests, cart state/storage contracts and pricing/fulfillment utilities unchanged. |

Browser commands use `pnpm --filter web test:e2e:run <suite>` with `ORDERLY_BROWSER_PRODUCTION=1`, local API origin and guarded loopback `orderly_test` database. `ORDERLY_TRANSACTION_CAPTURE_DIR` selects the screenshot directory; `ORDERLY_TRANSACTION_BASELINE=1` permits baseline presentation assertions. Failure responses are intercepted locally; successful orders use the local test API. Temporary catalog/settings fixtures restore their original values in cleanup.

Coverage includes empty/populated/configured carts, repeated additions, quantity/removal/clear, persisted and corrupt storage, pickup/delivery, minimum/fee/free-delivery cases, invalid submission, disabled busy submission with one POST, failed submission with preserved details and successful retry, confirmation/recovery, exact focus restoration, reduced motion, horizontal overflow, short-screen scrolling and geometric fixed-action clearance. The existing regression suites also cover authenticated/guest ownership and session recovery without changing those contracts.

Verification corrections: baseline failure selectors were narrowed to exclude Next's route-announcer alert; screenshot capture waits for finite animations. An initial standalone build needed the existing local-production test flag. Sandboxed browser cleanup stalled after test completion, so the final isolated browser run uses approved execution outside that sandbox. Rendered touch-target and invalid-focus defects were fixed and retested; no assertion was relaxed to hide them.

### Stage 15.6

Original document ID: `docs/stage-15.6-premium-auth-orders-tracking-report.md`.

All requested automated categories completed. Browser results below cover successful isolated executions against the final production build; the default runner did not complete every suite in one uninterrupted invocation.

| Check | Result |
| --- | --- |
| Full web component suite | 38 suites / 291 tests passed. |
| Focused final authentication/history/tracking components | 3 suites / 28 tests passed after final authentication focus/spacing refinements. |
| Application and test TypeScript | Passed, including final source and browser-test changes. |
| Web lint | Passed in the final standalone check after browser completion. |
| API and Next production builds | Passed; 20 static pages generated, existing dynamic routes retained. Final generated auth chunk includes the last form-spacing refinement. |
| Production Chromium regressions | 55 unique tests passed across 11 isolated suites; details below. |
| Screenshot artifacts | 32 before / 38 after PNGs at the specified widths, captured against production builds. |
| Whitespace and scope | `git diff --check` passed; API, schema, dependency, authentication and ownership contracts unchanged. |

Browser counts: critical workflow 18, design foundation 2, customer navigation 2, controlled Google OAuth 6, account 3, checkout ownership 6, order history 6, anonymous auth 3, storefront/configurator 2, transactions 5 and Stage 15.6 presentation 2. Coverage includes login success/failure, registration, safe protected return, session revocation/refresh, Google entry/callback/conflict/linking without live external authentication, Profile/Security drafts/password session replacement, account navigation, filters/sorts/pages/Back, historical names/modifiers/prices, other-customer scoped 404, guest verification/invalid/not-found/unavailable/busy/refresh and status presentations, keyboard controls, visible focus, narrow overflow, touch targets and reduced-motion skeletons.

Commands use the established guarded loopback `orderly_test` target:

```powershell
pnpm --filter web test --runInBand
pnpm --filter web typecheck
pnpm --filter web lint
$env:TEST_DATABASE_URL='postgresql://orderly_user:orderly_password@localhost:5432/orderly_test?schema=public'
$env:ORDERLY_BROWSER_PRODUCTION='1'
$env:ORDERLY_AUTH_ORDERS_CAPTURE_DIR='C:\dev\Orderly\docs\stage-15.6-visuals\after'
pnpm --filter web test:e2e
git diff --check
```

Baseline used the new selected fixture suite with `ORDERLY_AUTH_ORDERS_BASELINE=1` and the before directory, against the unchanged production presentation. The full runner resets/seeds only the guarded test database, builds API/web and restarts servers between suites to preserve auth rate-limit isolation. Google regressions use the repository's controlled local provider; the visual fixture deliberately fails Google start without following external authentication.

Initial verification corrections: the tracking introduction's header exposed a second banner in the component test's layout setup, so it became a plain heading container. An old critical-workflow assertion expected Restaurant confirmed your order; it now asserts Current status: Accepted and the current Placed position. No backend/auth behavior or regression assertion was removed to hide a failure. The in-app Browser connection failed to initialize; repository Playwright and local PNG inspection provide the visual evidence.

The restarted default production run passed its first nine suites, then reported a 320px clearance failure in the unchanged checkout surface (four of five transaction cases passed). That assertion measured immediately after an implicitly smooth `window.scrollTo`; the application already applies smooth document scrolling. The test now requests immediate scrolling and awaits the same zero-overlap bound. All five transaction cases passed in a fresh-server rerun; no checkout application code changed. The new Stage 15.6 suite passed separately with all screenshots. One concurrent lint attempt encountered the previously documented disappearing Playwright `test-results` directory; the final lint check runs after browser completion. Existing Prisma configuration-deprecation and Node color-environment warnings remain non-blocking.
