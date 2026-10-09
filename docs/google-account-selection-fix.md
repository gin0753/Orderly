# Google account selection UX fix

Investigation: 8 October 2026, Australia/Sydney. Baseline `8b924da`. No deployment, production data mutation or automatic commit was performed.

## Root cause

`GoogleProvider.authorizationUrl` in `apps/api/src/modules/customer-auth/google-provider.ts` previously omitted both `prompt` and `login_hint`. The application did not ask Google to display its account chooser, allowing the existing Google browser session to be reused. This is consistent with the reported repeated account selection; Google's actual production interaction was not captured or replayed in this investigation. Google documents [`prompt=select_account`](https://developers.google.com/identity/openid-connect/openid-connect#authenticationuriparameters) as requesting selection of a user account.

Orderly does not retain a login hint or selected email that pins the next attempt. `CustomerGoogleOAuthService.createTransaction` generates new state, browser binding, nonce and PKCE verifier on each initiation. A valid collision callback consumes its transaction, creates no new session and redirects to `/login?google=conflict`; the form can start another request. Integration/browser regressions verify that application state does not prevent this retry.

## Changes

- `apps/api/src/modules/customer-auth/google-provider.ts`: add `prompt: 'select_account'` to the real authorization URL. The shared builder applies it to both ordinary sign-in and explicit Connect Google. No login hint is added; no forced re-consent or arbitrary delays are introduced. The controlled test provider remains unchanged.
- `apps/api/test/google-provider.e2e-spec.ts`: exercise the real `openid-client` URL builder against the existing local OIDC configuration, checking chooser prompt, absent login hint, exact callback/scope/response type, state, nonce and S256 challenge for initial and retry requests.
- `apps/api/test/customer-google.e2e-spec.ts`: collision consumes the first transaction; retry gets fresh state/binding, signs in another identity, preserves the unlinked password account and cannot reuse the first callback to create accounts.
- `apps/web/test/browser/google-oauth.spec.ts`: extend the existing collision/linking journey to retry directly from the conflict screen, choose another identity, confirm fresh state and the correct account, then continue the original explicit-linking checks.
- This report.

PKCE, state/nonce checks, five-minute expiry, single consumption, same-email/current-password linking, subject uniqueness, session creation and cancellation handling are unchanged. The existing collision protection remains mandatory; matching email never silently links a password account.

## Request journey

Before: Continue with Google → fresh transaction → Google may reuse its current session → matching unlinked email → conflict → another fresh transaction with no explicit account-selection request.

After: Continue with Google → fresh transaction and `prompt=select_account` → Google account selection → matching unlinked email still conflicts → retry creates another fresh transaction and again requests account selection → choose a different identity → sign into/create its appropriate Orderly customer account.

The controlled browser provider offers explicit identities and does not emulate Google's account-cookie selection UI. It validates Orderly's retry journey; the real URL-builder test validates the actual prompt parameter. Together they protect application behavior but do not replace live Google UAT.

## Password UX review — separate finding

The 15-character minimum was not changed. Registration and password change visibly state “At least 15 characters, up to 72 UTF-8 bytes”; registration also explains that spaces are kept. Password inputs have labels and appropriate `current-password` or `new-password` autocomplete values. Registration has named fields and a show-password control. No copy/paste interception was found in the reviewed forms or shared input component. Existing form/account tests cover registration validation, autocomplete, password change and session replacement.

No confirmed password UX defect was found. Actual password-manager extensions were not tested; this review confirms conventional HTML support, not compatibility with every manager.

## Validation

All final checks passed. Local evidence is retained in ignored `audit-artifacts/google-account-selection/`.

| Check | Result | Evidence |
| --- | --- | --- |
| Google customer and signed OIDC provider integration suites | **26/26**, 2 suites | `api.log`; includes authorization URL and collision retry regressions, plus existing signature/claim/state/nonce/PKCE, expiry/replay, collision, connection, concurrency and cancellation checks against local PostgreSQL/local signed provider. |
| Existing Google configuration unit tests | **3/3** | `config.log` |
| Existing frontend auth forms, Google methods and account tests | **25/25**, 3 suites | `web.log` |
| Optimized Google/account Chromium browser workflows | **8/8** | `browser-final.log`; real local API/PostgreSQL and controlled provider. Collision retry is part of the existing Google suite. |
| API and optimized frontend builds | PASS | Browser wrapper rebuilds both; `browser-final.log`. |
| Repository lint | PASS | `lint-final.log`; final browser edit also checked in `browser-test-lint.log`. |
| API/frontend source and frontend test type checks | PASS | `typecheck.log` |
| API Prettier and final diff check | PASS | `format.log` and `git diff --check`. |

Total focused tests/workflows: **62/62**. The first lint run found formatting in the new integration test; it was corrected. The first browser run passed four, failed the new state capture and left three not run: the test read `page.url()` before navigation completed. An explicit wait for the controlled provider heading fixes that test race. The complete focused rerun passed all eight without skips or timeout changes. Initial evidence remains in `lint.log` and `browser.log`. Neither failure required a further authentication implementation change.

The full release quality gate and Docker build were not rerun for this focused task. No real Google secrets were used.

## Production retest

**A real Google production retest is required after the owner deploys the reviewed change.** In a browser with the originally conflicting Google account already signed in, attempt Orderly Google sign-in, confirm the chooser, select that account and receive the expected collision. Retry directly from that screen, verify the chooser appears again, select a different Google identity and confirm the intended Orderly account/session. Check cancellation and same-email explicit Connect Google as well. Confirm the outgoing Google URL has `prompt=select_account` and no app-supplied `login_hint`, without recording authorization codes, cookies or secrets in shared logs.

This change passes focused validation and is ready for reviewed deployment. Automated tests cannot certify the chooser displayed by Google's production UI or organizational account restrictions. No real Google credentials or production operations were used here.
