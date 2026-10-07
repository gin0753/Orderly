# Orderly V1 Full Acceptance Report

Audit date: 7 October 2026, Australia/Sydney. Baseline: `479392f`, plus the focused acceptance fixes in this working tree. No deployment, production mutations, or production database changes were performed.

Follow-up: 8 October 2026. Findings #10 and #11 are now resolved; [P2 hardening results](v1-p2-hardening-report.md) record the focused regressions and one complete passing quality-gate run (541 tests/workflows). The validation table below retains the original 7 October audit evidence.

## A. Executive verdict

**READY FOR STAGE 14**

Stage 14 Packaging can begin. All confirmed P1 defects found in this audit have been fixed in the working tree, and the original complete quality gate and API Docker build passed. The 8 October follow-up resolved both remaining P2 findings and passed the complete quality gate once. No confirmed outstanding P0/P1/P2 code finding remains from this acceptance work. This approves entry into packaging and production UAT; ship the reviewed fixes and complete production UAT before V1 Freeze.

The implemented V1 covers storefront ordering, customer password/Google authentication, account management, guest tracking, private history, admin menu/orders, and optional AI draft descriptions. Review found concrete defects in displayed delivery fees, checkout validation, post-order storage failures, concurrent admin transitions, and admin session failure handling. These have focused fixes and regression coverage. Production Google is currently disabled; actual Google and hosting configuration require owner UAT.

## B. Validation results

Logs are retained in `../audit-artifacts/`. The final complete gate exited successfully; no tests were skipped to obtain acceptance.

| Validation / command | Result | Evidence / scope |
|---|---|---|
| `pnpm install --frozen-lockfile --prefer-offline` | PASS on retry | Lockfile unchanged; 972 packages installed. Initial sandbox attempt failed with Windows EPERM unlinking an existing dependency. |
| `pnpm db:generate` | PASS | Prisma Client 6.19.3 generated. |
| `pnpm lint` | PASS | API and web; initial added test used an unsafe `.bind` result, corrected to a typed wrapper. |
| API Prettier check on `src/**/*.ts` and `test/**/*.ts` | PASS | Repository API formatting configuration. Web has no separate formatting gate. |
| `pnpm typecheck` | PASS | API, web source, and web test project. |
| `pnpm --filter api test:unit --runInBand` | PASS | 13 suites, 150/150 tests. |
| `pnpm --filter api test:e2e` | PASS | 11 suites, 118/118 tests against real local PostgreSQL. |
| `pnpm --filter web test --runInBand` | PASS | 30 suites, 228/228 tests. |
| `pnpm build` | PASS | Nest build and optimized Next.js build. |
| `pnpm --filter api start` with production-mode local audit configuration | PASS | Corrected script boots; `/api/health` returned 200 on port 4017; audit process stopped afterwards. |
| `pnpm --filter api exec prisma validate` | PASS | Schema valid with explicit local database URLs. |
| `prisma migrate status` | PASS | All 11 migrations applied to isolated `orderly_test`. |
| `prisma migrate diff --from-url ... --to-schema-datamodel prisma/schema.prisma --exit-code` | PASS | No schema difference. Sequence behavior also protected by integration tests. Initial command used the wrong path relative to the API workspace; corrected without repository changes. |
| `pnpm test:quality`, `ORDERLY_BROWSER_PRODUCTION=1` | PASS | Final rerun exited 0: API unit 150/150, API e2e 118/118, web 228/228, plus typecheck/lint/build and all browser suites. |
| Browser workflows through the complete quality gate | PASS | 38/38: critical workflow 18, controlled Google 5, account 3, checkout ownership 6, private history 6. Optimized frontend, real API/PostgreSQL, Chromium; viewport cases include tablet/narrow mobile. |
| `docker build -f apps/api/Dockerfile -t orderly-api:acceptance .` | PASS | Final working-tree image built successfully with Linux Node 22.23.3. |
| Container runtime dependency inspection | PASS | UID 1000; built entry point present; Prisma 6.19.3; bcrypt native hashing/comparison works; all 11 migrations included. |
| Deployed read-only HTTPS checks | PASS | Health/menu 200; anonymous customer/admin identity 401; production test-provider 404; Google status reports disabled. |

Initial web run: 226/228 passed. One stale navigation expectation asserted $3.99 delivery; one regression in the new corrupt-storage cleanup was corrected. Rerun: 228/228.

Initial API integration run: 73/117 passed. Customer-auth initialization exceeded its 15-second hook timeout while installation/build validation competed for resources; the complete rerun passed without raising the timeout. Added functional fixture logins crossed the real five-per-minute throttle in two admin suites. Those suites now use the existing functional-test throttle bypass; dedicated customer/proxy throttle suites still exercise the real guard. Full rerun: 118/118.

First complete quality-gate attempt passed API/web checks and browser critical workflow (18/18), controlled Google (5/5), and account (3/3). Checkout ownership stopped at 4 passed, 1 failed, 1 not run: its direct Prisma fixture could not connect to local PostgreSQL before the session-revocation assertion. Private history was not reached. PostgreSQL remained running and subsequently accepted connections; no database restart was recorded. This is an environment/fixture connection failure, with its precise cause unconfirmed; simultaneous Docker build resource pressure is a possibility, not an established diagnosis. The failed trace, screenshot and context are preserved in `audit-artifacts/browser-first-failure/`. After the image build finished, the complete gate reran successfully, including ownership 6/6 and private history 6/6, without skipping tests or changing timeouts. Final evidence: `audit-artifacts/quality-final-rerun.log`, `docker-build-final.log`, and `docker-runtime-check.log`.

Dependency-install warnings about ignored lifecycle scripts and Prisma's deprecated package seed configuration did not prevent generation, tests, or builds. Local Node is 24.16.0; CI and Docker specify Node 22. Actual hosted GitHub Actions execution was not observed.

The workflow's action references exist in their upstream repositories: [actions/checkout v7](https://github.com/actions/checkout/tree/v7) and [actions/setup-node v7](https://github.com/actions/setup-node/tree/v7). This verifies the references, not a hosted CI run.

## C. Feature acceptance matrix

PASS refers to implementation and the stated local automated scope, not proof of every production setting.

| Area | Status | Automated Coverage | Notes |
|---|---|---|---|
| Home, categories, product browsing/customization | PASS | Strong | API-driven menu, required options, availability, modal keyboard behavior. |
| Cart quantity, persistence, recovery | PASS | Adequate | Storage sanitation and blocked/quota storage regressions; in-memory cart remains usable. |
| Guest pickup/delivery checkout, success, tracking | PASS | Strong | Backend pricing/selection validation; configured delivery fee now shown consistently. |
| Authenticated checkout and ownership | PASS | Strong | Ownership comes from session; expired auth cannot silently create a guest order. |
| Registration/login/logout/bootstrap | PASS | Strong | Sanitized identity, route guards, invalid credentials and expiry behavior. |
| Customer refresh rotation/replay/revocation | PASS | Strong | Compare-and-swap, absolute expiry, digest mismatch, concurrent rotation. |
| Cross-tab customer session synchronization | PASS | Adequate | Web Locks/BroadcastChannel implementation and client coordination tests; broader browser UAT remains. |
| Account name/phone/read-only email | PASS | Strong | Profile validation, protected mutations, account form and DB tests. |
| Password change and replacement session | PASS | Strong | Current-password verification; old sessions revoked; old credentials rejected. |
| Google OIDC sign-in | PARTIAL | Strong | Signed OIDC validation plus controlled browser flow; real Google deployment disabled. |
| Explicit Connect Google / Google-only account | PARTIAL | Strong | Same-email and password reauthentication; subject uniqueness; no implicit linking; live provider UAT outstanding. |
| Private order list/detail and isolation | PASS | Strong | Owner-scoped queries; other/guest/missing indistinguishable 404; customer-keyed cache cleanup. |
| History filters/sort/pages/URL navigation | PASS | Strong | Bounded query validation, deterministic tie-breakers, back/forward and responsive tests. |
| Admin authentication and authorization separation | PASS | Adequate | DB session checks, refresh/logout, customer/admin boundary; new failure and form-login regressions. |
| Admin order management | PASS | Adequate | Workflow rules, filtering/pagination, persisted actions; stale concurrent writes now return 409. |
| Admin category/product/options management | PASS | Adequate | Nested save validation, category reorder, archive/availability, public-menu reflection; limited browser editor coverage. |
| Optional AI assistant | PASS | Adequate | Hidden by default, unavailable configuration handled; mocked provider validation and apply/discard tests. Live AI generation not exercised. |
| Responsive/accessibility/error states | PASS | Adequate | Existing viewport, dialog focus, reduced-motion, empty/paused and error tests; full assistive-device UAT remains. |
| Signed proxy identity and throttling | PASS | Strong | Spoof stripping, HMAC verification, IP normalization, socket fallback and independent signed buckets. |
| Production operations/configuration | PARTIAL | Partial | Source/build review and read-only deployment checks; hosting secrets, predeploy jobs, replica count and operational recovery not independently verified. |

Journey assessment: A (guest) and B/C (new/existing customer) are protected by browser ordering/auth/history flows plus component/API tests. D (refresh) and E (password change) have real-session rotation/revocation tests and browser recovery/replacement flows. F/G (Google sign-in/connect) have cryptographic OIDC fixtures, replay/expiry/linking integration cases and controlled browser journeys; actual Google UAT remains outstanding. H (admin) has menu-to-public-API integration coverage and the complete guest checkout-to-admin-update-to-tracking browser flow. One single browser journey combining every admin menu edit with authenticated history reflection is still a coverage gap.

## D. Issues discovered

### P0 — Release blockers

None confirmed in the audited current V1.

### P1 — Must fix before Stage 14

1. **Delivery total understated before order submission — fixed.** Files: `apps/web/src/features/checkout/checkout-utils.ts`, checkout page/client/summary/fulfillment selector. UI charged/displayed $3.99 while seeds, schema default and deployed menu specify $5.00. Risk: a customer sees a lower total than the persisted order. Checkout now receives the existing menu-configured fee; selector, both summaries and mobile total share it. Validation: component regression uses a non-default $7.25 fee and verifies totals and pickup behavior; web suite passes.
2. **Storage failure after a successful order masqueraded as failed checkout — fixed.** Files: tracking storage utility, cart storage utility, checkout component tests. `saveTrackingLookup` could throw after API persistence but before success navigation; blocked cart persistence could also interrupt dispatch. Risk: retrying an already-created order and creating a duplicate. Optional storage now fails gracefully. Validation: regression proves one API call, cleared cart and success navigation despite quota failure; blocked-storage and corrupt-cart tests pass.
3. **Concurrent admin actions could overwrite a newer terminal status — fixed.** Files: `apps/api/src/modules/orders/orders.service.ts`, `apps/api/test/admin-orders.e2e-spec.ts`. Transition validation read the old status, then updated by ID alone. A stale ACCEPT could overwrite a committed cancellation. Update now predicates on the validated status and returns 409 on a lost race. Validation: deterministic real-DB regression commits cancellation between read/write and confirms cancellation remains intact; sequential/idempotent workflow tests still pass.
4. **Normal API start scripts targeted a missing build entry point — fixed.** File: `apps/api/package.json`. `start`/`start:prod` used `dist/main` although Nest emits `dist/src/main.js`; Docker/browser scripts already used the correct path. Risk: deployments using package scripts fail to start. Both scripts now target actual output. Validation: API production compilation and actual production-mode `pnpm start` with local test database; health returned 200.

### P2 — Consider before V1 freeze

5. **Missing checkout customer and blank required fields — fixed.** Files: order creation DTO and order integration tests. Nested validation did not require `customer`; service dereference could yield 500. Blank names/delivery addresses could be persisted. Added required nested presence and nonblank field validation. Real-DB regression checks 400 and zero created orders.
6. **Admin revocation failures reported successful logout; refresh infrastructure failures cleared credentials — fixed.** Files: admin auth service/controller and unit/integration tests. Database deletion failures were swallowed; controller cleared cookies unconditionally. Failed revocation now propagates and keeps cookies for retry; refresh only clears on terminal 401. Regression confirms 500, no cookie clearing, preserved session, then successful retry/revocation.
7. **Admin login accepted cross-site form bodies — fixed.** Files: admin auth controller/integration test. URL-encoded form credentials could establish an admin session through a browser navigation. Login now requires JSON, matching the frontend contract; a foreign-origin form receives 403 and creates no session. This is login-CSRF protection, not evidence of an authentication bypass.
8. **Runtime setup/deployment documentation inconsistent — fixed.** Files: root and API `.env.example`, `README.md`, `docs/api-docker.md`, `apps/web/README.md`. Obsolete `JWT_SECRET`, omitted direct migration/proxy secrets and an implied hard-coded Railway fallback could produce an unusable setup. Documentation now points to actual app examples, independent secrets, Prisma generation, direct connection, configured server origin and optional API AI settings. Validation: names checked against source/examples; no secret values included.
9. **Functional admin tests consumed persistent login rate counters — fixed test defect.** Files: admin auth/order integration suites. Adding valid regression cases exposed coupling to the five-login/minute budget. Use the existing fixture bypass for functional cases; real throttle behavior remains independently tested. Validation: complete API e2e rerun passes.
10. **Checkout does not fully mirror store fulfillment/minimum settings — fixed 8 October.** Files: checkout server page/client/fulfillment selector and checkout customer component tests. Disabled fulfillment methods are now unavailable in the UI, single-method checkout resolves to the enabled method, and neither-enabled checkout is blocked. The subtotal minimum is displayed and enforced on both submit controls, for both methods, without weakening backend rules. A stale delivery-only rejection preserves pickup instead of pausing the store. Configured fee and free-delivery behavior remain intact. Validation: focused frontend 20/20 and full web 235/235; complete quality gate and browser 38/38 passed. See the follow-up report for scope/evidence.
11. **Explicit private HTTP cache policy is incomplete — fixed 8 October.** Files: `apps/api/src/http/private-response.interceptor.ts`, customer account/orders and admin auth/orders/menu controllers, four API integration suites and `test/support/cache-policy.ts`. Private controllers now use `Cache-Control: private, no-store`; existing customer auth policy is preserved. Public menu routes are unaffected. Validation: focused API 19/19 includes account, private list/detail, admin order/menu/identity and public-menu header assertions; full API e2e 118/118 and complete quality gate passed. No prior cross-user disclosure was demonstrated; this closes the documented hardening gap.

### P3 — Backlog / operational notes

12. **App starter READMEs and progress notes remain partly boilerplate/stale — unfixed.** Files: `apps/api/README.md`, parts of `apps/web/README.md`, `docs/progress.md`. Documentation polish belongs in packaging; root README and auth/deployment docs are the usable references. No runtime risk.
13. **Legacy pre-V1 migration is unsuitable for importing populated early-stage databases — unchanged.** File: `20260612024908/migration.sql`. It drops old money/address columns and adds required cent fields without backfill. Fresh database migration succeeds; this old migration is not new V1 upgrade work. Do not rewrite applied migration history. Any import from that earlier populated schema needs a separate reviewed data conversion and backup procedure.

## E. Security review

- **Customer boundary:** independent models/secrets/cookies, explicit JWT algorithm/type/issuer/audience validation, active persisted-session checks and exact Origin/JSON/client-header protections for account/auth mutations. Password byte limits respect bcrypt; no unsafe email-only Google linking.
- **Admin boundary:** dedicated guards/models/secrets/cookies and active persisted-session validation; customer credentials cannot authorize admin reads/writes. Form login and transient revocation handling are corrected. Admin refresh coordination is in-tab; it does not offer the customer's full cross-tab coordination.
- **OAuth:** state/browser binding/nonce digests, S256 PKCE, five-minute expiring transactions and conditional single consumption. Real signed-token fixture tests validate signature, claims and nonce; connect requires initiating session, password and verified same email. Test provider is test-only and deployed route returns 404. Actual Google consent/client settings remain unverified because deployed Google is disabled.
- **Sessions:** customer digest/version rotation is compare-and-swap; replay revokes, password change atomically replaces sessions, access checks observe revocation. Customer sliding refresh is capped by immutable creation time. Without Web Locks, competing tabs may fail closed and require sign-in, as documented.
- **Ownership:** server assigns owner; scoped list/detail queries and explicit response maps protect customers. Guest lookup requires number plus checkout email/phone and never claims ownership. Unique sequences/snapshots and set-null ownership deletion are covered against PostgreSQL.
- **Proxy/throttling:** incoming identity headers are stripped, normalized IP signed with HMAC-SHA256, API compares signatures in constant time and hashes tracker identifiers. Invalid/unsigned forwarding uses socket peer only, not caller-selected forwarding headers. Buckets are IP-based, not a separate customer-ID quota. Process-local counters assume one API replica; unsigned direct Railway clients can share a fallback proxy bucket. Hosting-normalized forwarding and replica count require operational confirmation.
- **Secrets/debug:** tracked environment examples were inspected and targeted tracked-source searches found no actual private key/API credential. No exhaustive Git-history secret scan was performed. Console startup/seed logs are operational; mocks and fixture endpoints are test artifacts; no skipped/focused release suites or unfinished V1 TODO/FIXME markers were identified in the inspected source. Expired session cleanup is an operational job, not required for authentication expiry to work.

## F. Coverage gaps

Strong automated coverage protects customer authentication, rotation/replay, password change, OIDC cryptographic validation/linking, owner isolation, checkout pricing/options, order-number concurrency and signed identity. Remaining gaps:

- Real Google Console client configuration, consent, provider availability and production callback/cookies.
- Real OpenAI response quality, model/key availability and deployed UI toggle configuration.
- Complete admin category/product editing, archival/restoration/reorder browser journey followed by storefront checkout and private customer status verification in one browser test; API/component layers cover substantial parts separately.
- Multi-tab session stress across browsers without Web Locks/BroadcastChannel, Safari/Firefox and actual mobile devices.
- All network/hosting failure combinations; broader live browser/device checks under operational failures.
- Populated legacy schema conversion, production Neon migration permissions/backups, Railway predeploy/start settings, Vercel environment settings, logs/alerts and rollback.

## G. Manual production UAT checklist

- [ ] Deploy the reviewed fixes through the normal pipeline; confirm both hosted builds and Railway migration/predeploy success before freeze.
- [ ] Verify Vercel server origin/proxy secret and Railway matching secret, four distinct JWT secrets, exact HTTPS web origin, Neon pooled runtime/direct migration endpoints, cookie attributes and one API replica. Do not expose values in screenshots/logs.
- [ ] Guest delivery below $50: displayed fee/total equals success, tracking and admin detail. Repeat pickup and free-delivery threshold.
- [ ] Register/login, reload, edit account, change password, verify old browser session expires, logout and verify history/cache isolation with a second customer.
- [ ] Two real tabs: sign-in/out/password change/refresh; verify cart survives and private data clears.
- [ ] If Google will be enabled, perform real sign-in, cancel/decline, and explicit same-email Connect Google. Verify conflict does not merge a password account. Confirm configured callback uses Vercel `/api`, not Railway.
- [ ] Admin create/edit/availability/archive/reorder: refresh storefront, order changed product, update status and confirm guest tracking/private history. Check cancellation conflict handling in two admin tabs.
- [ ] Optional AI disabled state; if enabled, generate/apply/discard a draft with real key/model and ensure only normal Save persists it.
- [ ] Actual phone/tablet and keyboard/screen reader: menu/cart/dialog/checkout/account/history/error states.
- [ ] Confirm backup/rollback, expiry cleanup job, production logs and migration permissions. Do not run destructive seeds/resets on production.

## H. Final recommendation

**Stage 14 Packaging can begin.**

The original 7 October audit passed all 534 automated tests/workflows, lint, type checks, optimized builds, fresh migrations/schema comparison, API production startup, and the Node 22 API Docker build/runtime dependency check. The 8 October P2 follow-up passes all 541 tests/workflows, lint/type checks and optimized builds through one complete quality gate; no new Docker build was required or performed for that follow-up. Focused fixes address the confirmed release defects without adding product features or broadly changing architecture.

Before V1 Freeze, deploy and verify these fixes through the normal release process and finish the manual production checklist. Both P2 findings are resolved. Real Google must remain disabled until its live UAT succeeds; optional AI needs live UAT only if enabled. Hosting secrets/predeploy/replica settings and operational recovery still require owner confirmation. No production deployment or database mutation was performed by this acceptance work.
