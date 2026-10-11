# C4 evidence index and reproduction handoff

Prepared 11 October 2026 (Australia/Sydney). This additive index preserves the historical reports; none was rewritten. Current source HEAD: 85d90468901ea3211a864e2c844509a538ea2a47. It is not a new test-run verdict.

[Retention plan](c4-evidence-retention-plan.md), [machine manifest](c4-evidence-manifest.json), [explicit proposed paths](c4-proposed-commit-paths.txt), [privacy decisions](c4-unresolved-privacy-decisions.md), [archive candidates](c4-external-archive-candidates.json) and [link audit](c4-documentation-link-audit.json).

Historical inputs: [Stage 15.7 report](stage-15.7-final-production-acceptance-report.md), [manual UAT](stage-15.7-manual-uat-checklist.md), [commit readiness](git-commit-readiness-report.md) and [Phase 1 execution](git-commit-execution-phase-1-report.md). Current evidence captures were taken before C1–C3 were committed; their original report records the working-tree provenance. Do not relabel those bytes as newly executed against current HEAD.

## Lookup and archive contract

Use original repository-relative path as evidence ID; find its category, intended disposition, SHA-256, byte size, source scope and proposed archive path in the manifest. Every remaining and relevant ignored file has an entry. For temporary Phase 1 files the original repository path is null; source_location is an alias resolved from the ignored Phase 1 plan, avoiding publication of a user-directory path. An archive provider URL is intentionally absent. Later approval must add a durable catalog mapping IDs to immutable objects, checksum-verification receipt, access class and retention policy.

Historical local links still resolve now. A future minimal Git clone will not contain the full original gallery or all traces. This index makes that limitation explicit; it is not a redirect for those historical Markdown links. Preserve a complete original-path companion bundle or obtain approval for exact link edits before publication.

## Selected visual evidence

40 PNGs preserve the four-width comparisons, core journeys, authenticated/guest views, focused auth failure, loading/error/cancellation states, the WebKit drawer fix, the initial Firefox enlargement failure and one WebKit checkout failure. C1 already tracks 70 Stage 15.6 before/after images; those remain available and need no duplicate addition. Full final engine axe results preserve all 210 scans, including unresolved incomplete rules. Remaining images and traces remain in place for the proposed archive/review process.

- [chromium/storefront-1440.png](stage-15.7-evidence/chromium/storefront-1440.png)
- [chromium/storefront-768.png](stage-15.7-evidence/chromium/storefront-768.png)
- [chromium/storefront-390.png](stage-15.7-evidence/chromium/storefront-390.png)
- [chromium/storefront-320.png](stage-15.7-evidence/chromium/storefront-320.png)
- [chromium/configurator-1440.png](stage-15.7-evidence/chromium/configurator-1440.png)
- [chromium/configurator-768.png](stage-15.7-evidence/chromium/configurator-768.png)
- [chromium/configurator-390.png](stage-15.7-evidence/chromium/configurator-390.png)
- [chromium/configurator-320.png](stage-15.7-evidence/chromium/configurator-320.png)
- [chromium/checkout-delivery-1440.png](stage-15.7-evidence/chromium/checkout-delivery-1440.png)
- [chromium/checkout-delivery-768.png](stage-15.7-evidence/chromium/checkout-delivery-768.png)
- [chromium/checkout-delivery-390.png](stage-15.7-evidence/chromium/checkout-delivery-390.png)
- [chromium/checkout-delivery-320.png](stage-15.7-evidence/chromium/checkout-delivery-320.png)
- [chromium/order-detail-1440.png](stage-15.7-evidence/chromium/order-detail-1440.png)
- [chromium/order-detail-768.png](stage-15.7-evidence/chromium/order-detail-768.png)
- [chromium/order-detail-390.png](stage-15.7-evidence/chromium/order-detail-390.png)
- [chromium/order-detail-320.png](stage-15.7-evidence/chromium/order-detail-320.png)
- [chromium/tracking-result-1440.png](stage-15.7-evidence/chromium/tracking-result-1440.png)
- [chromium/tracking-result-768.png](stage-15.7-evidence/chromium/tracking-result-768.png)
- [chromium/tracking-result-390.png](stage-15.7-evidence/chromium/tracking-result-390.png)
- [chromium/tracking-result-320.png](stage-15.7-evidence/chromium/tracking-result-320.png)
- [chromium/cart-390.png](stage-15.7-evidence/chromium/cart-390.png)
- [chromium/checkout-pickup-320.png](stage-15.7-evidence/chromium/checkout-pickup-320.png)
- [chromium/confirmation-390.png](stage-15.7-evidence/chromium/confirmation-390.png)
- [chromium/login-1440.png](stage-15.7-evidence/chromium/login-1440.png)
- [chromium/register-320.png](stage-15.7-evidence/chromium/register-320.png)
- [chromium/account-768.png](stage-15.7-evidence/chromium/account-768.png)
- [chromium/security-390.png](stage-15.7-evidence/chromium/security-390.png)
- [states/login-failure-viewport-320.png](stage-15.7-evidence/states/login-failure-viewport-320.png)
- [states/orders-loading-320.png](stage-15.7-evidence/states/orders-loading-320.png)
- [states/tracking-loading-320.png](stage-15.7-evidence/states/tracking-loading-320.png)
- [states/tracking-not-found-320.png](stage-15.7-evidence/states/tracking-not-found-320.png)
- [webkit/navigation-focus-after-390.png](stage-15.7-evidence/webkit/navigation-focus-after-390.png)
- [initial/firefox/login-root-text-200-percent-320.png](stage-15.7-evidence/initial/firefox/login-root-text-200-percent-320.png)
- [webkit-second-run-failures/final-acceptance-fixed-che-e12e6-nd-bottom-in-four-viewports-webkit/test-failed-1.png](stage-15.7-evidence/webkit-second-run-failures/final-acceptance-fixed-che-e12e6-nd-bottom-in-four-viewports-webkit/test-failed-1.png)
- [states/tracking-cancelled-320.png](stage-15.7-evidence/states/tracking-cancelled-320.png)
- [states/orders-390.png](stage-15.7-evidence/states/orders-390.png)
- [states/tracking-search-320.png](stage-15.7-evidence/states/tracking-search-320.png)
- [states/orders-error-320.png](stage-15.7-evidence/states/orders-error-320.png)
- [states/login-submitting-320.png](stage-15.7-evidence/states/login-submitting-320.png)
- [states/login-failure-320.png](stage-15.7-evidence/states/login-failure-320.png)

## Failure and validation provenance

The Stage 15.7 historical result was PASS WITH CONDITIONS, with failed combined WebKit runs, an initial Firefox enlargement overflow, authentication CLS findings and manual UAT outstanding. Retain failed and later isolated passing runs as distinct events. [Phase 1 execution](git-commit-execution-phase-1-report.md) records 54 passing Chromium tests plus one unresolved image-decode timeout; C2's browser confirmation and C3 live multi-engine execution were blocked when the local database service became unavailable. The extra temporary failure record is fingerprinted separately, not silently added to the old Stage 15.7 counts.

## Reproduction instructions — not executed during preparation

Use an isolated checkout/workspace of current HEAD, with its own outputs and dependencies. Verify an available local Docker/PostgreSQL service and the repository guard before any test-database operation. TEST_DATABASE_URL must come from local private configuration, target only loopback orderly_test with schema=public, and never be a deployed/customer database. Do not display it or copy private environment files into evidence. Install the frozen lockfile and generate Prisma; retain all existing migrations, fixture assets and seeds. Browser engines are runtime prerequisites, not Git evidence.

Example sequence for the isolated workspace, after separately authorized test execution:

```powershell
# Set TEST_DATABASE_URL privately before running these commands.
$env:NODE_ENV='test'
$env:DATABASE_URL=$env:TEST_DATABASE_URL
$env:DIRECT_DATABASE_URL=$env:TEST_DATABASE_URL
$env:COMPOSE_PROJECT_NAME='orderly'
$env:ORDERLY_BROWSER_PRODUCTION='1'
$env:ORDERLY_API_ORIGIN='http://localhost:4000'
$env:ORDERLY_PROXY_IDENTITY_SECRET=node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))"
pnpm install --frozen-lockfile
pnpm --filter api exec prisma generate
pnpm --filter api test:db:reset
pnpm --filter api exec tsx ./test/scripts/seed-browser-test-data.ts
pnpm --filter api build
pnpm --filter web build
$env:ORDERLY_ACCEPTANCE_EVIDENCE_DIR=Join-Path $PWD 'docs/stage-15.7-evidence'
$env:ORDERLY_ACCEPTANCE_RESULTS_FILE=Join-Path $PWD 'audit-artifacts/new-acceptance-results.json'
pnpm --filter web exec playwright test --config playwright.acceptance.config.ts --output=../../audit-artifacts/new-acceptance-failures
```

This must run only in the isolated workspace: the acceptance test changes/restores the guarded photo fixture and writes evidence. Full baseline regression uses the existing guarded production wrapper, pnpm test:browser, and starts fresh servers between suites. Google regression uses the controlled local provider, never live external authentication. Set ORDERLY_ACCEPTANCE_COMBINED_JOURNEY=1 for the documented combined diagnostic; dom-only/screenshots-only instrumentation explicitly skips axe and must go to distinct evidence/result directories. Do not count those outputs as axe passes.

The summarizer currently reads docs/stage-15.7-evidence and local .next chunks and writes summary.json/screenshots.html there. Run it only on a complete new isolated run/bundle; running it over this reduced proposed Git selection would change historical screenshot counts and gallery coverage. Record command, exit status, source SHA, environment versions, runtime flags and guard result without credentials. If services/engines are absent, record BLOCKED rather than PASSED.
