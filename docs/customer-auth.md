# Customer password authentication — Stage 13.2

Customer authentication is separate from Admin authentication. No existing
identity or order ownership is migrated. The nullable Google subject reserves
the agreed schema shape; Google authentication is not implemented.

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
`{ user: { id, email, name, phone } }`. Tokens remain in HttpOnly host-only
cookies with SameSite=Lax, path `/api`, and Secure in production. Identity
responses and cookie writes prohibit caching. Invalid mutations return 403;
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
Google linking, recovery and frontend customer state are later-stage work.
The credential invariant is enforced by the customer service/strategy;
direct database writes must preserve at least one credential.

Nest's existing default in-memory throttling is per instance. Production QA
must review shared rate-limit storage and trusted-proxy IP handling.

Stage 13.8 must also address the existing order-number concurrency race:
`generateOrderNumber` reads the latest number and increments it, which can
collide during simultaneous order creation. Stage 13.2 does not change it.
