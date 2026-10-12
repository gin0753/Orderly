# CI customer-account registration fixture regression

Date: 12 October 2026. Baseline checkout: `5ed14b8`.

## Confirmed root cause

The pending-logout browser case retained the pre-Security-2A registration setup. It navigated to `/register`, filled Name and Email, then waited for Password and Confirm password there before clicking Create account. Security 2A removed those fields from `/register`; the email owner establishes credentials on `/verify-email` after mailbox verification. The first three account cases already used `verifiedRegistration`, but this fourth setup had not been migrated.

A guarded local production-build reproduction failed at 45 seconds with the same Password locator timeout. A temporary sanitized probe immediately before that locator recorded:

```json
{"path":"/register","labels":["Name","Email"],"passwordInputCount":0}
```

The retained local error context confirms the failing test and setup locator. The test had not submitted registration or reached its logout gate. The current UI source independently confirms that `/register` renders only Name and Email and conditionally renders Password only for login. `RegistrationVerification` renders the Finish registration form with Name, Password and Confirm password.

The reported GitHub artifact was not available locally. The account spec intentionally disables trace/screenshot/video capture for verification-secret protection, and the workflow only uploads sanitized storefront-image diagnostics. No raw verification fragment, cookie, credential, filled input value or page body was added to diagnostic logging. The temporary probe has been removed from the final source. The current checkout's line numbering differs from the reported CI line; the test name, failing locator and obsolete setup match.

## Correction and preserved security assertions

The fourth test's account setup now calls the existing `verifiedRegistration` helper with the same synthetic name, email and password. The helper guards the loopback `orderly_test` database, creates a random mocked-mailbox token while persisting only its digest, opens the current verification form, establishes the owner's password through the real completion endpoint, waits for Email verified, and navigates to the account destination. It follows the same fixture convention as the other account, OAuth, checkout-ownership and history tests. No real email is sent.

The fixture-only corrected full-file attempt then exposed the earlier logout/navigation synchronization regression in the first case: after Sign out and immediate `/login` navigation, the Sign in button detached and the test timed out at the login submission. Three serial cases did not run. This failed attempt is retained. The first and second cases still used immediate click/navigation rather than the existing `signOutAndVerifyRevocation` helper. Those two sites now use that existing helper before navigating. This restores observable completion and independently asserts HTTP 204, cookie removal and old access/refresh rejection; it makes no logout implementation change. The first three cases passing in the reported CI run did not prove those immediate-navigation steps were stable.

The pending logout gate, Signing out disabled-state assertion, ordinary Menu navigation, HTTP 204 completion, anonymous UI, cookie removal, old access-token rejection, old refresh-token rejection and subsequent editable login form remain unchanged. Source comparisons against HEAD confirmed both the entire gated logout scenario and the revocation helper were identical. No sleeps, retries, timeout increases, guard bypasses or production behavior changes were introduced.

## Exact changed files

- `apps/web/test/browser/customer-account.spec.ts`: replace the obsolete fourth registration setup with the existing guarded verification fixture; restore use of the existing revocation/completion helper at the two earlier immediate-navigation sites after reproducing their separate race.
- `docs/v1-ci-customer-account-registration-regression-report.md`: this report.

Application UI/API code, mailbox helpers, session/logout implementation, storefront checks, migrations and CI configuration are unchanged.

## CI and validation

GitHub Actions uses Ubuntu and Node 22, one Chromium worker and zero retries. The workflow runs `pnpm test:quality` without `ORDERLY_BROWSER_PRODUCTION=1`, so its browser server uses `next dev`. Production-build validation on this Windows/Node 24 workstation is a separate mode; local CI-mode validation does not prove a hosted GitHub rerun. All database-backed runs use matching guarded loopback Prisma URLs, `orderly_test`, schema `public`, and synthetic data. Delivery is mocked; real-provider behavior is not established.

| Run | Result | Evidence |
| --- | --- | --- |
| Uncorrected fourth case, production build | **1 failed**, 45-second Password timeout; preserved | `audit-artifacts/account-registration-baseline.log` and error-context directory |
| Fixture-only corrected complete account file, production build | **1 failed / 3 did not run**, separate first-case logout/navigation race; preserved | `audit-artifacts/account-registration-corrected.log` |
| Final corrected account file within combined production Security 2B run | **4 passed**, pending-logout case 2.4 seconds | `audit-artifacts/account-registration-security-2b.log` |
| Complete Security 2B browser regression, production build | **8 suites / 37 cases passed**, zero retries, failures or skips | `audit-artifacts/account-registration-security-2b.log` |
| Corrected account file, local CI development-server mode | **4 passed**, pending-logout case 4.9 seconds; zero retries/skips | `audit-artifacts/account-registration-ci-mode.log` |
| Final TypeScript / lint | **Passed**, both `EXIT_CODE=0`, after restoring the baseline config rewritten by `next dev` | `audit-artifacts/account-registration-final-typecheck.log`; `audit-artifacts/account-registration-final-lint.log` |
| API/Web production builds | **Passed**, including final Security 2B production rebuild | Browser logs |

## Disposition

**PASS for the scoped correction.** The reproduced CI failure is an obsolete test fixture, with the failure occurring before logout. Production registration retains email-owner password establishment; the test has been aligned with that existing behavior. The additionally reproduced logout race was corrected by restoring calls to the existing completion/revocation helper, without changing its assertions or application behavior. The final production security selection, local CI-mode account run, TypeScript, lint and production builds passed. Both failed attempts are retained separately from subsequent clean runs.

Hosted GitHub Actions has not been rerun from this workspace; review and rerun the owner-managed CI after these changes are committed by the owner. No real-provider behavior or overall V1 release acceptance is inferred from this narrowly scoped correction. No commit, push, deployment or production data modification was performed.
