# Orderly V1 — Google OAuth production activation

Prepared 8 October 2026 (Australia/Sydney), baseline `8cdc744`. This is preparation for owner activation. No production environment variables, deployments, Google projects, production data, or commits were changed. Read-only production checks used the public status endpoints; hosting secret values were not inspected.

## A. Existing implementation assessment

The implementation already supports all five requested journeys:

| Journey | Implementation and evidence |
| --- | --- |
| New Google customer | `CustomerAuthForm` calls `googleStart(returnTo)`. `CustomerGoogleOAuthService.complete` validates the transaction and provider identity; `CustomerAuthService.signInWithGoogle` creates a customer without a password and establishes the normal persisted customer session. The controller returns a 303 to the safe intended destination. Existing browser coverage returns to checkout and verifies reload/session synchronization. |
| Returning Google customer | Lookup is by unique Google subject; the existing customer is reused, including after provider email changes. API and browser tests check identity reuse; concurrent first sign-ins cannot create duplicate customers. |
| Matching unlinked password account | Anonymous sign-in rejects an existing email with 409 internally, and the callback redirects to `/login?google=conflict`. The form explains password sign-in followed by explicit Connect Google. No email-only merge occurs. |
| Explicit Connect Google | The protected start endpoint verifies the current password. Completion requires the initiating active session and a verified Google email equal to the stored Orderly email. Only `googleSubject` is updated on the existing customer; its ID, stored email, password and order ownership are retained. Subject uniqueness and concurrent-link checks remain in place. |
| Google-only customer | Normal account/history authorization applies to its customer session. Password login requires a password hash. Account password-management controls are absent, and the backend also rejects unsupported password operations. Returning Google sign-in is covered. |

Relevant files: `apps/web/src/features/customer-auth/components/customer-auth-form.tsx`, `customer-google-methods.tsx`, `customer-password-form.tsx`, `api/customer-auth-api.ts`; `apps/api/src/modules/customer-auth/customer-auth.controller.ts`, `customer-google-oauth.service.ts`, `customer-auth.service.ts`, `google-provider.ts`, and `google-oauth.config.ts`.

Routes are `GET /api/customer/auth/google/status`, `POST /api/customer/auth/google/start`, protected `POST /api/customer/auth/google/connect`, and `GET /api/customer/auth/google/callback`. Start/connect return an authorization URL; the browser performs a full-page navigation. The callback clears the OAuth binding cookie, sets customer cookies for sign-in, and redirects with `orderlyOAuth=complete`; the existing bootstrap consumes that marker and publishes session changes. Successful connection returns to `/account?google=connected`.

The provider uses server-side `openid-client` discovery and authorization code exchange, `openid email profile`, S256 PKCE, state, nonce, signed ID-token checks and verified email. Five-minute transactions are browser-bound and conditionally consumed once. Provider tokens are not persisted. Cancelled sign-in redirects to `/login?google=cancelled`; cancelled linking returns to `/account?google=cancelled`. These protections were preserved.

## B. Why the button is missing

Both deployed GET status checks on 8 October returned `{ "enabled": false }`:

- `https://orderly-web-gamma.vercel.app/api/customer/auth/google/status`
- `https://orderly-production-1ac4.up.railway.app/api/customer/auth/google/status`

The shared login/register form initializes `googleAvailable` to false and renders Continue with Google only after `customerAuthApi.googleStatus()` returns enabled. A failed status request also leaves it unavailable. `GoogleOAuthConfig` enables Google only when **all three** trimmed values (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`) are present. All absent disables it; partial configuration fails startup. There is no `GOOGLE_ENABLED` switch or public frontend Google key.

The observed missing button is therefore expected provider-disabled conditional rendering. Matching proxy/backend status gives no evidence of a deployment mismatch. This check does not establish which settings are present in the owners' hosting dashboards. The previously visible Account connection form lacked the same availability gate; that inconsistency is corrected below.

## C. Code changes

- `apps/web/src/features/customer-auth/components/customer-google-methods.tsx`: check provider status once per mount; offer the password/Connect form only after enabled status; fail closed while checking, when disabled, or on status failure; show an unavailable explanation. Existing connected-method facts remain visible. Submission also guards availability. Cancelled, conflict and failed connection callbacks now show guidance instead of silently returning to the form.
- `apps/web/test/customer-google-methods.test.tsx`: enabled linking, disabled/unreachable availability, Google-only methods and all three unsuccessful callback outcomes.
- `apps/web/test/customer-auth-forms.test.tsx`: disabled entry points for both modes and cancellation/failure feedback, alongside existing enabled start and conflict cases.
- `apps/api/test/customer-google.e2e-spec.ts`: declined authorization consumes its transaction, returns the expected cancellation redirect, and creates neither customer nor session.
- This report.

No backend implementation, schema, dependencies, OAuth validation, or login/register layout changes were needed.

## D. Exact Google Cloud configuration

Use a **Web application** OAuth client for the current production hostname:

| Console field | Exact value |
| --- | --- |
| Authorized JavaScript origins, if populated | `https://orderly-web-gamma.vercel.app` |
| Authorized redirect URIs | `https://orderly-web-gamma.vercel.app/api/customer/auth/google/callback` |
| Requested identity scopes | `openid email profile` |

The origin contains no path or trailing slash. The redirect contains the complete `/api/customer/auth/google/callback` path, without trailing slash, query, or fragment. This server authorization-code implementation does not use a Google JavaScript SDK: JavaScript origins are not needed for its protocol, but the value above is the correct public origin if configured. Exact redirect matching is required. See Google's [OAuth client configuration](https://support.google.com/cloud/answer/15549257?hl=en).

Do not register Railway as this client's callback. `apps/web/next.config.ts` rewrites `/api/:path*` to `${ORDERLY_API_ORIGIN}/api/:path*`; `apps/web/src/proxy.ts` signs client identity before forwarding. The browser binding and customer cookies belong to the Vercel public origin. Backend configuration rejects callbacks outside `WEB_ORIGIN`.

If the owner changes the canonical production domain, update the Console redirect, `WEB_ORIGIN`, and `GOOGLE_CALLBACK_URL` consistently before activation. Preview URLs are not authorized automatically. Google branding/domain verification is an owner task; do not claim ownership of the shared `vercel.app` domain. If Console requires an owner-verifiable domain and rejects the hosted hostname, resolve that with an owned domain before enabling Google rather than bypassing validation.

## E. Environment variables

| Variable | Destination | Required configuration |
| --- | --- | --- |
| `GOOGLE_CLIENT_ID` | Railway API | Client ID from the Web application client; server configuration only. |
| `GOOGLE_CLIENT_SECRET` | Railway API | Store the client secret privately in hosting settings. Never put it in Vercel public variables or repository files. |
| `GOOGLE_CALLBACK_URL` | Railway API | `https://orderly-web-gamma.vercel.app/api/customer/auth/google/callback` |
| `WEB_ORIGIN` | Railway API | `https://orderly-web-gamma.vercel.app` |
| `ORDERLY_API_ORIGIN` | Vercel Production | `https://orderly-production-1ac4.up.railway.app` (no `/api`, path or trailing slash). This rewrite target is evaluated during the frontend build. |
| `ORDERLY_PROXY_IDENTITY_SECRET` | Vercel Production and Railway API | Existing matching server-only signing secret, at least 32 UTF-8 bytes. Do not rotate it as part of Google activation. |
| `CUSTOMER_JWT_ACCESS_SECRET`, `CUSTOMER_JWT_REFRESH_SECRET` | Railway API | Existing independent customer session secrets; preserve them during activation. |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | Railway API | Existing independent admin secrets; preserve them. |
| `NODE_ENV` | Railway API runtime | `production`; the test provider must not run. |
| `GOOGLE_OAUTH_TEST_PROVIDER` | Neither production platform | Leave unset/remove from production. It is recognized only under `NODE_ENV=test`; do not enable fixture routes. |

Existing customer issuer/audience/TTL, database and deployment settings remain required as documented in `apps/api/.env.example` and `docs/customer-auth.md`. There is no Google-specific Vercel public setting, no separate backend public-origin variable for OAuth, and no need to change `NEXT_PUBLIC_API_BASE_URL`: production browser traffic uses same-origin `/api`.

## F. Validation

All requested focused checks passed. Logs are retained locally under ignored `audit-artifacts/google-activation/`. Tests use generated/local fixtures, not production credentials.

| Check | Actual result | Evidence |
| --- | --- | --- |
| Web forms, Google methods, account component tests | 3 suites, **25/25 passed** | `web-focused.log`; includes the nine added frontend cases. |
| Google OAuth configuration unit tests | 1 suite, **3/3 passed** | `api-config.log`; absent/partial configuration, callback origin and test-provider restrictions. |
| Google customer and signed-provider integration tests | 2 suites, **24/24 passed** | `api-google-final.log`; real local PostgreSQL, includes the added cancellation case. Initial run before the added case passed 23/23. Signed-token rejection tests remain intact. |
| Optimized Chromium Google/account browser checks | **8/8 passed** | `browser.log`; existing five Google and three account journeys, real local API/PostgreSQL, controlled provider, desktop/mobile cases. |
| Nest API and optimized Next.js build | **PASS** | Both performed by the production-mode browser wrapper; frontend static generation completed. |
| Repository `pnpm lint` | **PASS** | `lint.log`; API and web. Added API test also passed a final targeted ESLint check in `api-test-lint.log`. |
| Repository `pnpm typecheck` | **PASS** | `typecheck.log`; API, frontend source and frontend tests. |
| API test Prettier and `git diff --check` | **PASS** | `format.log` and final diff check. |
| Public production status GETs | **PASS**, both disabled | `production-status.log`; read-only, no credentials. |

Total focused tests/workflows: **60/60**. No tests were skipped or security policies relaxed. This task did not rerun the complete release quality gate or Docker build; it ran the requested relevant auth/browser checks and builds. Live Google authorization was not exercised.

## G. Manual production activation steps

Codex has inspected implementation, corrected the availability inconsistency, added focused regressions and prepared these instructions. The following Console and hosting actions require the owner's access and were **not performed**:

1. Select or create the owner's Google Cloud project. Open Google Auth Platform and initialize its configuration.
2. Complete **Branding** with Orderly's app name, monitored support email and developer contacts; supply truthful public homepage/privacy/terms links and authorized domains as required. Follow Google's [branding requirements](https://support.google.com/cloud/answer/15549049?hl=en); satisfy any domain/brand verification requested by Console.
3. Choose **Audience → External** for a public storefront. Use Testing for initial owner UAT and list intended testers where applicable. Orderly requests only basic OIDC identity scopes: Google's [Audience documentation](https://support.google.com/cloud/answer/15549945?hl=en) explicitly exempts those requests from the ordinary test-user allowlist and seven-day authorization expiry. Testing is therefore not an access-control boundary for this app. Workspace policies can still block sign-in. Before public launch, review publishing/verification status and publish according to Google's requirements.
4. Under **Data Access**, confirm only the identity scopes actually requested by the code; do not add Gmail/Drive or offline-access requirements.
5. Under **Clients**, create a **Web application** OAuth client. Enter the exact origin/redirect above. Securely capture its client ID and secret at creation; Google currently shows the secret only then. Never send it in chat or screenshots. Console changes can take time to propagate ([client documentation](https://support.google.com/cloud/answer/15549257?hl=en)).
6. Verify the existing Vercel Production rewrite origin/shared signing secret and Railway `WEB_ORIGIN`, production runtime and independent session secrets. Set the three Google variables together on Railway using private hosting settings; partial configuration prevents API startup. Confirm no test-provider variable is enabled.
7. Deploy the reviewed availability correction through the normal release process. Redeploy/restart Railway to apply its OAuth environment. Redeploy Vercel to ship the UI correction and whenever its build-time rewrite settings change. A change only to Railway Google variables needs API restart, not a new frontend Google key.
8. Check public health, then GET Vercel `/api/customer/auth/google/status` returns enabled; check the test-provider endpoint remains 404. On login and register, Continue with Google should appear; Account should offer Connect only while enabled.
9. Perform real Google UAT using owner-designated accounts: new user → intended checkout/account destination; reload; logout; returning Google login → same account; matching password email → conflict without merge; password sign-in → correct-password Connect with same Google email → same customer/history; wrong password/wrong email → failure without linking; cancel sign-in and linking → understandable feedback. Verify Google-only profile/history and no password-management controls, secure HttpOnly cookies on the Vercel origin, and cross-tab sign-in/out updates. Existing-order history preservation should use an already owned test account/order; this investigation created no production data.
10. Record live UAT outcome and publishing/branding state before enabling Google for the release. If a real provider check fails, keep Google disabled and investigate the exact error without weakening state/nonce/PKCE or linking requirements.

Rollback: remove/blank **all three** Railway Google variables together and redeploy/restart the API. Verify status becomes disabled and entry points become unavailable after page reload. Do not remove only one variable: partial sets fail startup. Existing customer records, links, orders and valid sessions are not deleted; Google-only customers cannot newly sign in while disabled. Preserve JWT/proxy secrets and database history. If the UI deployment itself fails, roll back to the reviewed prior frontend deployment through the normal owner pipeline.

## H. Remaining risks and readiness

The implementation and focused validation are ready for owner configuration and real-provider UAT. Controlled browser flows and signed-token fixtures cannot certify the owner's real client, secret, Google consent/branding, external account policy, deployed callback cookie handling or provider availability. Neither Console configuration nor hosting settings were independently inspected. Both live status endpoints are currently disabled.

Configuration and live Google UAT remain blockers to claiming **Google production acceptance**. They do not prevent continued password/guest Production UAT with Google disabled. Do not freeze V1 with Google advertised as available until the real five journeys and cancellation cases pass. No automatic deployment or commit was performed.
