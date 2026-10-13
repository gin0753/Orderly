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

See [latest registration evidence](../testing/registration-modes.md) and [security findings F-02/F-03/F-05/F-06/F-08](../security/security-acceptance.md). These conditions remain visible even if the public demo chooses direct signup.

## Docker image and separate migration job

Build from the repository root:

```sh
docker build -f apps/api/Dockerfile -t orderly-api:production .
```

The image uses Node.js 22 and runs as the unprivileged `node` user. Its default
command is `node dist/src/main.js`, matching the existing Nest build output.
Only the API and its workspace dependencies are built. pnpm's legacy deploy
mode creates an isolated production dependency tree without changing workspace
settings. Prisma Client is generated in Linux during the build, including in
the isolated dependency tree. No database connection is needed to build.

Supply configuration privately at runtime. The ECS/Fargate port and architecture examples below are generic container guidance, not evidence of an Orderly ECS deployment:

- `DATABASE_URL`: reachable PostgreSQL database with the appropriate TLS settings.
- `DIRECT_DATABASE_URL`: direct PostgreSQL connection used by Prisma migrations;
  use the direct Neon endpoint when `DATABASE_URL` uses pooling.
- `ORDERLY_PROXY_IDENTITY_SECRET`: the same independent high-entropy secret as
  the Vercel deployment, at least 32 UTF-8 bytes. Required at production startup.
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and `JWT_REFRESH_TTL_DAYS`: the
  existing authentication configuration. The two secrets must differ and
  contain at least 32 characters in production; missing or unsafe secrets
  fail API startup.
- `JWT_ACCESS_TTL` and `JWT_REFRESH_TTL`: durations such as `15m` and `7d`;
  the refresh duration must match `JWT_REFRESH_TTL_DAYS` (for example, `7`).
- `WEB_ORIGIN`: the production frontend origin.
- `CUSTOMER_JWT_ACCESS_SECRET` and `CUSTOMER_JWT_REFRESH_SECRET`: independent
  random secrets of at least 32 characters, distinct from each other and both
  Admin JWT secrets. The optional customer issuer, audience, access/refresh
  TTLs, and absolute session TTL are documented in `apps/api/.env.example`.
- Optional Google OAuth: set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and
  `GOOGLE_CALLBACK_URL` together. The callback must be the exact HTTPS
  `WEB_ORIGIN/api/customer/auth/google/callback` URL registered with Google.
- `PORT`: listening port; falls back to `API_PORT`, then `4000`.
- `OPENAI_API_KEY` and `OPENAI_MODEL` if using the existing AI menu feature.

`NODE_ENV=production` is set in the image. Authentication cookies therefore
require HTTPS. Match the ECS container port and load balancer target port to
the runtime listening port. `/api/health` is the existing health endpoint; it
does not query the database on each request. The API connects to PostgreSQL
at startup. The image architecture must match the Fargate task architecture
(for example, build with `--platform linux/amd64` for X86_64 tasks).

Run migrations as a separate one-off task using the same image and override
the container command with:

```json
["prisma", "migrate", "deploy"]
```

The Prisma CLI, schema, and committed migrations are included. The command
runs in `/app` and needs `DATABASE_URL`, `DIRECT_DATABASE_URL`, database network access, and migration
permissions. It does not seed the database. Wait for a successful task exit
before deploying API tasks that require the new schema. API startup does not
automatically apply migrations. Existing databases need migration history
compatible with the committed migrations.
The Stage 13.8 order-number sequence migration must precede deployment of API
code that allocates numbers from it.

No `.env` files are sent to Docker. The final image contains production
dependencies, compiled code, the package manifest, schema, and migrations.
No ECS resources or deployment pipeline are provisioned by this change.


## Same-origin proxy and local production builds

Production browser requests use same-origin `/api`; `next.config.ts` rewrites to the server-only `ORDERLY_API_ORIGIN` with exactly one `/api` prefix. Server-rendered menu fetches use an absolute API origin. The proxy secret is server-only and must match the API; neither it nor the API origin belongs in `NEXT_PUBLIC_*`. Production enforces same-origin routing even if an old public API URL remains configured. Local development can use localhost API routing. Local production builds need an explicit API origin and signing secret; the browser runner's loopback exception is a test-only override, never deployed configuration.

## Privacy policy operating responsibilities

The public privacy/terms routes are anonymous static pages, not compliance certification. Review the current [policy component](../../apps/web/src/components/layout/policy-page.tsx) and [privacy page](../../apps/web/src/app/%28customer%29/privacy/page.tsx) whenever processors or identity/order behavior change. Establish a monitored operator contact and a request-handling process, verify portfolio-only/no-fulfilment/no-payment status, and confirm hosting regions, logs, backups, access and retention. Do not promise universal backup/provider/browser erasure. Current guest access uses receipt proof and current account deletion scrubs contact data subject to documented business-snapshot retention; the earlier policy-packaging report's contact-only tracking and not-yet-implemented deletion statements were historical. Optional AI drafts receive menu content, not intended customer/order records; keep personal data out of product text. Provider retention and legal applicability remain owner follow-ups.

## Publication and hosting triggers

CI checks and builds are not deployment approval. Hosting Git integrations may rebuild/deploy and run separately configured migration jobs on a main merge, even for documentation changes. Historical post-C4 remote/ref/provider snapshots do not establish today's trigger policy. Review actual Vercel/Railway branch, preview, watch-pattern, CI-waiting and pre-deploy behavior before an approved publication. This hygiene change performs no commit, push, merge, tag or deployment.

## Release preparation appendix

The following copy was prepared on 13 October 2026 at `9c33c3482b81d48607559201797f5f77524ae489`. It is a draft, not a published release or a refreshed provider observation.

### Draft GitHub release description

**Orderly v1.0.0 — Full-stack ordering portfolio**

Orderly combines a Customer storefront and account/order history with a separately authenticated Admin workspace. V1 demonstrates server-authoritative pricing, atomic PostgreSQL order numbers, owner-scoped reads, rotating sessions, safe Google linking and transaction-coordinated checkout/deletion.

- [Customer Live Demo](https://orderly-web-gamma.vercel.app)
- [Admin walkthrough](https://github.com/gin0753/Orderly/blob/main/docs/portfolio/assets/admin-walkthrough.mp4) and [screenshots](https://github.com/gin0753/Orderly/blob/main/docs/portfolio/screenshots.md) — URLs become valid after the approved packaging merge.
- Production revision consistency verified by deployment metadata and owner dashboard confirmation; owner-confirmed manual functional acceptance. The exact UAT date and browser/device matrix were not formally supplied. Scoped automated and CI evidence is documented in the README and acceptance reports.
- Public registration uses observed `direct` mode: email ownership remains unverified. There is no public Admin access. Product availability/archive are API-only in the current Admin frontend.

Real-provider freshness/delivery, operational restore/redaction and cross-engine acceptance remain separately documented conditions. This release does not claim completion of those specific checks. Publish this copy only after the final revision/privacy review and approved tag.

### Repository About and topics

Suggested About: **Full-stack food ordering portfolio with Next.js, NestJS and PostgreSQL: customer checkout, private order history and Admin workflows.**

Suggested website: `https://orderly-web-gamma.vercel.app`.

Suggested topics: `nextjs`, `react`, `typescript`, `nestjs`, `postgresql`, `prisma`, `full-stack`, `portfolio`, `playwright`, `docker`, `tailwindcss`, `food-ordering`.

The current public About uses “Production-grade”; replace that broad claim with the specific description above when separately authorized. No About/topics setting was changed.

### Portfolio URLs

Available now:

- [Customer demo](https://orderly-web-gamma.vercel.app)
- [Public repository](https://github.com/gin0753/Orderly) — default main presentation still predates packaging.
- [Packaging candidate](https://github.com/gin0753/Orderly/tree/stage-17/portfolio-packaging)
- [Candidate Admin MP4](https://github.com/gin0753/Orderly/blob/stage-17/portfolio-packaging/docs/portfolio/assets/admin-walkthrough.mp4)
- [API health](https://orderly-production-1ac4.up.railway.app/api/health) — health, not revision attestation.

After approved merge/tag: canonical root `https://github.com/gin0753/Orderly`, main README-linked media, and planned release `https://github.com/gin0753/Orderly/releases/tag/v1.0.0`. The release URL is **not live yet**.

All three video files are below normal Git file limits and require no LFS. Keep the original and separate polished export; choose the release-linked version after explicit media review rather than silently replacing evidence. The 75-second version remains canonical in the current README.

## Future Admin demo boundary

V1's accepted choice supersedes the earlier read-only-demo feasibility recommendation: Customer demo plus recorded synthetic Admin presentation, with no public Admin credentials. V1.1 remains a separate potential project. An interactive demo would require isolated frontend/API/database and independent secrets/providers, backend default-deny capabilities/quotas, deterministic synthetic fixtures, absolute session expiry, durable reset-generation fencing coordinated with in-flight writes, fail-closed interrupted/missed reset handling, explicit shared-state warnings, monitoring/recovery ownership and measured costs. Reusing production write credentials or periodically resetting the current database is not an implementation option. No old hosting cost estimate, reset worker, analytics/settings feature or isolation guarantee is claimed shipped.
