# Google OAuth post-logout browser investigation

9 October 2026, Australia/Sydney. No deployment, production mutation or automatic commit. Existing footer changes and owner asset deletions were preserved.

## Root cause and classification

**Test synchronization defect.** In `apps/web/test/browser/google-oauth.spec.ts`, the collision/retry/linking scenario clicked Sign out and immediately used `page.goto('/login')`. Click completion did not mean that the asynchronous logout thunk, session-lock acquisition, API revocation, cookie clearing and local state cleanup had completed. Full navigation could interrupt that work while the customer remained authenticated. The login form then correctly redirected to the account page, where the email is read-only and no password-login input exists.

The original failure at approximately line 85 was `await page.getByLabel('Email').fill(linkedEmail)`, **not a logout assertion**. Its 45,000ms timeout log showed the login input detach and resolve to the read-only account email `google.browser@example.com`. A neighbouring password fill can time out for the same navigation race.

Original full-run logs remain in `audit-artifacts/footer-browser-ci/full-browser.log` and `full-browser-rerun.log`. Their failure screenshots/traces were overwritten by later Playwright runs; the original request-level cancellation therefore cannot be independently proved from those old artifacts. This investigation captured and inspected a fresh controlled reproduction instead. No claim is made that it is an untouched original trace.

## Artifact and controlled reproduction evidence

A temporary local Playwright route held the second logout request without an arbitrary timer; the unchanged immediate navigation remained. This reproduced a 45.8s timeout at the password fill after the login form detached. The screenshot/error context showed Account, Sign out, a Google-only identity and its read-only email. The instrumentation was removed from the final scenario.

The preserved trace showed the pending second `POST /api/customer/auth/logout` at monotonic time 107581.689ms; navigation to `/login` began at 107588.027ms, **6.338ms later**. Logout had no received HTTP response (trace status -1). A subsequent `GET /api/customer/auth/me` at 107756.458ms returned **200**. This demonstrates that the old test could navigate before revocation and cookie cleanup, then re-enter the authenticated account page. It does not establish the exact timing of the two original uninstrumented failures.

Artifacts: ignored `audit-artifacts/google-logout/controlled-failure/trace.zip`, `test-failed-1.png`, `error-context.md`, and `controlled-before.log`. Screenshot and error context were read, and navigation/auth network events were inspected from the trace without printing credentials.

## Application flow review

- `CustomerSignOut` dispatches `logoutCustomer` asynchronously and displays a disabled Signing out control while it is pending.
- `customer-auth-api.ts` serializes logout through the existing customer session lock. The thunk awaits the API; only afterward does it invalidate the client, broadcast `ended` and settle unauthenticated state. Infrastructure errors do not masquerade as successful logout.
- The Nest controller awaits `CustomerAuthService.logout`, which deletes the signed refresh token's session, then clears customer cookies and returns 204. Active persisted-session checks reject the revoked access credential.
- Bootstrap suppresses competing rechecks while an operation is pending; request-ID checks reject obsolete thunk completions. Cross-tab `ended` clears customer state. No production bootstrap/session change was required.
- The store subscription clears registered customer-private data when identity changes or state becomes unauthenticated; registered query cleanup cancels/removes private queries. This boundary was preserved.
- The authentication form redirects an authenticated customer away from login; the account email is deliberately read-only. This is expected behavior while logout has not completed.
- `prompt=select_account` applies only to the real Google authorization URL. The controlled provider returns earlier in the builder and never uses that parameter; it cannot cause this local post-logout race.
- Playwright contexts have independent cookies/storage. The preceding Google test leaves a customer record in the shared test database, which is intentional returning-user coverage. Fresh isolated runs and a complete Google run passed before the fix; there is no evidence of cookie leakage, broken fixture ownership or persistent database corruption. Shared fixture state changes whether Google sign-in creates or reuses a customer, but its contribution to the earlier timing is not independently established.

Docker Desktop was stopped at the first new attempt, so the wrapper failed before browser execution. Starting Docker restored local PostgreSQL. This was a separate preflight dependency, not the explanation for the earlier browser timeouts.

## Fix and files changed by this investigation

- `apps/web/test/browser/google-oauth.spec.ts`: shared `signOut(page)` helper registers a logout-response waiter before clicking, requires 204, waits for the signed-out header, verifies both customer cookies were removed, and verifies the previous access cookie now receives 401. All four Google journey logout transitions use it before subsequent navigation. The peer-tab assertions remain intact.
- The same file adds a regression which gates the real logout request, checks pending UI, releases the request, then requires successful revocation and an editable login form. The gate is released in `finally`; there are no sleeps or increased timeouts.
- This report. Diagnostic runners/logs are local ignored artifacts.

No production authentication code, policy, credentials, schema or session rules changed. The existing footer fix and unrelated owner deletions were not modified by this investigation.

## Before/after reproduction and validation

Evidence is retained in ignored `audit-artifacts/google-logout/`.

| Reproduction/check | Actual result |
| --- | --- |
| Original full browser gate, twice before this fix | Critical 18/18; Google collision scenario failed at 45.8s and 45.7s, with a 45,000ms test timeout. Original logs retained under `footer-browser-ci/`. |
| Unchanged scenario independently with fresh fixtures | PASS, 10.0s (`before-independent.log`). |
| Unchanged scenario repeated twice, resetting fixtures each time | PASS at 9.6s and 10.2s (`before-repeated.log`); invocation elapsed times including server startup were 24,362ms and 21,460ms. |
| Complete unchanged Google suite in this investigation | 5/5 PASS, 38.9s (`before-google-suite.log`). This confirms timing sensitivity rather than an unconditional suite failure. |
| Controlled pending-logout reproduction with unsafe navigation | FAIL, 45.8s (`controlled-before.log`), with preserved screenshot/trace/context. The request gate deliberately held logout; this is diagnostic evidence, not a claim about real provider latency. |
| Fixed scenario repeated twice independently with fresh fixtures | PASS at 10.4s and 9.8s (`after-repeated.log`); invocation elapsed times 26,298ms and 22,339ms. |
| Complete fixed Google suite including new regression | 6/6 PASS, 35.2s (`after-google-suite.log`); original collision scenario 8.9s, gated pending-logout regression 1.9s. |
| Relevant ESLint and frontend source/test type checks | PASS, exit 0 (`lint.log`, `typecheck.log`). |
| Final complete production-mode browser wrapper | **42/42 PASS, exit 0**, no skipped workflows (`full-browser-final.log`). Builds and local database reset/seed ran through the existing wrapper. |
| Final `git diff --check` | PASS. |

The final complete command was `pnpm test:browser` with `ORDERLY_BROWSER_PRODUCTION=1` and the existing local `orderly_test` database URL. Its six suite results were:

| Workflow | Result | Playwright elapsed time |
| --- | --- | --- |
| Critical workflow | 18/18 | 51.2s |
| Google OAuth | 6/6 | 30.6s |
| Account | 3/3 | 23.9s |
| Checkout ownership | 6/6 | 32.8s |
| Private history | 6/6 | 29.7s |
| Anonymous authentication | 3/3 | 34.0s |

The total increased from 41 to 42 because of the new regression. No sleeps, timeout increases, retries, security relaxations or separate-run aggregation were used to claim the final complete-gate pass. Real Google production authorization was not exercised; this test synchronization change does not alter it.

## CI recommendation

**CI is ready to rerun with the reviewed test change.** The complete existing browser wrapper exited 0. Hosted GitHub Actions execution has not been observed by this local investigation. Controlled Google fixtures validate Orderly behavior rather than Google's live UI.
