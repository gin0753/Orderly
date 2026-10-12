# Security 2B — secure customer account deletion

Date: 12 October 2026 (Australia/Sydney).
Baseline HEAD: 635518749880ff7d5d0812ffe3f93eb05600a2fc. The initial audit preceded runtime/schema changes; the product owner then approved the deletion-specific Google reauthentication extension with conditions. No further architecture expansion or destructive historical-data migration was needed.

## Outcome

Security 2B implements current-password deletion for password/linked accounts and a dedicated DELETE_ACCOUNT Google reauthentication purpose for Google-only accounts. Google reauthentication does not sign in, create a customer, link a subject or delete an account on callback. A separate final authenticated, CSRF-protected POST performs deletion.

API integration, unit and web component checks have passed. All 36 optimized-build browser regressions passed. No production records, real email delivery or real Google accounts were exercised. No commit, push or deployment occurred; Packaging was not started.

## Pre-implementation data relationship audit

Reviewed [Security 2A](v1-registration-email-verification-report.md), the [Prisma schema](../apps/api/prisma/schema.prisma) and customer migrations, CustomerUser/Session/JWT architecture, Google OIDC/provider/callback/linking, order creation/status/history/receipt authorization, Account Security and Stage 15 components, private-query/session coordination, checkout drafts, receipt storage and the Privacy page.

| Record | Relationship / decision |
| --- | --- |
| CustomerUser | Hard-delete only the authenticated UUID; remove password hash, Google association, profile and verification evidence. Release email/subject for a new identity, never recover the deleted UUID. |
| CustomerSession | CustomerUser foreign key with DELETE CASCADE. All devices/sessions are revoked by customer deletion. Access/refresh JWTs require the live DB session; late responses cannot restore access. |
| CustomerOAuthTransaction | Session foreign key with DELETE CASCADE for session-bound linking/deletion flows. Unbound SIGN_IN transactions need the stale-callback barrier described below. |
| CustomerDeletionGrant | New short-lived authorization, session foreign key with DELETE CASCADE. Customer ID, session ID, subject and DELETE_ACCOUNT purpose are checked at consumption. |
| CustomerPendingRegistration | Email-keyed, no customer foreign key. Invalidate its old secret at deletion but preserve the mailbox abuse quota. No email-based order selection. |
| Order | CustomerUser foreign key with DELETE SET NULL. Retain rows and financial snapshots; scrub/detach owned terminal orders transactionally. |
| OrderItem / OrderItemOption | Cascade only on parent order/item deletion. Parent orders are retained, so item, option, product, quantity and price snapshots remain intact. |
| Receipt capability | Order digest/expiry/revocation. Remove/revoke only the deleted customer's owned order capabilities; unrelated guest/other-owner receipts remain valid. |
| Legacy User / Order.userId | Independent model/FK. Do not delete or link by matching email; leave legacy ownership unchanged. |
| AdminUser / AdminSession | Separate identities, keys, cookie namespace and foreign keys. Untouched, even with the same email. |
| CustomerDeletedGoogleSubject | New temporary SHA-256 subject digest/deletion-time barrier, without customer ID/email/raw subject. Not a login credential or permanent blacklist. |

This is a source/schema audit, not a claim about external production triggers, provider systems, logs or backup contents.

## Threat model and reauthentication

Protect against stolen Orderly sessions, CSRF, client-only confirmation, wrong Google subject, email-only proof, old SSO evidence, cross-browser/session/account grants, replay/concurrent use, partial erasure, late refresh/sign-in callbacks and checkout/status races.

Password and linked accounts must supply their current password plus the literal final confirmation DELETE. The backend performs bcrypt verification and rechecks the unchanged credential/subject and live initiating session under the deletion lock. The target comes from the authenticated principal; injected target IDs are rejected by DTO validation. Google deletion initiation is unavailable to password-capable accounts, which use their password.

Google-only accounts start a new DELETE_ACCOUNT authorization-code transaction using the existing state, nonce, PKCE and random HttpOnly browser-binding protection. The provider requests max_age=0 plus essential auth_time evidence. The existing cryptographic OIDC validation still checks signature/issuer/audience/expiry/state/nonce/PKCE and verified email; deletion identity is matched by Google subject, not email.

Deletion additionally requires integer signed auth_time:
- No earlier than the deletion transaction's creation time, allowing one second for integer timestamp rounding.
- No older than five minutes.
- No more than thirty seconds in the future.

Missing, malformed, old-SSO, stale, future or invalidly signed evidence fails closed. A recently issued token alone is insufficient. The same deletion evidence is rechecked after provider exchange, and the OAuth transaction must still be unexpired. A fresh reauthentication for the wrong subject fails even if its email matches.

Google documents requesting auth_time using claims and distinguishes account selection from authentication-time evidence. max_age forcing is not established by that provider reference; if ignored, the signed auth_time check still rejects the old SSO session. Real-provider usability must be established in approved staging, with no fallback to weaker proof. [Google OIDC reference](https://developers.google.com/identity/openid-connect/reference).

Successful reauthentication creates a new 256-bit deletion grant secret, persisting only its SHA-256 digest. It binds customer UUID, initiating session UUID, current Google subject, deletion purpose, browser-binding digest and five-minute expiry. Raw secret and browser binding live in separate host-scoped HttpOnly cookies, Secure in production and SameSite=Lax. They are never put in response JSON, URL parameters, JavaScript storage or logs. A grant from another session/account/browser cannot authorize deletion.

The callback returns to Account Security with a nonsecret status parameter. That parameter does not authorize anything: the UI checks a guarded grant-status endpoint. The callback has no ordinary login/linking side effects and requires another explicit final action. Starting again replaces a prior grant for that session. Logout/session revocation/password change cascade-delete grants; stale cookies are powerless. Successful deletion and logout clear both deletion cookies.

## State transitions

Password account: signed in → current password + explicit confirmation → locked checks → blocked/failure with rollback OR committed deletion.

Google-only: signed in → DELETE_ACCOUNT OAuth intent (five minutes) → cryptographically validated fresh subject proof → session/browser-bound grant (five minutes) → explicit final confirmation → locked grant consumption/checks → blocked/failure with rollback OR committed deletion.

Wrong/missing/stale Google proof → failed reauthentication, no grant/account mutation. Replay/expired grant → generic unauthorized outcome. Active-order conflict → rollback, including grant consumption. Infrastructure error → no partial database deletion; UI preserves retry feedback. Ambiguous lost response followed by confirmed session revocation clears customer-private state but does not falsely claim that account deletion was proved.

## Active-order restrictions and retention

Block deletion for any owned PENDING, ACCEPTED, PREPARING or READY order, regardless of payment status. Only COMPLETED/CANCELLED orders may remain at deletion. Existing actions never reopen terminal orders. No cancellation, refund or payment-status mutation is triggered.

For orders selected only by the authenticated CustomerUser UUID:
- Detach customerUserId.
- Set name to Deleted customer; required email/phone strings to empty.
- Null addressLine1/addressLine2/city/state/postcode/notes.
- Remove receiptCapabilityHash and set capability expiry/revocation to deletion time.
- Preserve UUID/number, order type/status/payment status/createdAt, subtotal/delivery/service/total cents, all items/options/product references and financial/product/size/quantity/price snapshots. updatedAt may reflect anonymization.

Guest and other-owner orders remain unchanged even with matching contact email. Separate legacy User associations are untouched. Retained records can be identifying in context and are not advertised as guaranteed anonymous.

The current portfolio demo has no promised fixed business-record retention period; this change does not invent a statutory duration. Profile/credentials and owned terminal-order contact data are erased in the primary database, while minimal business records remain. Backups, provider messages/logs and previously downloaded data are outside this transaction. The Privacy page/dialog now describe these limits honestly. Google account/provider login sessions are not deleted; Orderly stores no Google provider access/refresh tokens.

## Transaction, races and rollback

A deletion-specific PostgreSQL transaction advisory lock serializes brief deletion, password login/change, Google subject resolution, verified registration and authenticated order creation. Provider exchange and bcrypt computation stay outside the lock. No generic authorization framework is added. Customer/order row locks and live-session/credential rechecks protect the final destructive decision.

Within one transaction:
1. Acquire the deletion coordination lock and lock/re-read the current customer/session; validate absolute and sliding expiry and unchanged credentials/subject.
2. For Google-only, conditionally delete the exact unexpired grant matching customer/session/subject/browser/secret digest/purpose.
3. Lock/re-read owned order rows, reject active statuses before committed erasure.
4. Establish the six-minute stale-Google-callback barrier; invalidate pre-deletion pending registration proof without resetting its quota.
5. Scrub/detach terminal orders and revoke their receipts.
6. Delete the CustomerUser, cascading every session and session-owned OAuth/grant row.
7. Commit, then clear customer/deletion cookies and perform frontend cleanup.

Any failure rolls back every write: grant consumption, contact scrub, receipt revocation, ownership, sessions, barrier and customer deletion. API tests inject a real temporary database trigger failure after earlier writes; the trigger/function are removed in finally and never belong to deployment migrations.

Race outcomes:
- Checkout first: committed new active order blocks deletion. Deletion first: authenticated order creation fails 401, with no silent guest fallback.
- Terminal order status changes: locked re-read allows terminal deletion or blocks while still active; financial/status integrity remains.
- Refresh/login: no DB session survives deletion, including late cookie responses.
- Old Google callback: stored transaction start time predating deletion is rejected by the temporary subject barrier. Provider exchange also cannot outlive OAuth expiry. New post-deletion Google sign-in may create a new UUID, never old ownership.
- Email reuse: old pending link is invalidated; a new verified registration has a new UUID and no claimed history.
- Concurrent deletion: one commit, loser receives generic 401. Repeated requests with revoked credentials return 401; no unauthenticated success/existence probe is provided.

The advisory lock is intentionally conservative for V1 and serializes identity/owned-checkout transactions. High-volume operation may require a separately reviewed finer-grained approach. All deployed writers must participate; do not run a mixed rollout with older auth/order writers ignoring coordination.

Expired grants/barriers are logically unusable immediately. Grant/deletion activity lazily purges expired rows; schedule an operational expiry purge if strict physical-retention timing is required. Pending email quota retention follows Security 2A's one-hour abuse-window cleanup. No permanent tombstone or recovery feature is added.

## UI and browser cleanup

Danger Zone is appended at the bottom of Account → Sign-in & Security. Stage 15 Card/Button/Input/danger colors and native dialog/focus helper are reused. Cancel has initial focus; Escape, Tab containment, focus restoration, password clearing, loading/error announcements and error focus are covered. Account identity changes close the dialog. Final deletion requires a checkbox and separate irreversible submit action. No page redesign.

Successful deletion invalidates the customer API generation, clears customer Redux identity and customer-private TanStack queries, removes registration-email/deletion UI state, scrubs untouched automatic account checkout prefills, clears owned saved receipt state and navigates to the storefront. A deletion-specific route state ensures late session-ended events cannot override storefront navigation. Customer-scoped deletion broadcasts clean up peer tabs; other accounts' auth is not reset by an unrelated deletion event. Every device is protected by DB session revocation even without broadcasts.

Saved receipts now carry optional owning customer metadata when created during signed-in checkout. The deletion endpoint classifies the initiating tab's saved order number before detachment, allowing an older untagged owned receipt to be removed without clearing a guest receipt. Tagged receipts in peer tabs are scoped to the deleted UUID. Untagged older receipt entries in other tabs cannot be safely classified and may remain locally until expiry, but their server capabilities are revoked and cannot access the order.

Admin sessions/state, public cart/menu data and unrelated guest receipt or independently typed checkout data are retained. No wholesale storage/query-cache clear is used. Unknown/lost response recovery ends a confirmed-revoked session without pretending deletion is certain.

## Migration and file inventory

Additive migration: [20261012020000_customer_account_deletion](../apps/api/prisma/migrations/20261012020000_customer_account_deletion/migration.sql). It adds DELETE_ACCOUNT and the grant/barrier tables/indexes/session cascade. No historical-order bulk update, drop, FK ownership rewrite or production mutation occurred. It was applied only by the guarded loopback orderly_test reset wrapper.

Runtime files:
- Prisma schema; customer-deletion.service.ts and customer-deletion-lock.ts.
- Customer auth/account controllers, module, auth service, Google OAuth service/provider, deletion DTO; registration transaction coordination and authenticated order creation coordination.
- Account page and customer-delete-account.tsx; customer auth API/store/route guard/bootstrap/session events/deletion cleanup.
- Checkout draft prefill scrub, receipt ownership metadata/storage and checkout write; Privacy page.
- API deletion tests, signed provider tests, logout cookie assertion; component deletion tests and browser deletion suite.
- Browser runner scoped --security-2b selection and this report.

Security 2A, ordinary SIGN_IN, explicit CONNECT_GOOGLE, Admin authentication and guest receipt authorization remain separate. No password reset, email change, recovery, account export or V2 work is included.

Exact file inventory:

- `apps/api/prisma/migrations/20261012020000_customer_account_deletion/migration.sql`
- `apps/api/prisma/schema.prisma`
- `apps/api/src/modules/customer-auth/customer-account.controller.ts`
- `apps/api/src/modules/customer-auth/customer-auth.controller.ts`
- `apps/api/src/modules/customer-auth/customer-auth.module.ts`
- `apps/api/src/modules/customer-auth/customer-auth.service.ts`
- `apps/api/src/modules/customer-auth/customer-deletion-lock.ts`
- `apps/api/src/modules/customer-auth/customer-deletion.service.ts`
- `apps/api/src/modules/customer-auth/customer-google-oauth.service.ts`
- `apps/api/src/modules/customer-auth/customer-registration.service.ts`
- `apps/api/src/modules/customer-auth/dto/customer-account.dto.ts`
- `apps/api/src/modules/customer-auth/google-provider.ts`
- `apps/api/src/modules/orders/orders.service.ts`
- `apps/api/test/customer-auth.e2e-spec.ts`
- `apps/api/test/customer-deletion.e2e-spec.ts`
- `apps/api/test/google-provider.e2e-spec.ts`
- `apps/web/src/app/(customer)/account/page.tsx`
- `apps/web/src/app/(customer)/privacy/page.tsx`
- `apps/web/src/features/checkout/checkout-customer.ts`
- `apps/web/src/features/checkout/components/checkout-page-client.tsx`
- `apps/web/src/features/customer-auth/api/customer-auth-api.ts`
- `apps/web/src/features/customer-auth/components/customer-auth-bootstrap.tsx`
- `apps/web/src/features/customer-auth/components/customer-delete-account.tsx`
- `apps/web/src/features/customer-auth/components/customer-route-guard.tsx`
- `apps/web/src/features/customer-auth/lib/deletion-cleanup.ts`
- `apps/web/src/features/customer-auth/lib/session-events.ts`
- `apps/web/src/features/customer-auth/store/customer-auth-slice.ts`
- `apps/web/src/features/order-tracking/utils/order-tracking-storage.ts`
- `apps/web/test/browser/customer-deletion.spec.ts`
- `apps/web/test/browser/scripts/run-playwright.mjs`
- `apps/web/test/customer-auth-routing.test.tsx`
- `apps/web/test/customer-delete-account.test.tsx`
- `docs/v1-customer-account-deletion-report.md`

## Test evidence

Final checks on synthetic data:

| Check | Result |
| --- | --- |
| API unit | 16 suites / 161 tests passed |
| API integration | 13 suites / 169 tests passed |
| Web component/unit | 47 suites / 339 tests passed |
| Final focused UI/cleanup checks | 4 suites / 29 tests passed |
| API/web TypeScript and lint | Passed, including web test TypeScript |
| API production build | Passed |
| Optimized web build | Passed |
| Security 2B browser suite | 8 suites / 36 tests passed on Chromium 151.0.7922.34 |
| Whitespace / Git | Checked; HEAD unchanged, no commit |

API tests cover password/linked/Google-only deletion, real HTTP limits, incorrect password, explicit confirmation/CSRF/customer isolation, active statuses, terminal finance/items, unrelated guest/Admin records and receipts, multiple devices, changed sessions, missing browser binding, wrong matching-email subject, signed stale/missing/old-SSO/future/bad-signature evidence, replay/concurrent grants, logout/password-change revocation, checkout/status/refresh/Google races, pending-link invalidation, new email/Google UUIDs and real transactional rollback.

Browser coverage includes explicit password deletion at 1440/390/320px, keyboard/Escape/focus, axe accessibility, failure recovery, peer tab revocation, guest-storage preservation and Google-only silent-SSO rejection followed by fresh proof and separate confirmation. Existing verification, Google/linking, account, checkout ownership, order history, anonymous/session and receipt suites are included. Browser diagnostics disable traces/screenshots/video for secret-bearing cases. Counts: deletion 4, verification 4, Google 6, account 3, checkout 6, history 6, anonymous/session 3, receipt 4. All passed with real guards and no retries; the browser wrong-password check runs once to keep the suite within the five/minute limit. API tests independently verify the limit.

Commands: each app's lint/typecheck/build, API test:unit --runInBand and test:e2e, web test --runInBand, and pnpm test:browser --security-2b with guarded TEST_DATABASE_URL, ORDERLY_BROWSER_PRODUCTION=1 and ORDERLY_RECEIPT_SECURITY_TESTS=1. Tests use mocked/locally signed Google provider evidence and guarded synthetic records, never real emails or production customer data.

Initial failures were fixture/assertion issues (overlong receipt order number, non-transactional Prisma mock, old two-cookie logout expectation, duplicate pending row fixture). Those were corrected; the rollback test now exercises an actual DB rollback rather than a mock that cannot intercept transaction delegates. Browser validation also exposed a protected-route redirect race after committed deletion; a deletion-specific navigation marker and late-session-event regression prevent the initiating tab from being redirected to login instead of the storefront.

## Deployment requirements and remaining limits

1. Apply the additive migration/regenerate Prisma and deploy coordinated API/web/auth/order writers through a separately approved workflow. No deployment was performed.
2. Validate real Google auth_time/max_age behavior with an approved synthetic staging account. Google-only deletion must remain fail closed if fresh after-intent evidence is unavailable. No ordinary SSO/email/issued-token shortcut is permitted.
3. Retain existing trusted HTTPS WEB_ORIGIN, distinct customer/Admin JWT settings, proxy identity, Google callback and CSRF controls. Test-provider mode must remain test-only.
4. Exclude passwords, grants, browser-binding cookies, OAuth codes/state/PKCE and authentication request bodies/cookies from access/APM/error diagnostics. No new secret logs are added.
5. Define operational deletion-grant/barrier/pending-quota expiry cleanup and provider/backup/log retention. Primary database deletion is not a guarantee of total privacy erasure.
6. Validate anonymized historical records in Admin views and reconcile the disclosed financial retention with any future commercial operation.

Automated browser engine coverage is Chromium with independent contexts/session tests; Firefox/Safari and actual Google provider UX remain staging/manual checks. Untagged older peer-tab saved receipts may persist locally but are revoked server-side. The deletion coordination lock is a V1 throughput tradeoff. These are explicit operational limits, not weaker authorization fallbacks.

## Manual UAT checklist

- [ ] Password and linked accounts require correct current password and explicit final confirmation.
- [ ] Google-only flow provides signed fresh after-intent auth_time, matching subject and same initiating session/browser; silent/old/missing evidence, wrong account, cancellation and expired/replayed proof cannot delete.
- [ ] OAuth GET callback leaves the account alive; final confirmation is a distinct authenticated POST.
- [ ] PENDING/ACCEPTED/PREPARING/READY orders block without cancellation/refund; terminal personal fields are scrubbed and all financial/items/options/status snapshots retained.
- [ ] Other-customer/guest/Admin records and their sessions/receipts remain unchanged.
- [ ] Old sessions on every device and old owned receipt codes fail after commit; peer tabs clear private data, guest cart/drafts/codes and Admin remain usable.
- [ ] Concurrent checkout/status/refresh/Google callbacks follow documented winners; injected DB/API failure leaves coherent rollback/retry behavior.
- [ ] New verified email registration or fresh Google sign-in yields a new UUID and no old order ownership.
- [ ] Keyboard, error focus, Cancel/Escape, screen-reader announcements and 320px dialog layout work.
- [ ] Confirm provider freshness, log redaction, retention notice and expiry operations before approved deployment.

No commit, push, deployment, production-data modification or Packaging is included.
