# Security 2A — customer registration email verification

## Proposed architecture and threat model (before implementation)

New password registration must create an expiring pending record, never a CustomerUser or CustomerSession. The email owner establishes a new password on the completion page. Initial registration credentials are never used to activate an account. This prevents an attacker from gaining access when a recipient clicks an unsolicited link. A GET, email scanner, or page load never consumes a token or creates credentials.

Use 256-bit random email tokens with only SHA-256 digests persisted. Links use configured WEB_ORIGIN and a URL fragment to keep tokens out of HTTP URLs, access logs and referrers. Completion is a CSRF-protected POST with explicit password confirmation in the UI. Consumption, unique customer creation and initial session creation are one database transaction. Concurrent completion has one winner; uniqueness also arbitrates Google/password creation races.

Pending records expire in 30 minutes and do not reserve CustomerUser email identities. Mailbox-level cooldown and bounded hourly sends survive process restarts. Resend rotates the token; provider errors revoke the failed token and allow retry after cooldown. Generic acknowledgements cover existing accounts and suppressed sends. Mail-provider failures must not disclose membership. No raw token, password or provider response may be logged. Production must use configured transactional delivery, never a console mailer.

Existing password accounts retain their existing identity, credentials, sessions and customer-ID order ownership. A nullable verification timestamp records absence of evidence honestly; no automatic backfill, forced credential replacement, mailbox-based reclamation or merging is permitted. Google remains subject-based, with existing explicit linking/conflict controls. Existing Google subjects are not retroactively evidence for a stored email. New Google identities may record provider evidence only on creation; linking records it only for the explicitly matched address.

Admin auth and guest receipt hardening are separate. No guest orders are claimed by email. No production data changes, commits, pushes or deployments are authorized. Prior uncommitted guest-tracking work is preserved.

## State transitions

Request → pending (30-minute lifetime) → mail sent → owner submits password and token → verified customer + session. Invalid/expired/consumed links fail generically. Resend after cooldown → replacement pending token. Expired pending records are cleaned on registration requests and can be purged by an operational job. Existing accounts → neutral acknowledgement, no credential change.

## Implemented architecture

Inspected the customer auth controller/service/config/DTOs, CustomerSession/JWT strategy, Google provider and linking transaction, Prisma schema/migrations, auth registration form/API/store, order ownership queries, existing auth/account/Google/orders tests, Stage 15 design components and the email ownership audit. There was no existing outbound-mail abstraction. Admin authentication is separate and untouched.

The initial UI retains the existing registration surface with name/email; password and confirmation move to `/verify-email`. The API accepts an optional legacy password field for compatibility, validates it if supplied, and discards it. It never hashes, persists, activates or authenticates that initial credential. The initial name/phone are likewise not trusted as the eventual owner's profile. The recipient explicitly supplies their name and password at completion. Completion accepts no email or customer-ID override. Guest checkout is still available.

`CustomerPendingRegistration` is keyed by canonical email and stores a unique SHA-256 token digest, expiry, last send time, hourly window start and send count. A 60-second cooldown and five attempts per hour are enforced with database compare-and-swap updates. A send attempt consumes its quota even if delivery fails. New requests and resends share that quota. HTTP routes also enforce per-client throttles: registration/resend/completion five per minute, check ten per minute, plus the existing global limiter/proxy identity controls. Mailbox quotas remain durable across instances; HTTP counters retain the existing process-local architecture.

Every eligible request, including an existing email, follows the same pending/mail delivery path and response shape. Duplicate/cooldown/quota suppression returns the same neutral `pending` acknowledgement. Delivery errors return `delivery_failed`, independently of CustomerUser membership. No registration path inspects account existence to decide whether to send. Checking a token does not report the address or account state. Completion conflicts use the same invalid-link failure as invalid, expired or replayed tokens. This avoids an account-membership oracle for callers without mailbox access; the email owner can still infer an existing account when activation cannot proceed.

Completion hashes the owner-selected password with the existing bcrypt cost 12 and 15-character/72-byte policy, then atomically changes the live digest to an unreachable random digest, expires it, creates the unique CustomerUser with `emailVerifiedAt`, and creates the existing CustomerSession/JWT cookies. Rollback retains the usable token if account/session establishment fails. A concurrent completion loses the conditional update. A Google/password race has one unique-email winner; it does not merge identities. Successful consumption retains only quota history, so completion cannot reset abuse controls. Expired rows reserve no active identity, can be replaced by a new eligible attempt, and are purged on registration once their abuse window is over.

The verification URL uses validated `WEB_ORIGIN` and a fragment. Tokens are posted only in JSON request bodies, never in API query strings. The page sets a `no-referrer` policy through Next metadata and removes the fragment after success. Page loads/checks never activate credentials. Check requests are deduplicated through React development effect replay. No raw token is persisted in local/session storage; only the initiating email is stored for the pending UI. Normal reload preserves an unconsumed link in the fragment, and another browser can complete it. The initiating browser receives no session from somebody else's completion.

Stage 15 Card, Input, Button, colors and layout conventions are reused. Pending, cooldown, delivery failure, invalid/expired, transient check failure and completed states include status/alert announcements. Password validation errors receive focus. The cooldown does not announce every second. Links and controls remain keyboard accessible and fit narrow viewports.

## Files changed in Security 2A

- `apps/api/prisma/schema.prisma`; new `20261012010000_customer_email_verification/migration.sql`.
- Customer-auth controller, module, service and credential DTOs; new `customer-registration.service.ts`, `registration-mailer.ts` and mailer unit tests.
- `apps/api/.env.example` documents provider variables.
- New API registration integration tests and `test/support/verified-customer.ts`; auth/account/Google/customer-orders/orders fixture helpers now complete real activation with synthetic delivered-mail fixtures.
- Web customer auth API/types/store/form; new pending and verification components and `/verify-email` page.
- Customer-auth form/state tests and new verification component/browser tests; new guarded browser delivered-mail fixture helper.
- Browser registration fixtures in account, anonymous-auth, navigation, critical workflow, Google, checkout ownership, order history and receipt security suites; the premium auth layout test now expects password establishment at verification.
- Browser runner `--security-2a` selects the affected suites with fresh servers between suites, retaining real rate guards and disabling token-bearing diagnostics via the existing security-test flag.
- This report. Existing guest-tracking work in the dirty working tree is not part of Security 2A; only shared registration test fixtures were adapted. No guest-tracking product behavior was changed in this stage.

## Database migration and existing-account policy

The additive migration creates the pending table/indexes and a nullable CustomerUser verification timestamp. It performs **no CustomerUser UPDATE**, no credential/session revocation and no order backfill. Existing password and Google accounts remain null unless a later explicit, currently supported matching Google connection establishes provider evidence. New Google customer creation records the provider's verified-email evidence. Existing-subject Google sign-in continues to resolve by subject and does not overwrite the stored email or retroactively attest it.

Legacy password accounts retain login/session/profile/password-change access. Their email is unverified evidence and must not authorize future recovery, email claims or historical-order attachment. A fresh registration link cannot overwrite their credential, transfer their identity, attach a new Google subject or claim their orders. Existing email squatting therefore remains a legacy availability limitation; resolving it requires a separately scoped, evidence-based recovery/reclamation policy. None is implemented here.

Only the guarded loopback `orderly_test` database was reset/migrated. No production database was accessed or changed.

## Email-provider configuration and failure recovery

Delivery uses Resend's HTTPS transactional send API with plain-text body, a fixed endpoint, a ten-second timeout, and sanitized errors. See the [Resend send API](https://resend.com/docs/api-reference/emails/send-email). Configure `REGISTRATION_EMAIL_API_KEY` with a sending-only key and `REGISTRATION_EMAIL_FROM` with the verified sending-domain address. Configure an exact HTTPS `WEB_ORIGIN`. Production startup fails closed without both provider settings. Development without them returns the delivery-failure state. `NODE_ENV=test` refuses real delivery even when keys exist; API tests override the mailer and browser tests use mocked acknowledgements plus guarded synthetic mailbox fixtures. There is no test-mail retrieval endpoint or production bypass.

After an HTTP error, timeout or other delivery exception, the attempted token expires immediately; an uncertain-but-delivered email is unusable. The user can retry after cooldown to get a new token. A provider acceptance response is not proof of inbox delivery: spam filtering, bounces and delayed delivery remain operational concerns. No persistent queue, automatic background retry, webhook receiver or recovery feature is added. Resend rotates/replaces any previous pending link. Disable provider click tracking and unnecessary message-body retention; verification links must not enter analytics/APM/request-body logs. Delivery errors never log a provider response or verification link.

## Test evidence

Validation on 12 October 2026, against working-tree source at unchanged HEAD `b23e165d4ee7f56ed918dc557d60f1fae0bc163a`:

| Check | Final result |
| --- | --- |
| Full API unit suite | 16 suites / 161 tests passed |
| Full API integration suite | 12 suites / 140 tests passed |
| Full web component/unit suite | 46 suites / 334 tests passed |
| API and web TypeScript | Passed, including web test TypeScript |
| API and web ESLint | Passed; new browser runner/helper files also checked |
| API production build | Passed |
| Web optimized production build | Passed, including `/verify-email` prerender |
| Security 2A optimized-build browser regressions | 10 suites / 54 tests passed on Chromium 151.0.7922.34 |
| Whitespace / Git | `git diff --check` passed; HEAD unchanged, no commit |

Reproducible commands: `pnpm --filter api test:unit --runInBand`, `pnpm --filter api test:e2e`, `pnpm --filter web test --runInBand`, each app's `lint`, `typecheck` and `build`, and `pnpm test:browser --security-2a` with the guarded local test-database environment plus `ORDERLY_BROWSER_PRODUCTION=1` and `ORDERLY_RECEIPT_SECURITY_TESTS=1`. The web build uses the local origin/test allowance. Browser results: verification 4, critical workflow 18, navigation 2, Google 6, account 3, checkout ownership 6, order history 6, anonymous/session coordination 3, premium auth/orders/tracking 2, receipt security 4. All passed; no retries or disabled rate guards. The automatic Next.js-only tsconfig edit was removed after tests, preserving the original file.

Tests use synthetic records and mocked email delivery. API suites exercise PostgreSQL constraints and transactions rather than an in-memory database. API negative tests deliberately simulate infrastructure failures and emit their pre-existing sanitized test error messages. The added rollback fixture targets the CustomerAuthService instance and asserts a boolean failure, avoiding token-bearing failure diagnostics. No real customer credentials or verification tokens were logged.

Coverage includes ownership-proven activation; ignored attacker-selected initial credentials; invalid/expired/replayed links; concurrent verification and registration; durable cooldown/hourly quotas; resend rotation; delivery-error invalidation and recovery; legacy unverified login/refresh; Google subject/conflict/linking behavior; Google/password creation races; rollback if session establishment fails; credential/identity input validation; CSRF origins; real HTTP limits; unchanged ID-scoped guest/other-customer order isolation; refresh, separate browser contexts, keyboard activation, mobile overflow and axe accessibility.

Browser fixtures intentionally simulate a delivered mailbox token and use the real activation/session/UI paths. Provider delivery and retry behavior are covered by API mocks. Screenshots/traces/video are disabled for token-bearing browser cases; no real verification messages were sent. The first browser run exposed duplicate development check requests and a locator that also selected Next's route announcer; both were corrected before rerun. Production builds use the repository's `ORDERLY_BROWSER_PRODUCTION=1` allowance with a loopback API origin, not a deployed service.

## Remaining risks

- Legacy email squatting remains, by explicit policy. No mailbox-only takeover/reclamation is allowed.
- A party who steals the live email link can establish the account. Mailbox security, same-origin XSS prevention and provider handling of message bodies remain essential. Pending link fragments remain in browser history until completion; keep third-party scripts and click tracking off the page.
- Repeated resend requests can annoy a recipient or invalidate their earlier link, bounded by mailbox quotas. Large distributed abuse across different mailboxes still needs provider/WAF monitoring and potentially a later CAPTCHA decision. Existing HTTP counters are not distributed.
- Provider DNS, actual inbox delivery, bounce handling and production configuration were not exercised. Failure recovery is explicit resend, not a delivery queue. During an outage, changing providers/configuration is an operational action.
- Verification attests an address at a point in time, not perpetual control. No email change, password reset, recovery, deletion or historical guest-order claim feature is included.
- Expired pending/quota records are lazily purged; schedule an operational purge if low request volume or retention requirements warrant it.
- Automated browser coverage uses Chromium and separate browser contexts; Firefox/Safari engine-specific checks remain part of manual staging acceptance.

## Deployment requirements (not performed)

1. Review and apply the additive migration through the normal approved deployment workflow, then regenerate Prisma and deploy coordinated API/web versions. The old register response is intentionally replaced by a pending response; do not roll out the old immediate-session UI against the new API.
2. Provision a verified sending domain/DNS and sender, set the two mail variables, exact HTTPS WEB_ORIGIN and existing customer JWT/proxy settings. Confirm NODE_ENV is production and test-provider switches are disabled.
3. Disable click tracking; redact request bodies for registration check/completion and authentication endpoints in hosting, reverse proxy, APM and error reporting. Monitor aggregate mail failures/limits without recording links, passwords or recipients unnecessarily.
4. Validate migration/backups and perform the synthetic manual checks below in an approved staging environment. Confirm existing-account null timestamps and unchanged ownership/session policy. Do not backfill ownership from email.
5. If scheduling cleanup, delete only rows with `expiresAt <= now()` and `windowStartedAt <= now() - interval '1 hour'`; never delete a live transaction or reset a current abuse window.

## Manual acceptance checklist

- [ ] On desktop and 320px mobile, register a synthetic address; see the neutral pending state, cooldown, and no authenticated account/session before completion.
- [ ] Inspect the controlled mailbox message: trusted HTTPS origin, fragment token, no password, correct expiry/ignore guidance, and no click tracking.
- [ ] Click without submitting: no account is activated. Refresh and open in another browser; explicitly choose the owner's own name/password, complete once, and see the completed state/account session.
- [ ] Confirm the original requester has no session and its initially supplied password cannot log in. Confirm owner credentials work and normal refresh/logout still work.
- [ ] Try expired, altered, replayed and concurrently submitted links; only one valid completion succeeds, with no duplicate customer/session.
- [ ] Resend inside cooldown/hourly limit; no extra messages. After cooldown, replacement link works and previous link fails. Simulate provider failure and recover with resend.
- [ ] Try an existing synthetic legacy password/Google address: no overwrite, merge or extra session; legacy login and explicit matching Google linking retain their policy.
- [ ] Confirm matching-email guest and another customer's orders remain absent from new account history and protected in detail routes.
- [ ] Navigate and submit by keyboard; confirm labels, error focus and screen-reader status/alert announcements. Check mobile overflow and password-manager behavior.
- [ ] Check operational logs/APM/provider settings for absence of raw verification tokens/passwords and verify approved production configuration before deployment.

No commit, push, deployment, account deletion, password reset, email change or production-data modification is part of this stage.
