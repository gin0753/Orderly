# Git commit execution phase 1

Date: 11 October 2026 (Australia/Sydney). Original HEAD: f6855d9faa6701d6109b5204ce7fd03e36507eee.

Only C1, C2 and C3 are approved. C4 and archival remain pending. This execution record is untracked and is not part of any approved commit boundary. Original inventory matched all 1,020 paths, their audited sizes and the original Git index fingerprint. Validation uses an isolated HEAD archive plus exactly the cumulative candidate paths, independently installed dependencies and the guarded local orderly_test database. No application source or original evidence is edited.

## C1

Commit: 8438b679e64ca106574af5172b9bb83231c42d9c

Message: feat(web): refine authentication, orders and guest tracking

Files: 92. 634 insertions, 422 deletions. Staged paths exactly matched C1 and the isolated snapshot; whitespace check passed.

Validation before commit:

- Frozen offline install passed without C3's axe dependency. Prisma client generation passed.
- Web lint and application/test TypeScript passed. Optimized Next build passed (20 static pages); API build passed through the browser runner. First standalone build attempt lacked the existing ORDERLY_BROWSER_PRODUCTION=1 local-origin exemption and was rejected; rerun using that established flag passed.
- Full web component suite initially had one unchanged checkout test exceed its five-second timeout (290 passed). Full rerun with --testTimeout=15000 passed all 291 tests / 38 suites. No test file changed.
- Production Chromium: 54 unique tests passed across the 11 registered suites. One additional unchanged storefront responsive test failed at storefront-configurator.spec.ts:35 awaiting image.decode(), with its 120-second timeout. Cause not established; full browser runner did not pass. Other storefront contrast test passed. The runner stopped after this failure; the seven transaction and presentation tests passed separately against fresh servers/build. This is an unresolved validation limitation, not a clean 55-test pass.
- Initial isolated browser preflight had a Compose project-name conflict, then sandbox Docker denial; rerun with COMPOSE_PROJECT_NAME=orderly and required tool elevation reused the running local test container. Only the guarded loopback orderly_test target was reset/seeded.

Failure evidence retained at C:/Users/ginro/AppData/Local/Temp/orderly-commit-phase1-mtP9wQ/c1-storefront-failure-preserved/. New browser output is isolated from repository evidence.

Changed paths:

- apps/web/src/app/(customer)/track-order/page.tsx
- apps/web/src/features/customer-auth/components/customer-auth-form.tsx
- apps/web/src/features/customer-orders/customer-order-detail-page.tsx
- apps/web/src/features/customer-orders/customer-order-status.tsx
- apps/web/src/features/customer-orders/customer-orders-loading.tsx
- apps/web/src/features/customer-orders/customer-orders-page.tsx
- apps/web/src/features/order-tracking/components/lookup/order-lookup-form.tsx
- apps/web/src/features/order-tracking/components/result/order-status-timeline.tsx
- apps/web/src/features/order-tracking/components/result/order-tracking-details.tsx
- apps/web/src/features/order-tracking/components/result/order-tracking-error-state.tsx
- apps/web/src/features/order-tracking/components/result/order-tracking-header.tsx
- apps/web/src/features/order-tracking/components/result/order-tracking-loading-state.tsx
- apps/web/src/features/order-tracking/components/result/order-tracking-result.tsx
- apps/web/src/features/order-tracking/components/result/order-tracking-verification-state.tsx
- apps/web/src/features/order-tracking/components/result/tracking-order-summary.tsx
- apps/web/test/browser/critical-workflow.spec.ts
- apps/web/test/browser/premium-auth-orders-tracking.spec.ts
- apps/web/test/browser/premium-transactions.spec.ts
- apps/web/test/browser/scripts/run-playwright.mjs
- apps/web/test/customer-auth-forms.test.tsx
- apps/web/test/premium-tracking-accessibility.test.tsx
- docs/stage-15.6-premium-auth-orders-tracking-report.md
- docs/stage-15.6-visuals/after/login-1440.png
- docs/stage-15.6-visuals/after/login-320.png
- docs/stage-15.6-visuals/after/login-390.png
- docs/stage-15.6-visuals/after/login-failure-320.png
- docs/stage-15.6-visuals/after/login-invalid-1440.png
- docs/stage-15.6-visuals/after/login-invalid-320.png
- docs/stage-15.6-visuals/after/login-invalid-390.png
- docs/stage-15.6-visuals/after/login-submitting-320.png
- docs/stage-15.6-visuals/after/order-detail-1440.png
- docs/stage-15.6-visuals/after/order-detail-320.png
- docs/stage-15.6-visuals/after/order-detail-390.png
- docs/stage-15.6-visuals/after/orders-1440.png
- docs/stage-15.6-visuals/after/orders-320.png
- docs/stage-15.6-visuals/after/orders-390.png
- docs/stage-15.6-visuals/after/orders-empty-320.png
- docs/stage-15.6-visuals/after/orders-error-320.png
- docs/stage-15.6-visuals/after/orders-loading-320.png
- docs/stage-15.6-visuals/after/register-1440.png
- docs/stage-15.6-visuals/after/register-320.png
- docs/stage-15.6-visuals/after/register-390.png
- docs/stage-15.6-visuals/after/tracking-accepted-320.png
- docs/stage-15.6-visuals/after/tracking-cancelled-320.png
- docs/stage-15.6-visuals/after/tracking-completed-320.png
- docs/stage-15.6-visuals/after/tracking-invalid-1440.png
- docs/stage-15.6-visuals/after/tracking-invalid-320.png
- docs/stage-15.6-visuals/after/tracking-invalid-390.png
- docs/stage-15.6-visuals/after/tracking-loading-320.png
- docs/stage-15.6-visuals/after/tracking-not-found-320.png
- docs/stage-15.6-visuals/after/tracking-ready-320.png
- docs/stage-15.6-visuals/after/tracking-refreshing-320.png
- docs/stage-15.6-visuals/after/tracking-result-1440.png
- docs/stage-15.6-visuals/after/tracking-result-320.png
- docs/stage-15.6-visuals/after/tracking-result-390.png
- docs/stage-15.6-visuals/after/tracking-search-1440.png
- docs/stage-15.6-visuals/after/tracking-search-320.png
- docs/stage-15.6-visuals/after/tracking-search-390.png
- docs/stage-15.6-visuals/after/tracking-unavailable-320.png
- docs/stage-15.6-visuals/after/tracking-verification-320.png
- docs/stage-15.6-visuals/before/login-1440.png
- docs/stage-15.6-visuals/before/login-320.png
- docs/stage-15.6-visuals/before/login-390.png
- docs/stage-15.6-visuals/before/login-failure-320.png
- docs/stage-15.6-visuals/before/login-invalid-1440.png
- docs/stage-15.6-visuals/before/login-invalid-320.png
- docs/stage-15.6-visuals/before/login-invalid-390.png
- docs/stage-15.6-visuals/before/order-detail-1440.png
- docs/stage-15.6-visuals/before/order-detail-320.png
- docs/stage-15.6-visuals/before/order-detail-390.png
- docs/stage-15.6-visuals/before/orders-1440.png
- docs/stage-15.6-visuals/before/orders-320.png
- docs/stage-15.6-visuals/before/orders-390.png
- docs/stage-15.6-visuals/before/orders-empty-320.png
- docs/stage-15.6-visuals/before/orders-error-320.png
- docs/stage-15.6-visuals/before/orders-loading-320.png
- docs/stage-15.6-visuals/before/register-1440.png
- docs/stage-15.6-visuals/before/register-320.png
- docs/stage-15.6-visuals/before/register-390.png
- docs/stage-15.6-visuals/before/tracking-invalid-1440.png
- docs/stage-15.6-visuals/before/tracking-invalid-320.png
- docs/stage-15.6-visuals/before/tracking-invalid-390.png
- docs/stage-15.6-visuals/before/tracking-not-found-320.png
- docs/stage-15.6-visuals/before/tracking-refreshing-320.png
- docs/stage-15.6-visuals/before/tracking-result-1440.png
- docs/stage-15.6-visuals/before/tracking-result-320.png
- docs/stage-15.6-visuals/before/tracking-result-390.png
- docs/stage-15.6-visuals/before/tracking-search-1440.png
- docs/stage-15.6-visuals/before/tracking-search-320.png
- docs/stage-15.6-visuals/before/tracking-search-390.png
- docs/stage-15.6-visuals/before/tracking-unavailable-320.png
- docs/stage-15.6-visuals/before/tracking-verification-320.png

## C2

Commit: 596d8a46d78a783c42ef83d13f5c3f34a052699a

Message: fix(web): keep customer drawer destinations keyboard reachable

Files: 4. 31 insertions, 1 deletion. Exact staged paths/snapshot and whitespace check passed.

Validation before commit:

- Full web component suite: 292 tests / 38 suites passed with --testTimeout=15000, including the new Tab-cycle regression.
- Web lint, application/test TypeScript and optimized Next production build passed (20 static pages). C3 tooling/dependencies were absent.
- First production Chromium customer-navigation run reported both tests passed, but its tool session disappeared before a final exit status was captured. Do not count that as a completed successful command.
- Confirmation run failed during API startup with Prisma P1001: localhost:5432 unavailable. Subsequent Docker check confirmed its Desktop engine pipe was missing. Browser confirmation is BLOCKED by missing local service, not passed. No production environment was used.

Changed paths:

- apps/web/src/components/layout/app-header-shell.tsx
- apps/web/src/components/layout/mobile-navigation.tsx
- apps/web/src/components/layout/site-header.tsx
- apps/web/test/mobile-navigation.test.tsx

## C3

Commit: 85d90468901ea3211a864e2c844509a538ea2a47

Message: test(web): add multi-engine accessibility acceptance audit

Files: 5. 431 insertions. Exact staged paths/snapshot and whitespace check passed.

Validation before commit:

- pnpm install --offline --frozen-lockfile passed, adding only the two resolved axe packages to this isolated snapshot.
- pnpm --filter web test --runInBand --testTimeout=15000: 292 tests / 38 suites passed.
- pnpm --filter web typecheck and pnpm --filter web lint passed.
- Optimized Next build passed, with ORDERLY_BROWSER_PRODUCTION=1 and the established exact loopback API origin, generating 20 static pages.
- Guarded Playwright acceptance configuration test discovery (--list) passed: 24 discovered cases across Chromium, Firefox and WebKit. Discovery is not test execution.
- summarize-acceptance.mjs passed in the temporary snapshot using copied historical account-1440 JSON/PNG inputs (one pair per engine), with assertions for three scans, three pictures, per-engine aggregation, generated gallery references and nonempty production build chunks (35 chunks). These are historical fixture inputs, not newly performed axe scans or refreshed Stage 15.7 evidence. Originals were not modified.
- Actual multi-engine acceptance execution was NOT performed because the local Docker/Postgres service became unavailable during C2 confirmation. No passing new multi-engine audit is claimed.

Changed paths:

- apps/web/package.json
- apps/web/playwright.acceptance.config.ts
- apps/web/test/browser/final-acceptance.spec.ts
- apps/web/test/browser/scripts/summarize-acceptance.mjs
- pnpm-lock.yaml


## Final repository state and remaining review

New HEAD: 85d90468901ea3211a864e2c844509a538ea2a47. Three new local commits follow the original HEAD, without history rewriting. No push or deployment occurred.

- 920 untracked paths remain: 916 Stage 15.7 evidence files, its two handoff documents, the readiness report and this execution record. Zero tracked modifications, zero staged files, zero deletions or unmerged entries remain.
- Original C4 boundary contains 561 paths; the original readiness report adds a further C4 candidate. The 357 Archive candidates remain in place and untracked. This execution record adds one separately reviewable document. No C4 or Archive candidate was committed or moved.
- All 1023 fingerprinted original input/ignored evidence files still exist with identical SHA-256 values: 1,019 audited inputs plus four ignored initial-audit evidence files. C1 screenshots were committed without modifying their bytes.
- Preserve the already ignored docs/stage-15.7-evidence/initial/test-results/ metadata, error context, screenshot and 133,817,622-byte Firefox trace. Preserve all five pending large traces and other untracked evidence. The readiness report contains their original manifests.
- Temporary snapshot/builds/dependencies and newly generated failure/validation outputs remain outside the approved Git boundaries. Root audit-artifacts/ contains the ignored explicit path plan and original-content fingerprints. Nothing was deleted. Initial isolated Compose preflight created an empty temporary project network/volume before hitting the existing container-name conflict; no cleanup was attempted.

C4 is ready for a separate review, but not approved for execution or unconditional publication. That review must settle privacy, archive access/retention, ignored-trace references, fresh-clone link completeness and provenance referencing these source commits. It must retain historical failures and conditional UAT, and include this run's unresolved storefront image-decoding timeout and subsequent missing-service limits rather than implying all checks passed. Restoring guarded local Docker and rerunning the blocked browser confirmations is recommended before a production acceptance claim.

Stopped after C3. Awaiting approval for C4, archival or any push.
