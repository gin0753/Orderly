# V1 email-provider feasibility: Gmail API

Date: 13 October 2026 (Australia/Sydney). Scope: documentation-only feasibility audit; no provider authorization or delivery experiment.

## Recommendation

**NO-GO for an immediate public-production replacement of Resend.** Gmail API is technically capable of unattended registration delivery from a dedicated personal Gmail account over HTTPS without buying a sending domain. A low-volume, owner-authorized integration is a viable candidate, but its verification-exemption applicability, account authorization and operational delivery behavior are not established for Orderly. This is a readiness verdict, not a claim that Google prohibits all such integrations.

**Testing mode is NO-GO for long-term unattended deployment.** A Production-published, unverified application can operate in applicable exempt scenarios; publishing alone does not establish an exemption or complete verification. Do not treat the unverified-app warning bypass as permission to evade a required review.

Smallest no-purchase path: first check whether an already owned or legitimately delegated domain/subdomain is available for the existing Resend integration. If there is no such DNS access and using a Gmail address is mandatory, pursue only a separate, owner-only Gmail sending integration in Production, subject to the gates below. Do not implement it until those gates are resolved. No unconditional, verified domain-free public delivery solution was established by this audit.

## Evidence and limits

Reviewed `apps/api/src/modules/customer-auth/registration-mailer.ts`, the registration service and the Security 2A/2B reports. Current official Google and Resend documentation was reviewed over HTTPS. Railway Hobby's outbound SMTP block is accepted as supplied context; no SMTP investigation or implementation was performed.

No Railway or Google dashboard, actual OAuth publishing/verification status, sender account, secrets, domain ownership or delivery reputation was inspected. No real emails were sent. Documentation establishes platform capabilities and published rules; it does not prove recipient inbox delivery, policy approval or token behavior for a particular project.

## Existing security boundary to preserve

The existing `RegistrationMailer.send(email, link)` uses the Resend HTTPS API, a server-side API key and configured sender, with a ten-second request bound and generic errors. Production requires configuration; automated tests override delivery and cannot send through this adapter.

Any separately authorized replacement must retain:

- Pending registration only, 30-minute expiry, random single-use token with only its digest in the application database, and password establishment by the email owner on `/verify-email`. A click, GET or scanner must never activate an account.
- Trusted `WEB_ORIGIN`, fragment-based verification links, token redaction, neutral account-enumeration responses, transactional consumption/customer/session creation, duplicate and concurrent registration protection.
- Existing resend rotation, 60-second mailbox cooldown, five-attempt hourly quota and HTTP guards. Delivery failure consumes the attempt and invalidates the failed token; recovery remains through the existing resend flow.
- Existing-account policy, Google subject identity and linking conflict protections, deletion freshness and grants, session revocation, active-order restrictions, retained historical business snapshots, guest ownership isolation and separate Admin authentication.

Operator Gmail authorization must use a separate OAuth project/client and credentials. Never add `gmail.send` to customer `SIGN_IN`, `CONNECT_GOOGLE` or `DELETE_ACCOUNT`, reuse customer tokens/grants, or connect customer mailboxes. A delivery adapter does not require changes to authentication purposes, Prisma models or customer migrations. These are proposed boundaries, not implemented changes. See [Security 2A](v1-registration-email-verification-report.md) and [Security 2B](v1-customer-account-deletion-report.md).

## Gmail API and authorization

The API sends through `POST https://gmail.googleapis.com/gmail/v1/users/me/messages/send` with a bearer access token. Messages use MIME encoded as base64url; use the authorized Gmail address as sender. Customers need neither Gmail accounts nor Gmail OAuth consent to receive mail. The operator performs interactive authorization once, requests offline access, and the server subsequently exchanges its refresh token over HTTPS for access tokens. This supports unattended sending while authorization remains valid. See [send method](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/send), [message format](https://developers.google.com/workspace/gmail/api/guides/sending) and [offline authorization](https://developers.google.com/identity/protocols/oauth2/web-server).

`https://www.googleapis.com/auth/gmail.send` is **sensitive**, not restricted. It authorizes sending without inbox-reading access. Sensitive-scope verification generally applies unless an exception applies. Send-only scope does not by itself trigger the restricted-scope security assessment; broader read/modify/compose scopes change that assessment and are unnecessary here. See [Gmail scope classifications](https://developers.google.com/workspace/gmail/api/auth/scopes).

Google documents a personal-use exception where only the owner or a few personally known users use the application. A personal Gmail account cannot use the organizational Internal-app exception. Its mailbox is Google-account-linked data, so the service-owned-data/service-account exception is not an alternative. Verification, when required, includes authorized-domain ownership, accurate branding, a public homepage and privacy policy, scope justification and an authorization/use demonstration. See [sensitive-scope verification and exceptions](https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification).

**Interpretation requiring confirmation:** the separate sending integration has one OAuth authorizer, while Orderly serves unknown public visitors. Recipients and visitors do not become Gmail OAuth users merely by receiving a message. Conversely, one authorized sender does not conclusively establish that the overall public application's use qualifies as personal use. The official documentation does not explicitly adjudicate this exact portfolio backend arrangement. Confirm applicability with Google's OAuth verification/support process or complete the required review; do not state that public access automatically requires review regardless of architecture, or that one sender automatically exempts it. Google's [OAuth policies](https://developers.google.com/identity/protocols/oauth2/policies) remain applicable.

## Testing versus Production

| Mode | Consequence | Disposition |
| --- | --- | --- |
| External / Testing | Authorizations and offline refresh tokens expire seven days after consent. The basic profile-only exception does not cover `gmail.send`. | Unsuitable; weekly interactive recovery is not unattended operation. |
| External / Production, unverified | Publishing and verification are separate. Sensitive scopes can produce an unverified warning and a lifetime cap normally of 100 authorizing Google accounts; account protections can block authorization. Required review is not waived. | Technically possible if a legitimate exception applies; not yet approved for this use. |
| External / Production, verified | Approved scopes remove the corresponding unverified-scope limitation; mailbox quotas and token revocation still apply. | Stronger policy readiness, with operational gates still necessary. |

The cap concerns OAuth authorizers, not registration recipients. See [Google app audience rules](https://support.google.com/cloud/answer/15549945?hl=en).

Production removes the Testing-specific seven-day condition, not every expiry/revocation condition. Obtain and validate a new offline grant after publishing rather than assuming an existing Testing token becomes durable. Refresh tokens can cease working after user revocation, six months without use, Gmail-scope password changes, excessive token issuance or other account/policy restrictions. A token is not a permanent credential; `invalid_grant` requires safe failure and operator recovery. See [OAuth refresh-token lifecycle](https://developers.google.com/identity/protocols/oauth2).

## Quotas, abuse and account risks

Consumer Gmail documents sending-limit errors above 500 emails/day or 500 recipients in one message, with sending recovery potentially taking 1–24 hours. Numerous invalid recipients/bounces can also stop sending. This is not a guaranteed daily allowance or the higher Google Workspace quota. See [personal Gmail limits](https://support.google.com/mail/answer/22839?hl=en).

The current Gmail API table lists 6,000 quota units/minute/user/project and 100 units per `messages.send`: about 60 sends/minute as an API ceiling, not a mailbox allowance. Quotas changed in May 2026; some older projects retain previous values. Inspect the actual project's console limits and current pricing before use; API quotas do not override mailbox limits. See [current API quotas](https://developers.google.com/workspace/gmail/api/reference/quota).

Public registration can be abused to exhaust a single sender using many addresses or clients despite existing mailbox guards. A future Gmail implementation needs a small shared sender budget, bounded failure behavior and operational alerting, without weakening existing security limits. Recipient complaints, unsolicited requests and bounces risk reputation loss or account restriction; transactional intent does not guarantee inbox placement. Use a dedicated account, strong multifactor protection, reliable recovery and no marketing traffic. Google prohibits spam and can restrict or terminate abusive accounts. See [Gmail program policies](https://support.google.com/mail/answer/16734397?hl=en).

Sending success is not proof of inbox delivery. Quota/concurrency errors and transient failures require bounded handling; do not blindly retry permanent authorization errors or ambiguous send timeouts that might already have delivered a message. Preserve neutral user responses, token invalidation and resend recovery. See [Gmail error handling](https://developers.google.com/workspace/gmail/api/guides/handle-errors).

## Secrets and retention

Store the operator refresh token and OAuth client secret only in a protected backend secret store, encrypted at rest with restricted deployment/operator access. No browser variables, source control, screenshots, request dumps or plaintext logs. Unlike verification/deletion secrets, the refresh token must be recoverable to redeem it: storing only its digest cannot work. Keep access tokens short-lived and server-side; redact authorization headers, MIME bodies, verification URLs and token endpoint responses. Provide revocation/rotation and manual reauthorization procedures. See [OAuth security practices](https://developers.google.com/identity/protocols/oauth2/resources/best-practices).

Gmail automatically labels API-sent messages as `SENT`. The operator mailbox therefore retains recipient addresses and complete verification messages, including links, beyond the application's pending-record lifecycle. Customer deletion does not erase those copies, replies/bounces or Google's retained data. Digest-only application persistence does not mean the delivery provider has no plaintext token. Send-only scope cannot perform mailbox cleanup; do not expand to restricted scopes just to automate erasure. Establish a mailbox retention procedure and assess provider/backup retention before changing providers. See [Gmail Sent-message behavior](https://developers.google.com/workspace/gmail/api/guides/labels). Existing Resend-specific privacy disclosures would need a separately authorized review before rollout; none were changed here.

## Operational comparison and smallest solution

| Concern | Existing Resend HTTPS | Dedicated Gmail API HTTPS |
| --- | --- | --- |
| Current application work | Existing delivery adapter | MIME construction, access-token refresh/cache and error mapping |
| Credential lifecycle | API key management | Client credentials, interactive offline grant, token refresh and re-consent recovery |
| Public delivery setup | Verified sending domain | Gmail sender plus OAuth policy/publishing assessment |
| Operational burden | Transactional provider integration | Consumer account protection, mailbox quotas, Sent retention and operator recovery |
| Domain-free readiness | Testing sender is recipient-restricted | Technically feasible; unresolved policy and staging gates |

Resend's `resend.dev` sender only delivers test mail to the account owner's address. Arbitrary public recipients require a verified sending domain; using a Gmail address as `from` is not a substitute. Verification requires control of the domain's DNS. A Railway website hostname alone does not establish that control. See [Resend test-domain restriction](https://resend.com/docs/knowledge-base/403-error-resend-dev-domain) and [domain verification](https://resend.com/docs/dashboard/domains/introduction).

Retaining Resend with an existing authorized domain/subdomain is the smallest operational solution if one is available, without buying another domain. Otherwise, the smallest evaluated domain-free candidate is the isolated Gmail adapter described above, after resolving the gates. Do not promise another provider's free-domain support without checking current sender eligibility, authentication and public transactional-use approval. Gmail is a portfolio compromise, not a drop-in equivalent in operational simplicity.

## Remaining external gates and acceptance checklist

1. **Google policy gate:** obtain confirmation of the owner-only exemption for this public backend use, or complete applicable brand/sensitive-scope verification. Confirm authorized-origin/domain requirements can be met on the actual Railway URLs; this audit does not certify a shared Railway domain as verifiable.
2. **Project/account gate:** inspect a separate Gmail project's Production status, declared send-only scope, warnings/restrictions and actual account quota. Validate a fresh offline grant survives restarts and more than seven days without repeated consent. No guarantee of indefinite token validity.
3. **Security/operations gate:** establish protected secrets, sender-wide abuse budget, redacted diagnostics, bounded refresh/send handling and a tested reauthorization runbook. A lost grant must never activate a pending customer or bypass verification.
4. **Real delivery gate:** use approved synthetic staging recipients across Gmail and other mailbox providers. Check inbox/spam placement, link preservation, 30-minute expiry, replay rejection, resend rotation and delivery-failure recovery. API acceptance alone is insufficient.
5. **Retention/disclosure gate:** review Gmail mailbox copies, access, cleanup and third-party/backup retention, then obtain authorization for accurate privacy updates before rollout.
6. **Regression gate for any later implementation:** run mocked delivery success/failure/refresh tests and existing Security 2A/2B registration, OAuth, deletion, session and ownership regressions. Tests must not send real mail.

Until these gates close, retain the **NO-GO for public replacement**. Successful Google confirmation and staging evidence could support a limited-volume GO without purchasing a sending domain; otherwise keep a verified transactional HTTPS provider using authorized DNS, or report the domain-free requirement as unresolved.

## Changes and validation

Only `docs/v1-email-provider-feasibility-report.md` was created. No application, dependency, configuration, privacy, database or deployment changes; no real customer/account operations, commits, pushes or Packaging. Documentation whitespace and repository change scope were checked. Runtime suites were not run because this audit changes no executable behavior; no provider behavior is claimed as tested.
