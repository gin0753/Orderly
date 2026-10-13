# V1 guest tracking security hardening

Date: 2026-10-11. Base HEAD: `b23e165d4ee7f56ed918dc557d60f1fae0bc163a`; implementation is uncommitted. This report supersedes its earlier preimplementation blocker after the owner approved Minimal Remediation.

## Implementation summary and threat model

Anonymous detailed tracking no longer accepts order-number/contact matching. Every new order receives a 256-bit random receipt capability. Only its SHA-256 hash is persisted; the raw code is returned only in the successful creation response. Authorization is a valid receipt for that order or a matching authenticated customer ID. No ownership backfill, account merge, pricing change, Google OAuth change or session redesign was made.

The threat addressed is an unauthenticated caller who knows an email/phone and guesses an order number. A receipt is a bearer credential: deliberate sharing, clipboard compromise or browser compromise can disclose the reduced receipt. Authentication still protects account order history independently.

Expiry is exactly 30 days from the new order's recorded creation timestamp. Creation and initial update timestamps use the same captured time as capability issuance, within the existing atomic order transaction. Codes remain reusable through terminal status until expiry/revocation. Every tracking request checks the stored hash, expiry and revocation; hashes are compared with constant-time comparison after bounded format checks. No read consumes or rotates a code.

The lookup endpoint is limited to 20 requests per minute per existing tracker. Creation and tracking responses use `Cache-Control: private, no-store`; the tracking guard also sets this for session failures. Validation rejects legacy email/phone fields. Credential failures are generic 404 responses; malformed inputs receive non-disclosing validation errors. A supplied receipt, including an empty string, never falls back to owner authorization. Receipt authorization is independent of stale customer cookies.

## Delivery, storage and user-facing behavior

Confirmation displays a labeled receipt code, explicit Copy action, selectable fallback when clipboard access is unsupported, and Forget-on-this-tab action. Guests must save the order number and code privately before leaving. Tracking can be resumed by entering both on the search page; signed-in owners can leave the receipt blank.

Only the most recent receipt is retained in tab-scoped session storage, with order number and expiry. It is not stored in local storage, cookies, URLs or returned order-data caches. Browser session restoration may retain tab storage. An in-memory fallback preserves confirmation during client navigation when storage is blocked; after a full reload in that environment, a saved code or matching owner account is needed. Successful checkout is not rolled back or reported failed because storage/clipboard is unavailable. Forgetting a tab copy does not revoke a saved code.

Expired/malformed/legacy contact-only stored entries are discarded. Invalid server-side receipt feedback removes displayed order data but retains the submitted proof for explicit retries, so retry cannot silently change to owner authorization. Users can replace it through the search form or explicitly forget it. Server checks remain authoritative regardless of client storage.

The tracking response retains recorded status/payment status, fulfillment type, dates, historical item names/images/modifiers/quantities and historical totals. It excludes names, email, phone, delivery address, free-text notes, order UUID and product/item/option identifiers. Full snapshots remain unchanged in the database and existing authorized account/Admin paths. Admin serializers also omit new receipt metadata.

Tracking/confirmation/privacy guidance now explicitly describes the saved-code policy, 30-day validity and absence of anonymous recovery. No reissue or verified-contact recovery feature exists.

## Access-control matrix

| Caller / proof | New guest | New owned | Legacy guest | Legacy owned |
| --- | --- | --- | --- | --- |
| Anonymous, no code | Denied | Denied | Denied | Denied |
| Correct valid receipt for this order | Allowed | Allowed | No receipt exists; denied | No receipt exists; denied |
| Wrong, empty, expired or revoked supplied receipt | Denied | Denied, even for signed-in owner | Denied | Denied, even for owner |
| Authenticated matching owner, no code | No owner; denied | Allowed | No owner; denied | Allowed |
| Other customer, no code | Denied | Denied | Denied | Denied |
| Other customer with valid receipt | Allowed as bearer | Allowed as bearer | Denied | Denied |
| Contact matching alone | Denied | Denied | Denied | Denied |

A receipt for another existing order is rejected. Legacy customer-owned orders remain accessible to their owners through tracking/history. Legacy guest orders and lost/expired/revoked guest receipts have no online recovery. The migration does not manufacture proof from contact information or attach guest orders to accounts.

## Schema and migration

`apps/api/prisma/migrations/20261011010000_order_receipt_capability/migration.sql` adds three nullable Order columns:

- `receiptCapabilityHash`: varchar(64), containing SHA-256 hex only.
- `receiptCapabilityExpiresAt`: timestamp(3).
- `receiptCapabilityRevokedAt`: timestamp(3).

Existing rows retain null values. No row backfill, ownership mutation or historical-price recalculation occurs. New metadata is written with new order creation; failed transactions issue no successful receipt response. The migration was exercised only against guarded local `orderly_test`. No production migration was applied.

## Verification results

The existing safety preflight confirmed loopback host, dedicated `orderly_test`, `schema=public`, matching Prisma targets, `NODE_ENV=test` and no deployment markers. Docker Linux Engine was available. Database suites used the existing wrappers and guards without overrides. All data was synthetic.

| Command / coverage | Actual result |
| --- | --- |
| `pnpm --filter api exec prisma generate` | Passed; local client generation only. |
| `pnpm --filter api test:unit --runInBand` | 15 suites, 158 tests passed. |
| `pnpm --filter api test:unit --runInBand receipt-capability` | 3 focused tests passed. |
| `pnpm --filter api test:e2e` | Final run: 11 suites, 124 tests passed, including exact 30-day timestamp alignment. |
| `pnpm --filter web test --runInBand receipt-tracking-retry receipt-capability-storage customer-navigation premium-tracking-accessibility order-tracking-safety checkout-customer-page api-fetch` | 8 suites, 57 tests passed. |
| `pnpm --filter web test --runInBand` | 43 suites passed, 1 failed; 328 tests passed, 3 failed (331 total at that run). Failures are unchanged Google feedback heading expectations, not receipt tests. |
| `pnpm typecheck` | Passed for API, application web and web test TypeScript. |
| `pnpm lint` | Passed for API and web. |
| Production builds | API and web passed through guarded production browser wrapper and explicit local build environment. A first bare build correctly refused missing `ORDERLY_API_ORIGIN`; subsequent runs provided a local origin with `ORDERLY_BROWSER_PRODUCTION=1`. |
| Focused Chromium receipt + premium auth/orders/tracking | 6 tests passed; 1440px/390px/320px receipt journeys, saved-code resumption, owner access, refresh, history navigation and mocked failure/status states. |
| Final Chromium receipt pass on timestamp-aligned implementation | 4 tests passed at 1440px/390px/320px plus owner tracking; no horizontal overflow. |
| Isolated Chromium checkout ownership | 6 tests passed, including guest/password/Google checkout, expired access refresh, revoked-session guest continuation and logout behavior. |
| Earlier combined browser regression | 31 passed, 3 failed, 2 not run because of existing serial-suite failure propagation. Critical workflow (18) and customer history (6) passed. See retained failures below. |

Browser: Chromium `151.0.7922.34`, Playwright `1.62.1`; Node `24.16.0`, Prisma `6.19.3`, Next `16.2.6`. Firefox/WebKit, native devices and assistive technology were not tested in this patch.

API coverage includes issuance for guest/owned orders, hash-only persistence, exact lifetime, repeated access, no personal response fields, no raw receipt in tracking responses, wrong-order proof, missing/empty/invalid/null codes, expiry/revocation, authenticated owner/other-customer access, stale-cookie receipt access, legacy owned/guest behavior, whitelist rejection of contact-only requests and real route throttling. Existing API suites also cover historical snapshots, server prices, injected ownership fields and auth/OAuth boundaries.

Component coverage includes optional/blocked storage, legacy/expired storage rejection, tab receipt restoration, explicit clipboard copy, unsupported clipboard fallback, forget actions, validation/focus, generic feedback and proof-preserving retries. Browser receipt tests use real synthetic order creation and API access; premium presentation tests use intercepted synthetic responses and are not substitutes for API authorization tests.

### Exact browser commands

For every command below, set `ORDERLY_RECEIPT_SECURITY_TESTS=1`, `PLAYWRIGHT_NO_COPY_PROMPT=1` and `ORDERLY_BROWSER_PRODUCTION=1` in that command's local environment. The wrapper supplies only the guarded database target and local API origin.

```text
pnpm test:browser receipt-tracking-security.spec.ts --output=../../audit-artifacts/f1-receipt-browser/verification-01
pnpm test:browser receipt-tracking-security.spec.ts critical-workflow.spec.ts customer-checkout-ownership.spec.ts customer-order-history.spec.ts premium-auth-orders-tracking.spec.ts --output=../../audit-artifacts/f1-receipt-browser/verification-02
pnpm test:browser receipt-tracking-security.spec.ts premium-auth-orders-tracking.spec.ts --output=../../audit-artifacts/f1-receipt-browser/verification-03
pnpm test:browser customer-checkout-ownership.spec.ts --output=../../audit-artifacts/f1-receipt-browser/verification-04
pnpm test:browser receipt-tracking-security.spec.ts --output=../../audit-artifacts/f1-receipt-browser/verification-05
```

### Failures preserved and disposition

- `verification-01`: two passes, two mobile failures. The new fixture used the desktop-only exact `Place Order` label while mobile displays `Place Order →`. Corrected the fixture to locate the visible Place Order action; did not change application checkout, assertions or timeout.
- `verification-02`: combined run retained an expired-access checkout failure, a tracking mock reload/recovery failure and an owner-tracking failure. Two later serial tests consequently did not run; no explicit skips were introduced.
- Tracking mock failure exposed that removing an invalid saved proof could switch a later retry to owner mode. Corrected proof retention and added a focused retry regression. `verification-03` then passed the original presentation assertions and all real receipt journeys.
- Owner tracking passed in the initial focused run and `verification-03`, with sanitized 201 diagnostics. Expired-access checkout and both previously unrun serial cases passed in `verification-04`; diagnostics confirmed order POST 401, refresh 200, then order POST 201. Combined-suite interference is plausible, but its exact cause was not proved. Do not classify the earlier combined run as passing or claim a general auth/infrastructure fix.
- Initial API tests used a dynamic import unsupported by the Jest execution mode; switched the test to a static built-in crypto import. Subsequent complete API runs passed without modifying production auth or pricing.
- The three broader component failures expected `Google connection did not complete`, while unchanged HEAD code rendered `Google connection unsuccessful`. Both files were checked at HEAD. At that implementation stage they were left for separate test-maintenance approval; the approved closure below now corrects only the stale expected literal.

Failure artifacts remain under `audit-artifacts/f1-receipt-browser/verification-01` and `verification-02`; successful run markers remain under `verification-03`, `verification-04` and the final `verification-05`. Existing unrelated evidence was not overwritten. New run directories were used instead of the default test-results directory.

## Receipt leakage review and diagnostic policy

Application code does not log receipt values, interpolate them into errors/URLs, send them to analytics or use a third-party session-replay integration. Lookup sends the code only in a JSON POST body; the creation response is the sole raw-code issuance. Since the code is absent from URLs, it is absent from URL-derived referrers. Credential fields disable autocomplete and carry a private-field marker; that marker is not claimed to configure an external recorder.

Security verification mode disables screenshots, video and network traces; automatic page snapshot collection is also disabled where supported. Playwright matcher errors can still include diagnostic context, so retained files require scanning before publication. Receipt tests use boolean comparisons instead of assertions that print raw codes and scrub private inputs on teardown. Earlier error contexts were checked without printing possible secrets. Final artifact scan: eleven retained files contained zero receipt-format candidates, zero trace ZIPs and zero screenshots. This format scan is supporting evidence, not a guarantee about arbitrary external instrumentation.

Always use security verification mode for checkout/receipt browser runs and review diagnostics before sharing. No browser trace is claimed as evidence for receipt flows. Production proxy/APM/logging and any future analytics/session replay must disable body capture or redact `receiptCode` in creation responses and tracking requests. Those deployed integrations cannot be certified from repository code alone. HTTPS, private/no-store headers and referrer-safe routes must be checked at deployment.

## Secure operational revocation procedure

No public revocation/reissue endpoint, support credential shortcut or Admin redesign was added. Before release, the owner must designate an authorized security administrator and a restricted database operator, with authenticated private access and audit records. Contact knowledge alone does not authorize revocation or disclosure.

1. An authorized administrator approves revocation and identifies the exact internal order UUID through existing protected Admin data. Record incident/change reference and reason privately; never request or record the raw receipt code.
2. A restricted operator uses a parameterized database command in an approved transaction. Grant only necessary select access and update access to the revocation column; do not expose this role to the customer/web application or a public script.
3. Execute the following reviewed operation with a bound UUID, checking that exactly the intended row is returned. Null-capability legacy rows return no update. Repeated revocation preserves the first revocation time.

```sql
UPDATE "Order"
SET "receiptCapabilityRevokedAt" = COALESCE("receiptCapabilityRevokedAt", CURRENT_TIMESTAMP)
WHERE id = $1::uuid AND "receiptCapabilityHash" IS NOT NULL
RETURNING id, "receiptCapabilityRevokedAt";
```

4. Record actor, order ID, timestamp, reason and affected-row count in the restricted operational audit. Commit only the approved update; rollback unexpected results. Do not log receipt values/hashes, change ownership, modify historical prices/notes or clear revocation to restore access.
5. Future receipt reads must fail; authenticated matching owner history remains available. Validate the procedure with synthetic data before production use. Revocation cannot erase information already displayed/downloaded. No recovery/reissue operation is authorized.

This procedure is defined, not executed or provisioned in production. Operator-role provisioning, deployment approval and a revocation rehearsal remain release conditions. The SQL intentionally avoids changing historical order/status timestamps.

## Deployment and remaining risks

- Apply the reviewed additive migration before switching to the new API, then deploy the compatible web/API cutover together. Previously loaded old clients can ignore the new receipt in a creation response, so require an explicit reload/cutover notice to avoid losing a new guest receipt. Old clients sending contacts fail closed; they must not remain advertised as a working recovery flow. Do not roll back to the vulnerable contact-only endpoint.
- No production database, deployment configuration, commit, push or deployment was modified in this task.
- The approved legacy guest access loss is intentional. Communicate cutover before release. Mailbox/phone recovery, receipt reissue and retroactive order claiming are excluded.
- Users must save each receipt; only the latest is retained per tab. Shared browsers, browser session restore, clipboard history and XSS/browser compromise can expose a bearer credential. Thirty-day expiry and response minimization limit scope but do not eliminate those risks.
- Focused throttling uses existing tracking infrastructure; distributed durable anti-abuse infrastructure was not added. Combined-suite failures remain retained; broad testing should use the existing per-suite isolation pattern and preserve real failures.
- The verification closure below resolves the stale Google component assertions. One broader storefront contrast assertion failed in the complete isolated browser run and remains recorded separately. No full multi-engine or real-device production-readiness claim is made. Prior release findings outside F1 are not closed by this patch.

F2/F3 remain separate: prioritize expiring pending password registration, mailbox ownership verification and neutral registration responses before unrestricted real-customer signup, or obtain explicit containment/risk approval. Do not implement email verification or alter Google linking as part of F1.

## Recommendation

**F1: PASS WITH CONDITIONS for code review; public release is not approved.** Authorization remediation is implemented. The final API run verified exact timestamp alignment. Focused security and browser journeys passed; release remains conditional on migration/cutover, operational privacy/revocation requirements and the documented broader test/release risks. No release deployment is authorized by this report.

Source hashes for the exact reviewed implementation and sanitized run results are retained in the local verification summary (local evidence ID `audit-artifacts/f1-receipt-browser/verification-summary.json`; no public download). This evidence directory is ignored by Git; preserve it separately before any future cleanup/publication. All 41 source/test/configuration/migration hashes were rechecked unchanged after the final browser run. The report itself is excluded from that hash set to permit final evidence updates.

## Exact changed-file inventory

43 implementation/report files including the closure's Google test expectation correction; full paths below. The earlier email ownership audit is a pre-existing untracked deliverable and was not modified by this implementation. Generated ignored browser evidence is listed separately above.

- `apps/api/prisma/migrations/20261011010000_order_receipt_capability/migration.sql`
- `apps/api/prisma/schema.prisma`
- `apps/api/src/modules/orders/dto/guest-order-lookup.dto.ts`
- `apps/api/src/modules/orders/mappers/order-tracking.mapper.ts`
- `apps/api/src/modules/orders/orders-public.controller.ts`
- `apps/api/src/modules/orders/orders.service.ts`
- `apps/api/src/modules/orders/receipt-capability.spec.ts`
- `apps/api/src/modules/orders/receipt-capability.ts`
- `apps/api/src/modules/orders/receipt-tracking.guard.ts`
- `apps/api/src/modules/orders/types/order-tracking-response.type.ts`
- `apps/api/test/orders.e2e-spec.ts`
- `apps/web/playwright.config.ts`
- `apps/web/src/app/(customer)/order-success/page.tsx`
- `apps/web/src/app/(customer)/privacy/page.tsx`
- `apps/web/src/app/(customer)/track-order/page.tsx`
- `apps/web/src/features/checkout/api/create-order.ts`
- `apps/web/src/features/checkout/components/checkout-page-client.tsx`
- `apps/web/src/features/order-tracking/api/order-tracking-api.ts`
- `apps/web/src/features/order-tracking/components/lookup/order-lookup-form.tsx`
- `apps/web/src/features/order-tracking/components/receipt-code-panel.tsx`
- `apps/web/src/features/order-tracking/components/result/order-tracking-details.tsx`
- `apps/web/src/features/order-tracking/components/result/order-tracking-result.tsx`
- `apps/web/src/features/order-tracking/components/result/order-tracking-verification-state.tsx`
- `apps/web/src/features/order-tracking/components/result/tracking-order-summary.tsx`
- `apps/web/src/features/order-tracking/hooks/use-order-tracking.ts`
- `apps/web/src/features/order-tracking/types/order-tracking.types.ts`
- `apps/web/src/features/order-tracking/utils/order-tracking-storage.ts`
- `apps/web/test/api-fetch.test.ts`
- `apps/web/test/browser/critical-workflow.spec.ts`
- `apps/web/test/browser/customer-checkout-ownership.spec.ts`
- `apps/web/test/browser/customer-order-history.spec.ts`
- `apps/web/test/browser/final-acceptance.spec.ts`
- `apps/web/test/browser/final-release-loading.audit.ts`
- `apps/web/test/browser/premium-auth-orders-tracking.spec.ts`
- `apps/web/test/browser/receipt-tracking-security.spec.ts`
- `apps/web/test/checkout-customer-page.test.tsx`
- `apps/web/test/customer-google-methods.test.tsx`
- `apps/web/test/customer-navigation.test.tsx`
- `apps/web/test/order-tracking-safety.test.tsx`
- `apps/web/test/premium-tracking-accessibility.test.tsx`
- `apps/web/test/receipt-capability-storage.test.tsx`
- `apps/web/test/receipt-tracking-retry.test.tsx`
- `docs/v1-guest-tracking-security-hardening-report.md`

## F1 security verification closure

Tested base HEAD remains `b23e165d4ee7f56ed918dc557d60f1fae0bc163a`, with the uncommitted F1 implementation above. All 41 implementation hashes in the previous verification summary still match. This follow-up changes only `apps/web/test/customer-google-methods.test.tsx` and this report; it introduces no application, authorization, session, checkout or migration changes. Local diagnostic scripts/results are retained under the ignored evidence directory.

### Google assertion correction and complete component results

The parameterized cancelled/conflict/failed callback test shared the obsolete heading `Google connection did not complete`. The accepted, unchanged component renders `Google connection unsuccessful`. Only that expected literal was corrected. The accessible alert assertion, all three callback cases, Connect Google availability, current-password requirement, disabled-provider behavior, explicit linking call and Google navigation assertions remain intact. No production copy or OAuth configuration changed. The earlier failed run above remains historical evidence.

| Closure command | Result |
| --- | --- |
| `pnpm --filter web test --runInBand` | **45 suites / 333 tests passed**, no skips; 95.202 seconds. |
| `pnpm --filter api test --runInBand` | **15 suites / 158 tests passed**; 17.611 seconds. |
| `pnpm --filter web typecheck` | Passed, including web test TypeScript. |
| `pnpm --filter web lint` | Passed. |
| API and production web builds through each guarded browser wrapper | Passed. |
| `git diff --check` | Passed. |

The prior complete guarded API E2E result remains 11 suites / 124 passes. It was not rerun during this test-only closure; its implementation hashes remain unchanged.

### Complete isolated browser regression

Chromium `151.0.7922.34`, Playwright `1.62.1`, Node `24.16.0`, Next `16.2.6`, Prisma `6.19.3`. All eleven default production browser suites plus the real receipt suite were run separately. Each invocation uses the existing guarded reset/seed/build/server wrapper, including fresh servers and a fresh allowlisted synthetic database. This preserves per-suite process isolation and additionally resets synthetic data between suites. No assertions, retries, timeouts or destructive guards were changed. Independent suites continued after the contrast failure to provide complete coverage, rather than suppressing it.

For each row, the exact command is `pnpm test:browser <suite>.spec.ts --output=../../audit-artifacts/f1-receipt-browser/closure-<suite>`, with `ORDERLY_RECEIPT_SECURITY_TESTS=1`, `PLAYWRIGHT_NO_COPY_PROMPT=1` and `ORDERLY_BROWSER_PRODUCTION=1`. Database target: loopback `orderly_test`, `schema=public`, matching Prisma targets, `NODE_ENV=test`, no deployment markers. The wrapper supplies the local origin; no production/staging database was used.

| Suite | Actual result |
| --- | --- |
| critical-workflow | 18 passed |
| design-foundation | 2 passed |
| customer-navigation | 2 passed |
| google-oauth | 6 passed; local synthetic provider only |
| customer-account | 3 passed |
| customer-checkout-ownership | 6 passed |
| customer-order-history | 6 passed |
| customer-anonymous-auth | 3 passed |
| storefront-configurator | 7 passed, **1 failed** |
| premium-transactions | 5 passed |
| premium-auth-orders-tracking | 2 passed |
| receipt-tracking-security | 4 passed |
| **Total** | **64 passed, 1 failed, no skipped cases** |

Per-suite exit results (local evidence ID `audit-artifacts/f1-receipt-browser/closure-suite-results.json`; no public download) and distinct `closure-*` directories preserve outcomes. Earlier `verification-01` through `verification-05` evidence remains unchanged.

Receipt checks passed at 1440px, 390px and 320px, including refresh, Back/Forward and saved-code resumption in a fresh tab. Owner access passed independently of receipt and checkout contact, including reload; both observed lookup responses were 201. Checkout recovery preserved its existing assertions: initial order POST 401, refresh 200, retried order POST 201, one created owned order. Revoked-session guest continuation, typed-contact preservation, another-customer denial, guest/account-history separation and historical snapshots passed.

### Retained combined-run failure disposition

- Premium tracking retry failure: previously reproduced proof-loss defect was fixed within the accepted F1 implementation, with a focused proof-preserving retry regression. The original browser assertions now pass in isolation; no new fix was made here.
- Expired-access checkout and owner tracking: both pass in this closure and prior isolated runs. No reproducible session/checkout application defect was demonstrated. The retained combined snapshots lack the HTTP statuses needed to establish the original cause. Shared in-memory throttling (lookup 20/minute; login 5/minute) and server lifecycle interference are plausible, **not confirmed**. Historical failures remain unresolved as combined-harness diagnostics, not evidence that the isolated run failed or that production authentication was fixed.
- Storefront contrast: the unchanged test at `storefront-configurator.spec.ts:201` measured 1.087285 against 4.5. All seven storefront/image-readiness checks passed. Its calculation discards alpha, while the Track order hover background is translucent; cursor carryover could therefore produce a false contrast result. This is a separate diagnostic finding, not an F1 authorization failure. The assertion was preserved, not weakened.

Focused reproduction: `pnpm test:browser storefront-configurator.spec.ts --grep "charcoal hero" --output=../../audit-artifacts/f1-receipt-browser/closure-contrast-repeat`, with the same three security/test environment settings, **1 passed (13.4 seconds)**. This targeted reproduction follows the complete eight-case run; it does not replace that run or suppress its failed result. `node audit-artifacts/f1-receipt-browser/closure-contrast-check.cjs` then inspected the fully configured local test servers. Computed-style evidence (local evidence ID `audit-artifacts/f1-receipt-browser/closure-contrast-result.json`; no public download) records normal Track order white on `rgb(36,36,36)` and a hovered transitioning `oklab(...)` background with alpha. The existing parser assumes numeric RGB channels, ignores color space and alpha, and cannot correctly calculate that transition. This supports a **test-measurement/interference finding**; the exact computed color at the earlier failure was not captured, so its precise trigger remains uncertain. Recommend a separately reviewed alpha/color-space-aware measurement and deliberate cursor state, retaining the 4.5 threshold and keyboard checks. No storefront code/test change was made here. Earlier standalone diagnostic attempts failed because servers were absent/incomplete or the locator was unscoped; they yielded no contrast conclusions. Only the final successful guarded-server probe is evidence.

### Migration readiness and receipt privacy

`node audit-artifacts/f1-receipt-browser/closure-migration-check.cjs` passed using the existing database guard. A transaction-local temporary copy of four synthetic orders had only the three new columns removed to reproduce the old shape; the exact migration SQL was then executed against that temporary table. Every original field was preserved, all added metadata was null, and original `public.Order` rows were untouched. The temporary table disappeared on commit. Result (local evidence ID `audit-artifacts/f1-receipt-browser/closure-migration-result.json`; no public download). This confirms legacy-row compatibility; it does not measure production lock duration, exercise a production upgrade or certify backup/restore.

The SQL remains additive: no defaults, backfill, ownership changes or receipt issuance to legacy rows. Existing accepted API tests cover legacy guest denial, legacy owner access, expiry/revocation, wrong-order proof, no invalid-proof fallback, hash-only persistence, generic failure disclosure and throttling. Production migration approval, backup/restore rehearsal and lock/cutover planning remain required.

`node audit-artifacts/f1-receipt-browser/closure-evidence-check.cjs` scans retained text/JSON/Markdown/log evidence for raw 43-character receipt-format candidates without printing candidates, checks trace/screenshot presence, and rechecks the accepted implementation hashes. Sanitized results (local evidence ID `audit-artifacts/f1-receipt-browser/closure-evidence-result.json`; no public download). Receipt suites disable network traces/video/screenshots and avoid credential-valued failure assertions. Three explicit customer-navigation screenshots remain; these depict Google entry/account navigation rather than receipt screens. Console diagnostics disclose only methods, route paths and response statuses. A format scan does not certify external production logging or constitute OCR of every image.

### Closure recommendation and production cutover requirements

**F1 authorization verification: PASS WITH CONDITIONS. Complete browser regression: not fully green.** The complete web component suite and isolated receipt/owner/checkout security journeys pass. The broader contrast failure remains preserved for disposition. No new P1 authorization defect was confirmed. Firefox/WebKit, real devices and assistive technology were not rerun; prior unrelated release blockers remain open.

Before public cutover: approve/apply the additive migration with backup and restore readiness; deploy matching API/web versions with an explicit stale-client reload and legacy-guest access-loss notice; prohibit rollback to contact-only authorization; verify HTTPS/no-store and deployed proxy/APM request/response-body redaction; provision and rehearse the authorized revocation procedure; resolve the broader release findings and F2/F3 containment or follow-up approval. No production mutation, commit, push or deployment occurred during this closure.
