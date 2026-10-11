# C4 public evidence index

Source HEAD: 85d90468901ea3211a864e2c844509a538ea2a47. Historical observations, not a new acceptance run.

[Acceptance handoff](c4-acceptance-publication-handoff.md), [manual UAT](stage-15.7-manual-uat-checklist.md), [scan catalog](c4-public-axe-scan-catalog.json), [retention decisions](c4-final-retention-decisions.md), [privacy review](c4-privacy-review-summary.md), [link resolution](c4-documentation-link-resolution.md), [validation checklist](c4-commit-validation-checklist.md).

## Representative screenshots

25 reviewed images cover desktop, tablet, mobile and narrow widths, storefront/configurator, empty checkout, cart, authentication, loading/not-found states and retained Firefox/WebKit findings. Contact-bearing detail/tracking/profile views remain restricted pending fixture privacy decisions; this is an explicit coverage limitation. C1's already tracked Stage 15.6 comparison images remain available.

- [chromium/cart-390.png](stage-15.7-evidence/chromium/cart-390.png)
- [chromium/checkout-delivery-1440.png](stage-15.7-evidence/chromium/checkout-delivery-1440.png)
- [chromium/checkout-delivery-320.png](stage-15.7-evidence/chromium/checkout-delivery-320.png)
- [chromium/checkout-delivery-390.png](stage-15.7-evidence/chromium/checkout-delivery-390.png)
- [chromium/checkout-delivery-768.png](stage-15.7-evidence/chromium/checkout-delivery-768.png)
- [chromium/checkout-pickup-320.png](stage-15.7-evidence/chromium/checkout-pickup-320.png)
- [chromium/configurator-1440.png](stage-15.7-evidence/chromium/configurator-1440.png)
- [chromium/configurator-320.png](stage-15.7-evidence/chromium/configurator-320.png)
- [chromium/configurator-390.png](stage-15.7-evidence/chromium/configurator-390.png)
- [chromium/configurator-768.png](stage-15.7-evidence/chromium/configurator-768.png)
- [chromium/confirmation-390.png](stage-15.7-evidence/chromium/confirmation-390.png)
- [chromium/login-1440.png](stage-15.7-evidence/chromium/login-1440.png)
- [chromium/register-320.png](stage-15.7-evidence/chromium/register-320.png)
- [chromium/storefront-1440.png](stage-15.7-evidence/chromium/storefront-1440.png)
- [chromium/storefront-320.png](stage-15.7-evidence/chromium/storefront-320.png)
- [chromium/storefront-390.png](stage-15.7-evidence/chromium/storefront-390.png)
- [chromium/storefront-768.png](stage-15.7-evidence/chromium/storefront-768.png)
- [initial/firefox/login-root-text-200-percent-320.png](stage-15.7-evidence/initial/firefox/login-root-text-200-percent-320.png)
- [states/orders-error-320.png](stage-15.7-evidence/states/orders-error-320.png)
- [states/orders-loading-320.png](stage-15.7-evidence/states/orders-loading-320.png)
- [states/tracking-loading-320.png](stage-15.7-evidence/states/tracking-loading-320.png)
- [states/tracking-not-found-320.png](stage-15.7-evidence/states/tracking-not-found-320.png)
- [states/tracking-search-320.png](stage-15.7-evidence/states/tracking-search-320.png)
- [webkit-second-run-failures/final-acceptance-fixed-che-e12e6-nd-bottom-in-four-viewports-webkit/test-failed-1.png](stage-15.7-evidence/webkit-second-run-failures/final-acceptance-fixed-che-e12e6-nd-bottom-in-four-viewports-webkit/test-failed-1.png)
- [webkit/navigation-focus-after-390.png](stage-15.7-evidence/webkit/navigation-focus-after-390.png)

## Restricted historical originals

No archive URL or download is claimed. Resolve these identifiers through the [archive manifest](c4-archive-verification-manifest.json); all 1,067 copied files have verified destination checksums at the approved private local location. No public retrieval endpoint exists. Restore the original-path companion bundle only in a restricted review workspace. The original report and galleries are preserved unchanged and are excluded from this public inventory.

### Original gallery

<a id="original-gallery"></a>

Original ID: `docs/stage-15.7-evidence/screenshots.html`. SHA-256: `bcd9ab8e5f7480d98d7cb5f1ee7ff93562bb6b9291572d53f62ba17015a360f0`. Its original historical report link is retained in the archive bundle, never represented as publicly accessible.

### Original WebKit keyboard failure screenshot

<a id="original-keyboard-failure-screenshot"></a>

Original ID: `docs/stage-15.7-evidence/webkit-focus-before/final-acceptance-rendered--0ce94-tainment-across-four-widths-webkit/test-failed-1.png`. SHA-256: `88ce47d47aaded812e46d07aeabdee2dbaa49e884445261739bbf4398a5c964f`. Its original historical report link is retained in the archive bundle, never represented as publicly accessible.

### Original WebKit keyboard failure trace

<a id="original-keyboard-failure-trace"></a>

Original ID: `docs/stage-15.7-evidence/webkit-focus-before/final-acceptance-rendered--0ce94-tainment-across-four-widths-webkit/trace.zip`. SHA-256: `6b1f4e970dc0190c561eb8ae5fdeceaad61b7a3a642f1a10e956d7a400da8c33`. Its original historical report link is retained in the archive bundle, never represented as publicly accessible.

## Reproduction

Use an isolated checkout with frozen dependencies, generated Prisma client and installed Playwright engines. Verify the existing local test database guard before reset/seed; supply TEST_DATABASE_URL privately and use only the guarded loopback orderly_test target. Do not copy private environment files into evidence. Run `pnpm test:browser` for the production-backed baseline and the committed `playwright.acceptance.config.ts` suite with distinct ORDERLY_ACCEPTANCE_EVIDENCE_DIR and ORDERLY_ACCEPTANCE_RESULTS_FILE outputs. See committed `apps/web/test/browser/scripts/run-playwright.mjs`, `apps/web/test/browser/final-acceptance.spec.ts` and `apps/web/test/browser/scripts/summarize-acceptance.mjs` for actual startup, seed and summarization prerequisites. Google regressions use the controlled provider. Summarize a complete newly generated dataset in isolation; do not regenerate historical galleries over this subset. Missing services mean BLOCKED, never PASSED. Record source SHA, command, exit status and versions without secrets.
