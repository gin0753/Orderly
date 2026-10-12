# V1 customer email ownership security audit

Date: 2026-10-11. Audited HEAD: `b23e165d4ee7f56ed918dc557d60f1fae0bc163a`.

## Outcome and limits

Password registration does not verify mailbox ownership. However, registering somebody else's email does **not** attach their existing orders, import their personal details, or merge their Google account. Customer Orders uses the authenticated customer ID.

A separate **P1 confidentiality finding** exists in public order tracking: a known or guessed contact address/phone plus an order number is sufficient to retrieve personal order details without proving ownership. This applies to customer-owned orders as well as guest orders. Email verification at registration would not fix this endpoint.

Two **P2 findings** concern permanent email squatting and registration-based account enumeration. No P0 or demonstrated email-based customer-account takeover was identified. Missing verification alone is not assigned a critical severity.

This is a static source and existing-test review, not a live penetration test. Existing test specifications were inspected but not executed during this audit. No customer records, production services, environment secrets or databases were accessed. Deployment parity, provider settings, operational monitoring and actual exploitation remain unverified. Severity reflects the reachable code path and returned fields; it does not assert a production incident. Only this report was added.

## Findings by requested area

### 1. Registration and email verification

[CustomerAuthService](../apps/api/src/modules/customer-auth/customer-auth.service.ts), `register`, canonicalizes the email, hashes the password, creates a customer and immediately creates a session. [Credential validation](../apps/api/src/modules/customer-auth/dto/customer-credentials.dto.ts) checks email syntax, not mailbox control. [CustomerUser](../apps/api/prisma/schema.prisma) has a unique email and optional password hash/Google subject, but no email-verification state. No verification challenge, mail-delivery workflow or password-recovery flow was found in the reviewed implementation.

Successful password login proves knowledge of the account's password, not ownership of its registered mailbox. Login uses generic failures and a dummy bcrypt comparison for missing/passwordless accounts. Profile updates are scoped to the authenticated customer; email is read-only in the customer profile UI.

### 2–4. Guest orders, Customer Orders and another person's email

[CustomerOrdersController](../apps/api/src/modules/orders/customer-orders.controller.ts) requires customer authentication. [CustomerOrdersService](../apps/api/src/modules/orders/customer-orders.service.ts) includes `customerUserId` in list, count, filter, pagination and detail queries. Other-owner, unowned and missing orders receive the same detail failure.

[Order creation](../apps/api/src/modules/orders/orders-public.controller.ts) obtains the owner from the optional authenticated principal. The submitted contact email is an independent historical snapshot; it does not choose the owner. Unknown ownership fields are rejected by validation. The [ownership migration](../apps/api/prisma/migrations/20261006010000_customer_order_ownership/migration.sql) adds a nullable foreign key without email-based backfill. No claim or email-based attachment workflow was found.

Consequently, an attacker registering an unused victim email gets a new customer ID and their own submitted profile values, not the victim's prior profile or order history. An existing account's unique email prevents replacement by registration. The ownership model is stable ID-based authorization, rather than a literally immutable database column: account deletion can null the foreign key while preserving order snapshots.

Public tracking is a separate route and weakens this otherwise sound boundary; see F1. Registration is unnecessary to exploit that route.

### 5–6. Google OAuth, linking and `email_verified`

[Google provider](../apps/api/src/modules/customer-auth/google-provider.ts) uses the OIDC authorization-code flow with state, nonce and PKCE checks. It requires a nonempty subject/email and strictly requires `email_verified === true`; false, missing and string-valued claims fail this check. Signed-token validation is performed through the OIDC library.

Google sign-in resolves an existing account by Google subject. For a new subject, a matching existing email causes a conflict; it does not merge or sign into that account. This prevents email-based takeover, although it creates the availability consequence in F2.

Explicit connection requires an active initiating customer session, password reauthentication and a matching verified Google email. The [OAuth transaction](../apps/api/src/modules/customer-auth/customer-google-oauth.service.ts) is browser-bound, expires after five minutes, is single-use and binds the linking callback to its initiating session. Subject uniqueness and guarded updates prevent moving another customer's Google identity. The mock provider is restricted to the test environment; it is not an unconditional production bypass.

Existing-subject sign-in retains the stored customer email even if Google's returned email changes. Thus a linked Google authentication method is not proof that the stored contact address remains current. Google also cautions that `email_verified` for third-party email domains does not always establish Google's continuing authority over that mailbox. Neither observation demonstrates takeover in Orderly's subject-based sign-in. Future email recovery/claims must use an explicit mailbox-ownership policy. [Google token guidance](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token).

### 7. Enumeration, abuse and squatting

[Auth routes](../apps/api/src/modules/customer-auth/customer-auth.controller.ts) limit registration and login to five requests per minute; Google sign-in initiation is limited to ten and connection initiation to five. The [global throttle](../apps/api/src/app.module.ts) is 100 requests per minute. Guest lookup has no tighter route override in the reviewed controller.

The proxy identity implementation verifies signed forwarding information rather than accepting an arbitrary forwarded client address. Actual production proxy integration was not inspected. Origin/client-header/JSON checks help prevent browser CSRF but do not prove mailbox ownership or stop a scripted registration client. No durable mailbox-specific quota, pending-registration expiry, CAPTCHA or mailbox-owner reclamation mechanism was found. These limits reduce request volume but cannot reliably prevent targeted squatting or distributed abuse.

### 8. Implicit verification assumptions

Checkout prefills the signed-in customer's supplied contact information while allowing different order contact details. This does not change account ownership. Profile email display and the public customer response provide no verification indicator. Authentication method labels describe login capability, not verified mailbox identity.

The current guest lookup effectively treats knowledge of an email/phone as authorization. This is the consequential ownership assumption. No reviewed account-history workflow treats matching registered email as verified ownership. Future recovery, order claims, notifications or identity badges must not infer verification from a password session or simply from the presence of a Google subject.

## Confirmed finding register

| ID | Severity | Demonstrated impact and prerequisite | Evidence |
| --- | --- | --- | --- |
| F1 | P1 | Unauthenticated disclosure of personal order information when the caller knows/guesses an order number and either matching email or phone. No registration or mailbox access required. | Public `POST /api/orders/guest/lookup`; `OrdersService.lookupGuestOrder`; tracking mapper. |
| F2 | P2 | An attacker reserves an unused victim email with their own password. The legitimate mailbox owner cannot register that address or complete first-time Google sign-in; no self-service recovery was found. No victim history or Google credentials are gained. | `register`, email uniqueness, `signInWithGoogle` conflict logic. |
| F3 | P2 | Registration distinguishes an existing account through HTTP 409 and an explicit message, versus successful registration. This reveals account membership, not profile contents. | Registration controller/service and duplicate-registration test. |

P1 denotes significant personal-data exposure through a reachable authorization weakness; P2 denotes meaningful abuse/privacy risk without demonstrated account takeover. No P3 defect was independently established. Current contact-email staleness is a documented limitation, not elevated into a speculative exploit.

### F1 evidence and bounded reproduction

[Lookup implementation](../apps/api/src/modules/orders/orders.service.ts), `lookupGuestOrder`, matches order number and an OR of email/phone. Supplying both contacts does not require both to match. There is no mailbox challenge, receipt capability, authentication requirement or `customerUserId: null` restriction. Order numbers are generated from a database sequence and must not be treated as secrets.

[Tracking response mapper](../apps/api/src/modules/orders/mappers/order-tracking.mapper.ts) returns customer name, email, phone, address fields, notes, items/options, prices, payment status, order UUID and timestamps. A matching response therefore reveals considerably more than public progress status.

The existing `orders.e2e-spec.ts` guest-lookup cases demonstrate successful anonymous lookup by email and by phone, and generic failures for incorrect contact/unknown number. The source query establishes that the same lookup can match an owned order. A delivery fixture would additionally exercise the address fields present in the mapper. These tests were read, not newly run. No real identifiers were guessed, harvested or published during this audit.

## Existing regression evidence reviewed

- [Customer auth E2E](../apps/api/test/customer-auth.e2e-spec.ts): immediate registration/session, duplicate rejection, generic login failures and login throttling.
- [Customer Orders E2E](../apps/api/test/customer-orders.e2e-spec.ts): owner-scoped lists/counts/filters/pages and indistinguishable failures for other-owner, guest and missing details; historical snapshots independent of account contact email.
- [Orders E2E](../apps/api/test/orders.e2e-spec.ts): authenticated ownership with different submitted contact details, injected owner-field rejection, anonymous contact lookup and account-deletion snapshot preservation.
- [Google E2E](../apps/api/test/customer-google.e2e-spec.ts): no automatic email merge, reauthenticated linking, wrong-email/session/subject rejection, race protection and subject reuse despite changed provider email.
- [Provider E2E](../apps/api/test/google-provider.e2e-spec.ts): signed OIDC validation including signature, issuer, audience, expiry, nonce and unverified-email rejection.

These specifications support the reviewed controls, but their current pass status was not revalidated. A dedicated same-email guest/other-owner registration test and missing/string-valued `email_verified` tests would make the exact audit boundaries explicit.

## Smallest production-appropriate V1 solution

### First: repair the tracking authorization boundary

Require a cryptographically random receipt capability for anonymous access to full tracking details, or an authenticated matching customer owner. Store the capability's hash, avoid logging it, and deliver it only through the order-creation receipt or a verified contact channel. Do not fall back to order-number/contact matching when capability validation fails. Minimize returned personal fields and apply focused lookup abuse limits.

Legacy order access needs an explicit compatibility decision: owner-authenticated access for owned orders, and mailbox/phone proof or a controlled support process for old guest receipts. Do not attach orders retrospectively by email. Merely making order numbers less obvious, adding registration verification, or returning fewer fields is insufficient to fully authorize anonymous order access. Field minimization can be containment, but status/items can also be private.

### Second: verify password registration without creating permanent reservations

For unrestricted production password signup, introduce a short-lived pending registration and mailbox challenge before activating the durable account. Use hashed random single-use expiring tokens, bounded resend/attempt limits and neutral acknowledgement responses. Expired attempts must not permanently reserve an address. OWASP recommends ownership verification before activation and generic responses to reduce enumeration. [Email verification guidance](https://cheatsheetseries.owasp.org/cheatsheets/Email_Validation_and_Verification_Cheat_Sheet.html), [authentication guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html).

Completion must not activate an attacker-chosen password merely because a mailbox owner clicked an unsolicited verification link. Bind the registration transaction appropriately and have the verified owner establish their credential in the completion flow. Preserve existing OAuth subject/linking protections; define when provider proof is accepted and when an explicit mailbox challenge is required.

Existing unverified accounts require a separate migration/reclamation policy. Do not silently merge them, transfer historical orders, or let verification overwrite their credentials. Adding only a boolean verification field while keeping permanent unique-email reservations would leave F2 unresolved.

If mail infrastructure cannot be safely delivered for V1, temporarily closing new password registration under separate approval is a smaller containment option, while preserving supported existing sign-in and guest checkout. It does not fix pre-existing reservations or F1. No such change is implemented or authorized by this audit.

## Packaging and release recommendation

**Do not approve unrestricted real-customer release with F1 outstanding.** Confirm whether deployed behavior matches the audited route and treat matching behavior as a release blocker. Avoid probing real customer data to establish parity.

Email verification is not automatically a prerequisite for creating Portfolio Packaging artifacts. A clearly labelled demonstration restricted to synthetic data can document the limitation and its threat model. It should not be represented as verified-email or real-customer production readiness. For a publicly usable V1 with durable password registrations, verification/expiry is recommended before opening signup, or F2 must have explicit risk acceptance and a containment plan. F3 should be addressed with that registration flow. Registration verification alone cannot close F1.

This is a focused security recommendation, not a reversal of prior visual/test acceptance. Packaging approval remains an owner decision; no packaging, implementation or deployment was performed.

## Estimated implementation and regression scope

Estimates assume one engineer familiar with the repository and available guarded local test infrastructure; they are planning ranges, not commitments.

| Work | Implementation | Regression/operational verification | Likely scope |
| --- | --- | --- | --- |
| Receipt-based tracking authorization | 2–4 engineer-days | 1–2 days | Token storage/migration, creation/lookup DTOs and service, customer tracking receipt storage/form, legacy access policy and API/browser tests. |
| Password email verification and pending expiry | 4–7 engineer-days | 2–3 days, plus mail-provider/DNS setup | Pending/token state and migration, email integration, registration/completion/resend UI/API, enumeration/rate controls, session activation and existing-account policy. No existing mail workflow was found. |
| Registration closure as interim containment | About 1 day | About 1 day | Narrow availability/UI policy and regressions; excludes resolving old squatted accounts. |

Mail delivery, legacy-account ownership decisions and production configuration approval can extend these ranges. No new feature-flag framework or broad authentication rewrite is needed.

Required regressions include same-email guest/other-owner isolation; different checkout contact snapshots; authenticated and receipt-only access; wrong/replayed/expired capabilities; absence of sensitive response fields on failure; historical snapshot preservation; Google subject conflicts and session binding; false/missing/string `email_verified`; registration enumeration responses; expiry/resend/races; and prevention of activation with attacker-selected credentials. Include mobile receipt/verification flows, browser back/forward, inaccessible-mail scenarios and mail-service failures. Use only guarded synthetic test databases. Do not weaken ownership assertions to accommodate legacy access.

## Audit verification

Working tree was clean at audit start. Read-only Git/source searches and test review were used; no application test suites, migrations, builds or database preparation were run. Final checks are documentation link existence, whitespace validation, unchanged HEAD and Git status showing only this new report. No code, schema, configuration, index or deployment changes are part of this audit.
