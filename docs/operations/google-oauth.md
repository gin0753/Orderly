# Google OAuth configuration and acceptance

Consolidated 13 October 2026 from the activation/account-selection investigations. Current implementation is documented in [customer authentication](../security/customer-auth.md) and [deletion](../security/account-deletion.md). Historical activation results are not refreshed hosting-console verification.

## Configuration and routing

Configure `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` and `GOOGLE_CALLBACK_URL` together on the API, privately. Absent configuration disables Google; partial configuration fails startup. The callback must be the exact HTTPS `WEB_ORIGIN/api/customer/auth/google/callback`, on the web origin that owns the cookies. Production browser traffic uses the same-origin `/api` proxy; `ORDERLY_API_ORIGIN` and the matching proxy-signing secret stay server-only. No Google secret or signing key belongs in `NEXT_PUBLIC_*`.

For the recorded V1 aliases, the web origin is `https://orderly-web-gamma.vercel.app` and callback is `https://orderly-web-gamma.vercel.app/api/customer/auth/google/callback`. The API origin is `https://orderly-production-1ac4.up.railway.app`, without an `/api` suffix. These are recorded project endpoints, not permission to change provider settings. Update Console redirect, `WEB_ORIGIN` and callback together when the canonical origin changes; previews are not implicitly authorized. Domain ownership/branding requirements must be satisfied honestly, without claiming ownership of a shared hosting domain.

Use a Web application OAuth client and only basic OIDC identity scopes. No Gmail/Drive, stored provider access tokens or offline mailbox integration is required. Brand/support/operator contacts and privacy/terms URLs must describe the actual portfolio. Google Console publishing, organizational account restrictions and domain verification remain owner tasks. A provider's Testing audience must not be treated as an Orderly authorization barrier.

`GOOGLE_OAUTH_TEST_PROVIDER` is local synthetic test configuration only; deployed fixture endpoints must remain unavailable. Preserve independent Customer/Admin JWT keys and the proxy key during activation. API environment changes require restart/redeployment; web build-time rewrite/flag changes require a new build. Neither operation is performed by repository hygiene.

## Identity and retry guarantees

Each sign-in/link attempt creates fresh state, browser binding, nonce and PKCE verifier with expiry and single consumption. Real authorization URLs request `prompt=select_account`, without an app-supplied `login_hint`. The controlled provider tests Orderly's retry/state journey and does not emulate Google's account-cookie chooser.

Matching email never silently merges a password account. A collision consumes its transaction, creates no session and allows a fresh chooser attempt. Explicit Connect Google requires the initiating live session, current password and verified matching provider email. Provider subject uniqueness, signed-claim checks and transaction/revocation coordination remain mandatory. Google-only deletion additionally requires after-intent recent `auth_time`; ordinary selection prompt alone is not deletion reauthentication.

## Historical focused evidence

| Investigation | Recorded scope and result | Limit |
| --- | --- | --- |
| Activation/availability, 8 October 2026 | 25 web component, 3 configuration unit, 24 local integration and 8 optimized Chromium workflows passed; static/build checks passed | Controlled provider, no real authorization or Console inspection; status was disabled at that historical checkpoint |
| Account selection, baseline `8b924da` | 26 integration cases, 3 configuration unit cases, 25 component cases and 8 browser workflows passed (62 total) | Initial browser state-capture race failed before heading synchronization; live chooser behavior remained unverified |
| Final release observation, 13 October 2026 | [Release audit](../portfolio/final-release-report.md) records Google enabled, deployed revision/alias evidence and owner functional UAT | Specific real-provider deletion freshness and detailed device/provider matrix remain conditional |

Password policy was unchanged: 15-character minimum, 72 UTF-8-byte cap, conventional password autocomplete and no copy/paste interception. This is HTML support, not certification of all password managers. See [provider URL tests](../../apps/api/test/google-provider.e2e-spec.ts), [customer integration tests](../../apps/api/test/customer-google.e2e-spec.ts) and [browser journey](../../apps/web/test/browser/google-oauth.spec.ts).

## Operator verification and rollback

Using designated synthetic accounts under separately approved staging scope, verify new and returning Google users, exact subject/history, collision without merge, fresh retry chooser, correct-password linking, rejection of wrong password/email, cancellation, secure web-origin cookies and cross-tab login/logout. Test fresh-auth Google-only deletion against stale/silent SSO and missing provider claims. Do not record callback codes, cookies or tokens in public diagnostics.

Disable by removing/blanking all three Google configuration values together and restarting the API. Partial removal can fail startup. Confirm capability is disabled and fixture routes unavailable. Do not delete identities, links, orders, sessions or database history; Google-only users cannot initiate a new Google sign-in while disabled. Preserve signing keys and use the normal reviewed rollout process. Provider failure must not relax state/nonce/PKCE, linking or deletion-freshness requirements.
