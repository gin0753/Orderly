# Customer logout / navigation regression investigation

Date: 12 October 2026. Baseline checkout: `98d4790`, with the already accepted storefront test/diagnostics changes present. No production data, authentication architecture, storefront image code/readiness checks, commits, pushes or deployment changed.

## Diagnosis

The demonstrated root cause is **missing logout-completion synchronization in the account browser test**. Both its password and Google-linking journeys clicked Sign out and immediately issued `page.goto('/login')`. A Playwright click waits for the click action, not the asynchronous Redux thunk, Web Lock, API revocation, response cookie processing or subsequent UI transition.

The retained combined-run trace and screenshot show an authenticated `/account` page, not a login form. The sanitized timeline extracted from that trace places `/login` navigation at monotonic 27,283.029ms, the logout request at 27,300.906ms, and the subsequent `/me` at 27,398.801ms. Logout has trace status `-1`, total time `-1`, and no recorded failure text: this means incomplete/unknown, not HTTP failure or proof of a specific browser abort. `/me` returned 200 in approximately 21.3ms. Navigation therefore began before the recorded logout request and before any acknowledged completion. The authenticated redirect is consistent with a session that has not yet been revoked.

An unchanged isolated production account run passed all three original cases. That does not negate the prior combined-run failure: the test outcome depends on whether logout finishes before the forced document navigation. There is no evidence that the API returned successful logout while leaving that session valid.

Two exploratory diagnostics held logout pending and forced the same hard document navigation. Both reproduced `/account` and an old access credential returning 200 while logout was pending. One used request interception; the other held a single guarded synthetic session row and confirmed the real API DELETE waiting on a database lock. Both diagnostics **timed out awaiting a specific CDP cancellation event**. They are retained failures, not passing acceptance evidence. Neither establishes whether the original request was canceled before delivery, remained pending, or continued on the server after document teardown. The second diagnostic made no request interception or application changes. Its temporary database lock was confined to the synthetic database and released with the diagnostic connection teardown before the next guarded reset.

The correction does not depend on resolving that transport detail: a new document must not assume the session is gone until the logout endpoint and browser state have completed.

## Application behavior inspected

- `customer-sign-out.tsx` dispatches the asynchronous logout and displays a disabled “Signing out…” control while the operation is pending.
- `customer-auth-api.ts` runs logout within `customerClient.sessionLock`, coordinating cookie mutation with refresh operations. `customer-api-fetch.ts` awaits the HTTP request and does not request fetch `keepalive` delivery.
- `customer-auth-slice.ts` waits for the logout API before invalidating the client generation, publishing the session-ended event, and clearing local identity. Nonterminal errors preserve authenticated state for retry; completion is not claimed early.
- The customer controller awaits `CustomerAuthService.logout` before clearing cookies and returning 204. The service deletes the session using the signed refresh credential's customer/session identity. Cookie clearing uses the original `/api` path, HttpOnly, SameSite=Lax and configured Secure setting, with `private, no-store` responses.
- Authenticated `/me` checks require the persisted session. The test now independently checks both old access and refresh credentials after logout, instead of relying only on UI disappearance.

No application source changes were necessary on the available evidence. Normal in-app Menu navigation while revocation is pending passed the new production regression case: the real logout request continues after an explicit test event gate is released, then cookies disappear, old access and refresh credentials return 401, and a fresh login form is editable. This is a real endpoint/credential check with controlled request scheduling, not a mocked successful logout response.

## Narrow test correction

The two existing logout steps now call a local test helper that:

1. Captures the current access/refresh credentials in memory, without logging them.
2. Registers the POST logout response observer before clicking Sign out.
3. Requires HTTP 204 and the anonymous Sign in link.
4. Requires both customer cookies to be absent.
5. Requires `/me` with the old access credential and `/refresh` with the old refresh credential to return 401.
6. Allows the existing `/login` navigation and password/Google assertions to proceed only afterward.

All existing password-change, cross-browser revocation, old-password rejection, new-password login, Google method and responsive assertions remain. There are no sleeps, added retries, widened timeouts or disabled assertions. The additional pending-Menu-navigation case verifies the ordinary user route separately from the artificial hard-navigation sequence.

## Files changed in this investigation

- `apps/web/test/browser/customer-account.spec.ts`: synchronized logout helper with cookie/access/refresh revocation assertions; apply it at both premature navigation sites; add the pending logout plus Menu navigation regression.
- `docs/v1-customer-logout-navigation-regression-report.md`: this report.

The pre-existing changes to `.github/workflows/ci.yml`, `image-readiness.ts`, `storefront-configurator.spec.ts` and the storefront investigation report were left untouched. Diagnostic scripts, traces, screenshots and logs are ignored local files under `audit-artifacts/`, not application changes.

## Validation evidence

All database-backed runs used the existing guard requiring `NODE_ENV=test`, matching loopback Prisma URLs, database `orderly_test`, schema `public`, and no deployment markers. Synthetic accounts only; Google provider behavior is mocked by the existing browser environment. Database resets/integration suites are run sequentially to avoid interference. Browser workers: one; retries: zero.

| Run | Result | Evidence |
| --- | --- | --- |
| Original combined storefront investigation | 60 passed / 1 failed across initial run and continuation; account failure retained | `audit-artifacts/image-full-account-failure/`; `audit-artifacts/image-production-full.log`; `audit-artifacts/logout-original-sanitized-timeline.json` |
| Unchanged isolated production account suite | **3 passed** | `audit-artifacts/logout-baseline.log` |
| Intercepted pending logout + hard navigation diagnostic | **Failed** waiting for CDP cancellation; observed authenticated redirect, not an accepted clean run | `audit-artifacts/logout-controlled-reproduction.log` and retained failure trace/screenshot |
| Real pending API DELETE + hard navigation diagnostic | **Failed** waiting for CDP cancellation; pending-navigation timeline retained | `audit-artifacts/logout-real-cancellation.log`; `audit-artifacts/logout-real-cancellation/**/sanitized-native-logout-timeline.json` |
| Corrected production account suite | **4 passed** | `audit-artifacts/logout-corrected-focused.log` |
| Relevant web auth state/navigation/bootstrap/client/routing components | **5 suites / 27 tests passed** | `audit-artifacts/logout-components.log` |
| Complete production browser regression, including auth/session and storefront regressions | **11 suites / 62 cases passed**, uninterrupted; zero retries, failures or skipped cases | `audit-artifacts/logout-production-full.log` |
| API auth configuration/service unit regressions | **3 suites / 23 tests passed** | `audit-artifacts/logout-api-unit.log` |
| Complete guarded API integration regressions | **11 suites / 121 tests passed** | `audit-artifacts/logout-api-integration.log` |
| API/Web TypeScript and lint | **Passed**, both `EXIT_CODE=0` | `audit-artifacts/logout-typecheck.log`; `audit-artifacts/logout-lint.log` |
| API/Web production builds | Focused production builds passed; combined production rebuild passed | Baseline, corrected-focused and full browser logs |

## Remaining security and release implications

Completed logout must mean server revocation and cookie clearing, not merely a click. The corrected test asserts that contract directly, including refusal to refresh the revoked session. The ordinary in-app navigation path has passed; no completed-logout session-revival defect has been demonstrated.

A real user who replaces/reloads/closes the document before logout completes can exercise related request/lifecycle behavior. This is not accurately described as something only automation can trigger. The current UI indicates pending work and does not claim completion early; forced document replacement is different from clicking the ordinary Menu link. The exact original transport interruption stage remains uncertain. Do not infer that an incomplete request must have been canceled, or that a partially initiated logout guarantees revocation.

**Disposition: PASS for the narrowly scoped test correction and completed-logout/ordinary-navigation contract.** The corrected account suite passed both in isolation and in the uninterrupted complete production browser regression, after the preceding critical-workflow, navigation and Google suites. This closes the observed test synchronization failure locally. The complete API integration suite also passed, including logout revocation/idempotence, customer/Admin separation, refresh replay, password/session replacement and persistence-failure behavior. Logged simulated database outages belong to asserted negative cases, not unreported failing tests. The two exploratory diagnostic timeouts remain recorded and do not establish a browser abort mechanism.

No authentication architecture change, keepalive policy or unload interception is proposed without evidence of a completed-logout or ordinary-navigation application defect. Hosted CI and real-browser staging remain external confirmation steps. For staging, use synthetic accounts to verify ordinary logout plus login/reload, delayed logout plus Menu navigation, same-context peer-tab invalidation, and forced refresh/address-bar navigation while the UI still says Signing out. In the last case, inspect actual server revocation and cookie outcomes rather than assuming a click has completed logout.
