# Customer authentication — Stages 13.2–13.4

Customer authentication is separate from Admin authentication. No existing
identity or order ownership is migrated. Google OIDC is a second credential
method; the Google subject is authoritative and matching email never links accounts.

## Deployment

Apply Prisma migrations with the normal deployment migration process before
starting the new API. Set independently generated `CUSTOMER_JWT_ACCESS_SECRET`
and `CUSTOMER_JWT_REFRESH_SECRET` (at least 32 characters, different from both
Admin secrets). See `apps/api/.env.example` for issuer, audience and TTL settings.
The API fails startup when configuration is unsafe or secrets are missing.
Production `WEB_ORIGIN` must be the exact HTTPS frontend origin without a
trailing slash. The existing frontend `/api` rewrite keeps browser cookies
first-party; do not send browser authentication requests directly to Railway.

## API contract

All endpoints are under `/api/customer/auth`. Registration accepts required
`email`, `name`, `password` and optional `phone`. Name is trimmed and must be
nonempty. Passwords are never trimmed: registration requires at least 15
characters and no more than 72 UTF-8 bytes; login enforces the same byte maximum.
Email normalization trims and lowercases without provider-specific rewriting.

POST register/login/refresh/logout requests must include:

- `Origin` exactly matching `WEB_ORIGIN`;
- `Content-Type: application/json` (including refresh/logout, with `{}`);
- `X-Orderly-Client: customer-web`.

Register returns 201, login/refresh return 200, logout returns 204. GET `/me`
requires the customer access cookie. Identity responses contain only
`{ user: { id, email, name, phone, authMethods: { password, google } } }`.
Tokens remain in HttpOnly host-only cookies with SameSite=Lax, path `/api`, and
Secure in production. Credential hashes and Google subjects are never exposed.
Responses and cookie writes prohibit caching. Invalid mutations return 403;
invalid credentials/sessions return 401; duplicate registration returns 409.
Registration and login are limited to five requests/minute; refresh to 30.

## Session behavior

Access JWTs default to 15 minutes. Refresh defaults to seven days, slides on
successful rotation, and cannot exceed 30 days from session creation. The cap
uses immutable `createdAt`; no additional absolute-expiry field is needed.
Every protected request checks the persisted session, expiry, activity and
credential invariant. Session deletion immediately revokes access.

Refresh JWTs have a random JTI, session ID and rotation version. Only the full
SHA-256 token digest is persisted. A conditional update checks version and
digest. Replay/hash mismatch revokes the session. A lost concurrent update
returns 401 without deleting the winner; an old-token request arriving after
rotation is treated as replay and revokes the session. The Stage 13.3 client
must coordinate bootstrap and refresh, including concurrent browser tabs.
Transient persistence failures do not clear credentials. Logout does not
report success if revocation fails; malformed/missing cookies remain idempotent.

## Cleanup and known limitations

Schedule the following operation periodically against the intended database
using the deployment's job runner:

```sql
DELETE FROM "CustomerSession" WHERE "expiresAt" <= CURRENT_TIMESTAMP;
```

Expiry checks remain effective without cleanup. No new in-process timer or
deployment scheduler is introduced in this stage.

Local registration does not verify email ownership. Do not use matching email
to link Google identities, recover passwords or claim historical orders.
Recovery and email changes remain later-stage work.
The credential invariant is enforced by the customer service/strategy;
direct database writes must preserve at least one credential.

Nest's existing default in-memory throttling is per instance. Production QA
must review shared rate-limit storage and trusted-proxy IP handling.

Stage 13.8 must also address the existing order-number concurrency race:
`generateOrderNumber` reads the latest number and increments it, which can
collide during simultaneous order creation. Stage 13.2 does not change it.

## Google OAuth (Stage 13.4)

Create a Google OAuth **Web application** client. Set `GOOGLE_CLIENT_ID`,
`GOOGLE_CLIENT_SECRET`, and `GOOGLE_CALLBACK_URL` together on the API. An absent
set disables Google sign-in; a partial set fails API startup. Register the
exact `GOOGLE_CALLBACK_URL` in Google Console. It must be
`WEB_ORIGIN/api/customer/auth/google/callback`, using the public frontend
origin and its `/api` reverse proxy. Do not use the backend Railway hostname.
Use HTTPS in production. Never put the client secret in the web app.

The backend uses authorization code, OpenID Connect, state, nonce and S256
PKCE through `openid-client`. It requests only `openid email profile`. OAuth
transactions expire after five minutes and are consumed once; state, nonce
and browser binding are stored as SHA-256 digests. The short-lived browser
binding is an HttpOnly cookie scoped to `/api/customer/auth/google`. Provider
tokens are not persisted. Completed sign-ins issue normal CustomerSession
cookies. Password accounts with a matching Google email cannot sign in with
Google until the customer signs in with their password and explicitly connects
Google from `/account`, with current-password reauthentication. The provider
subject cannot move between customers. A linked subject remains valid if its
Google email later changes; Orderly does not alter its stored email.

`GOOGLE_OAUTH_TEST_PROVIDER=1` is accepted only under `NODE_ENV=test` and is
used by the controlled browser fixture. It is not a production provider path.

## Customer account management (Stage 13.5)

`PATCH /api/customer/account` accepts only `name` and `phone`. A submitted name
is trimmed, non-empty, and at most 120 characters. Phone is optional, follows
the checkout-style character pattern, and can be cleared with `null` or an
empty string. Email is read-only. The endpoint returns the same sanitized
customer shape as `/customer/auth/me` and requires the existing customer
mutation protections.

`POST /api/customer/account/password` accepts `currentPassword` and
`newPassword` only. It requires an existing password credential, validates the
new password against registration's 15-character minimum and 72-byte bcrypt
limit, and rate-limits attempts. A successful change atomically updates the
hash, deletes all of that customer's sessions, creates a replacement session,
and sets new customer cookies. Old access and refresh credentials are revoked;
Admin sessions are untouched. The account page publishes a session-change
event so other tabs recheck their customer state. Google-only customers cannot
create a password in this stage.

## Authenticated checkout ownership (Stage 13.6)

`POST /api/orders` remains available to guests. It uses optional customer
authentication: no customer cookies means an unowned guest order; any customer
cookie with an invalid, expired, revoked, or inactive session yields 401 before
order creation. Admin cookies alone do not identify a customer. The server
derives `Order.customerUserId` from the validated CustomerSession. The browser
cannot submit an ownership field, and order contact details remain snapshots
from the checkout form even when they differ from the account profile.

The nullable relation uses `ON DELETE SET NULL`. Existing orders are not
claimed from contact details. Ownership indexes support the bounded order
history queries planned for Stage 13.7. Public creation and guest tracking
responses do not expose `customerUserId`.

Checkout prefills untouched name, email, and phone fields from customer state;
typed contact details remain order-specific. Optional-auth requests refresh an
expired access token and retry once. A terminal session failure stops the
order and offers explicit sign-in or guest continuation. Guest continuation
clears customer cookies before a separate submission. A short-lived per-tab
draft preserves manually entered checkout details across a sign-in redirect;
it is read once and removed, and it never stores authentication credentials.
