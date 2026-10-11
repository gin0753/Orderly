# Storefront image decode timeout fix

Prepared 11 October 2026. Working baseline and failed GitHub run SHA: `4c4e3428550cedfe7850802adf7c00c9d81c49ad`. Changes are uncommitted. No application rendering, business behavior, API, database schema, deployment or Git index/history changes were made.

## Diagnosis and evidence

The test's definite reliability defect was an **unbounded Promise.all over every image.decode()**, including native lazy/offscreen images. Catching decode rejections did not bound a promise that never settled; it also suppressed real decode failures. The configurator contained another unbounded decode call.

The [failed GitHub CI run](https://github.com/gin0753/Orderly/actions/runs/38102918515) failed the Quality job's Test step. Its artifact API returned **zero artifacts**. The workflow does not upload browser failure artifacts, so the GitHub screenshot, trace and error context could not be retrieved. The user's reported timeout location is consistent with the preserved C1 failure, but identical underlying GitHub image behavior cannot be independently confirmed.

Reviewed the preserved C1 screenshot, error-context Markdown and trace ZIP in the private `phase1-snapshot/c1-storefront-failure-preserved/` evidence namespace. Originals were read without alteration; no cookies, request headers, identity fields or secret values were exported. The screenshot shows a rendered 390px storefront and loaded hero; the context includes all four fixture products.

Trace findings:

- The 1440px iteration's aggregate decode completed. The next navigation/viewport was the 390px iteration, where the second aggregate decode had a start record but no completion record.
- Desktop fixture image responses were HTTP 200. On the mobile pass the mushroom-pizza images at widths 640 and 384 also returned HTTP 200.
- The width-384 pepperoni, carbonara and wings image entries had status/duration **-1**: no completed response was recorded before termination. Those image tags use native `loading="lazy"`.
- These unfinished entries are **not proof of HTTP error responses** or decode rejection. Trace instrumentation does not establish why these three requests remained unfinished, nor which individual decode promise held the aggregate. A transport/image-optimizer/browser lazy-loading interaction remains possible.
- A real Chromium reproduction confirms that decode on an offscreen lazy image can remain pending until the test explicitly brings it into view. That demonstrates the defective wait assumption; it does not prove the complete cause of the production-backed CI stall.

No production image defect was established. Application loading priorities, lazy behavior, assets and image optimization were left unchanged.

## Exact files changed

Proposed review boundary:

1. `apps/web/test/browser/storefront-configurator.spec.ts` — replace both unbounded required waits, add image request diagnostics and six helper regression cases.
2. `apps/web/test/browser/image-readiness.ts` — new bounded required-image assertion and optional-image diagnostic helper.
3. `docs/storefront-image-decode-timeout-fix-report.md` — this report.

Local-only ignored tooling/output: `audit-artifacts/storefront-image-readiness.config.ts`, `audit-artifacts/storefront-image-readiness-results.json`, and its test-output directory. They isolate the helper's synthetic Chromium tests without starting API/database services. Existing historical evidence and the external archive were not edited or cleaned. No repository workflow or production configuration was changed.

## Before and after

| Concern | Before | After |
| --- | --- | --- |
| Required storefront photos | All images decoded in one unbounded aggregate; rejections swallowed | Hero and **all four product fixture photos** individually scrolled into view, checked for completed load/positive natural dimensions and successful decode |
| Configurator photo | Unbounded decode | Same required-image assertion |
| Deadline | Eventually consumed the whole 120-second test timeout | Eight-second per-required-image budget, plus 250ms outer watchdog margin; test/global timeout unchanged |
| Optional imagery | Could block required interactions; failures swallowed | Two-second bounded diagnostic budget; broken/visible pending/decode-failed images produce JSON attachments and explicit warning annotations |
| Offscreen lazy image | Decode attempted before ensuring loading | Required images are explicitly visited; optional unloaded offscreen lazy images are recorded as deferred, not called decoded or failed |
| Main-thread/transport stall | No independent deadline | Node watchdog bounds the page operation when browser timers cannot run |
| Failure classification | Generic whole-test timeout | Load failure/timeout, decode rejection/timeout, locator/page-operation failure, plus HTTP status/network-failure diagnostics |

Required failures throw and fail the test; optional warning behavior never applies to the hero, configured product photos or dialog photo. Missing image elements/fallback rendering also fail the required locator check. Diagnostics include labels, relative source paths, dimensions and outcomes; query strings, credentials, image bodies and request headers are omitted.

The existing 1440×900, 390×844 and 320×568 viewport loop remains unchanged. Hierarchy, focus, modifier selection, quantity, totals, scroll containment, Escape/focus restoration, reduced motion, cart feedback and category interactions remain. The test restores scroll to the top after visiting photos for the existing storefront capture. The guarded fixture creation/restoration remains in place; no new production data logic was introduced.

## Validation executed

| Check | Result |
| --- | --- |
| Final isolated real-Chromium helper suite | **30/30 passed:** six cases, five repetitions each, 22.6 seconds |
| Earlier helper iterations | Two four-case runs with five repetitions each: 20/20 and 20/20 passed; final code is represented by the 30-case run |
| Offscreen lazy reproduction | Old decode remained pending at the bounded 100ms probe; explicit inspection then loaded/decoded successfully in all five final repetitions |
| Broken required image | Controlled HTTP 404 correctly rejected as load-failed |
| Required decode stall/rejection | Both correctly rejected instead of passing or exhausting the test timeout |
| Optional diagnostics | Controlled timeout, rejection, visible pending load and broken load recorded; unloaded offscreen lazy photo explicitly deferred |
| Web TypeScript | `pnpm --filter web typecheck` passed; includes browser test TypeScript; rerun after final test/helper changes passed |
| Web lint | `pnpm --filter web lint` passed; explicit ESLint check of both final changed test/helper files also passed |
| Relevant production build | `pnpm --filter web build` passed with the established local `ORDERLY_BROWSER_PRODUCTION=1`/loopback API-origin build flags; 20 static pages generated |
| Focused full storefront/configurator suite, repeat-each=3 | **BLOCKED before tests/reset:** database guard rejected the configured target as outside its loopback orderly_test allowlist |
| Broader production-backed browser regressions | **BLOCKED:** same guard preflight; Docker Desktop Linux engine pipe also unavailable |
| Whitespace/scope review | `git diff --check` passed; no application source/configuration changes |

The guard rejection occurred before database connection/reset. No production customer data was accessed or mutated. The isolated Chromium helper tests use controlled route fulfillment/data images, not a deployed application or customer database. Their passing results do **not** establish that the entire storefront scenario or CI regression now passes.

Commands used:

```powershell
pnpm --filter web exec playwright test --config ../../audit-artifacts/storefront-image-readiness.config.ts --repeat-each=5
pnpm --filter web typecheck
pnpm --filter web lint
pnpm --filter web exec eslint test/browser/image-readiness.ts test/browser/storefront-configurator.spec.ts
# Established local-only production build settings were applied to this subprocess.
pnpm --filter web build
pnpm test:browser storefront-configurator.spec.ts --repeat-each=3
```

The last command was an attempted validation, not a passing result. To reproduce the isolated check in another checkout, use a temporary Playwright config with the normal Chromium project, `testMatch: "storefront-configurator.spec.ts"`, `grep: /image readiness:/`, no webServer, and output paths isolated from retained evidence. For full validation, restore an available local test database and privately supply a guard-compliant TEST_DATABASE_URL; never reuse a deployed database. Use the existing production browser wrapper and its fixture/seed guard. No guard was bypassed here.

## Remaining CI risks and review recommendation

- The full three-viewport storefront/configurator scenario and broader browser regression need a fresh guarded local/CI execution. Its real image optimizer/network timing is not reproduced by synthetic SVG cases.
- An actual required image taking longer than eight seconds will fail with a useful classification. Reconsider that local budget only from recorded CI measurements; do not restore an unbounded aggregate or suppress required failures.
- The underlying unfinished mobile fixture requests remain unexplained. New image-response/request-failure attachments distinguish HTTP failures from load/decode deadlines; a page-operation deadline is evidence of an unresolved page/transport operation, not proof of an image defect.
- The Node watchdog does not cancel an in-flight evaluation; ordinary failed-test page teardown closes it. A separately observed browser-process failure remains a failed test.
- GitHub currently uploads no failure artifacts. Attachments remain local test output unless the owner separately approves a privacy-reviewed artifact-upload workflow; that workflow was not added in this fix.
- Other suites' existing decode helpers were inspected but not changed: final acceptance only decodes completed images, and the optional transaction capture helper still has its own unbounded wait. Migrating those helpers is outside this focused fix and should be reviewed separately if they fail.

Implementation and bounded-helper verification are complete, with the full integration checks explicitly blocked. Await review before any commit; no commit, push, merge or deployment was performed.
