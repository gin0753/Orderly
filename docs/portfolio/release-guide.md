# Release and environment guide

Prepared 13 October 2026. This is an operator checklist, not deployed acceptance evidence. No production database changes or deployment are authorized by Stage 17.

## Public-demo checklist

- [ ] Record the reviewed source revision and coordinated web/API artifact versions.
- [ ] Choose and record `CUSTOMER_REGISTRATION_MODE=verified` or `direct` on the API. Default is verified; never infer the running mode from the README.
- [ ] Direct mode: display and verify the existing unverified-email disclosure; acknowledge email-squatting/address-availability risk. Do not backfill `emailVerifiedAt` or claim mailbox ownership.
- [ ] Verified mode: configure Resend, verify inbox arrival and complete expiry/replay/resend/failure-recovery checks with synthetic staging recipients.
- [ ] Confirm exact HTTPS web/API origins, proxy signing, cookies and origin checks; test direct API behavior and effective throttling.
- [ ] Keep Admin private. No public credential, editable demo, read-only demo, reset worker or demo architecture is part of V1.
- [ ] Take a recoverable backup and rehearse restore, migration and coordinated cutover on synthetic staging.
- [ ] Run scoped release tests and manual staging requirements below; retain failures and exact revisions.
- [ ] Inspect sanitized deployment/proxy/APM logs for secret leakage; verify provider tracking/retention and budget/usage settings.
- [ ] Obtain deployment approval only after the concrete release materials and staging evidence are reviewable.

## Environment configuration

The authoritative examples are [API](../../apps/api/.env.example) and [web](../../apps/web/.env.example). Never publish populated files.

| Variable group | Location | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | API | Runtime PostgreSQL; pooled Neon endpoint if chosen |
| `DIRECT_DATABASE_URL` | API/migration job | Same logical database, direct endpoint for migrations |
| `WEB_ORIGIN` | API | Exact Customer HTTPS origin and permitted mutation origin |
| `PORT` / `API_PORT` | API | Railway listening port; runtime falls back to 4000 |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | API | Independent Admin signing keys |
| `CUSTOMER_JWT_ACCESS_SECRET`, `CUSTOMER_JWT_REFRESH_SECRET` | API | Independent Customer keys, distinct from both Admin keys |
| JWT/session TTL variables | API | Keep refresh TTL/day values consistent; customer absolute lifetime is separately capped |
| `ORDERLY_API_ORIGIN` | Web server/build | Exact HTTPS API origin; production browser uses same-origin `/api` |
| `ORDERLY_PROXY_IDENTITY_SECRET` | API and web server | Matching high-entropy HMAC secret, at least 32 UTF-8 bytes |
| `CUSTOMER_REGISTRATION_MODE` | API | Strict `verified` or `direct`; default verified |
| `REGISTRATION_EMAIL_API_KEY`, `REGISTRATION_EMAIL_FROM` | API | Required for production verified signup; sending-only Resend key and authorized sender |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` | API | Optional, all configured together; callback on web origin `/api/customer/auth/google/callback` |
| `OPENAI_API_KEY`, `OPENAI_MODEL` | API | Optional Admin draft assistant |
| `NEXT_PUBLIC_AI_ASSISTANT_ENABLED` | Web build | UI opt-in, also gated by authenticated API capability |
| `NEXT_PUBLIC_API_BASE_URL` | Web local development | Local API URL only; never secrets |
| `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD` | Private provisioning | Operator-only credentials; never publish/share as demo access |
| `TEST_DATABASE_URL` | Local/CI tests only | Loopback `orderly_test?schema=public`; never a staging/production URL |

Generate four distinct JWT secrets (at least 32 characters) and a separate proxy signing secret outside source control. Set `NODE_ENV=production` in deployed API. No provider test flags, local test JWT values, or `ORDERLY_BROWSER_PRODUCTION` production-validation exception belong in deployment configuration.

## Railway and Vercel setup notes

Railway: build the API Docker image from repository root with `apps/api/Dockerfile`, configure runtime variables and the assigned port, and use `/api/health` for service health. The image runs as the Node user and starts compiled NestJS. Health returns service availability; it does not query the database for each request. Configure a reviewed pre-deploy/one-off migration step `prisma migrate deploy` with both database URLs; wait for success before activating the matching API. The Docker CMD does not migrate or seed. Console settings were not inspected or changed in Stage 17.

Vercel: configure the monorepo project for `apps/web`, pnpm workspace install, Next.js build, HTTPS `ORDERLY_API_ORIGIN`, and the matching server-only proxy secret. Set the optional AI public flag at build time. Confirm `/api/*` rewrites reach the intended API, cookies remain same-origin, and preview projects do not inherit production write credentials. Hosting eligibility, costs, Git deployment triggers and project-specific settings need operator confirmation; repository configuration is not evidence of those settings.

Neon/PostgreSQL: use runtime pooling only where appropriate; migrations use the direct connection. Both connections must target the same intended logical database. Check connection limits, TLS, database role grants, backups and restore procedures. No provider resources were provisioned here.

## Migration and seed safety

For deployed environments use committed migrations with `prisma migrate deploy`, never `migrate dev`, `migrate reset`, test reset or destructive seed. Preserve Security 2A/2B and receipt-capability migrations. Rehearse against a populated synthetic copy, measure lock/cutover time, and coordinate all API writers. Never roll back to contact-only tracking or weaken registration/security behavior as a recovery shortcut.

`seed:demo` inserts catalog data only when categories/products are absent, inside a serializable transaction; it is not a periodic restore job and is not proof that the selected database is safe. `seed:admin` provisions operator-controlled identity; inspect target and credential handling first. Neither is implicitly part of deployment.

The default `prisma db seed` is destructive and requires an explicit local opt-in with its own guard. Packaging instead uses the stricter existing test reset guard: `NODE_ENV=test`, loopback `orderly_test`, public schema, matching Prisma targets, no Railway/Vercel markers. `pnpm portfolio:capture` **erases orderly_test** before seeding synthetic fixtures. Stop other test suites first; it cannot be directed at production. The test credentials are generated per run and never included in recorded login screens.

## Remaining manual staging requirements

- Real Resend sending-domain authorization, restricted key, inbox arrival, disabled click tracking, fragment-link behavior, expiry/replay/resend and uncertain-send recovery. Provider acceptance is not inbox delivery.
- Real Google sign-in/linking, callback configuration and Google-only deletion: signed after-intent `auth_time`, exact subject, old/silent SSO rejection and fresh challenge usability. Synthetic OIDC tests do not establish provider behavior.
- Both registration modes on desktop/mobile; pending-link mode switching, honest verification evidence, account isolation, logout/password/deletion revocation and fresh-UUID re-registration.
- Guest receipt proof, private history 404 boundaries, owned checkout and deletion coordination, active-order blocking and retained terminal snapshots/contact scrubbing.
- Focused Firefox/Safari, real mobile keyboard and screen-reader checks for verification/deletion; old Stage 15 evidence is insufficient for later security flows.
- Recoverable backup/restore, populated upgrade/lock timings, coordinated web/API rollout, direct API/proxy throttling and sanitized secret-redaction inspection.
- Assign expired security-metadata cleanup ownership/frequency while preserving live barriers/grants and mailbox abuse windows. Review process-local HTTP rate limits before horizontal scaling.

See [latest registration evidence](../v1-dual-registration-mode-report.md) and [security findings F-02/F-03/F-05/F-06/F-08](../v1-final-customer-security-acceptance-report.md). These conditions remain visible even if the public demo chooses direct signup.
