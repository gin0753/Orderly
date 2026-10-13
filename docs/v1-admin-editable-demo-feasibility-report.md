# Orderly V1 — Admin Editable Demo Feasibility Report

Audit date: 13 October 2026 (Australia/Sydney). Scope: repository inspection and current public hosting documentation only. No implementation, migrations, database connections, resets, deployment changes, commits, pushes, or Packaging work were performed. Live infrastructure configuration, invoices, resource metrics and provider permissions were not inspected. Findings distinguish existing behavior from proposed controls.

## Executive recommendation and verdict

**CONDITIONAL GO for a shared editable demo; recommend an isolated read-only Admin Demo for V1.** A publicly accessible editable demo can reuse the real menu and order UI, but it is not a configuration-only task. The missing pieces are a backend endpoint allowlist, bounded demo sessions, deterministic order fixtures, durable reset coordination, request/reset fencing, abuse quotas and recovery tests. Budget **7–10 engineering days, class B — Medium**, for existing menu/order workflows, excluding new analytics and settings features. Reserve 2–3 additional days if infrastructure or concurrency validation exposes problems; that would move the work into class C.

For V1, a read-only demo provides real navigation, filtering, details and menu inspection with substantially less operational risk. Estimate 3–5 days, class A, with the same synthetic-data and deployment isolation requirements. Accompany it with a recorded editable workflow. If even a second deployment and data store are undesirable, screenshots plus a walkthrough are the lowest-cost release option (approximately 0.5–1.5 days). This audit creates none of those alternatives.

Do not expose the production Admin, point a demo frontend at the production API, publish a production login, or deploy the present API unchanged with a public demo login. A separate database alone does not disable provider calls, protect production credentials, impose session deadlines, or prevent reset races.

| Option | Recruitment value | Effort | Safety and recurring work | V1 recommendation |
| --- | --- | --- | --- | --- |
| Shared editable demo, hourly restoration | Highest: real create/edit/archive and order transitions | 7–10 days; potentially >10 with expanded scope | Requires scheduler, recovery, quotas, session fencing, moderation and resource monitoring; visitors affect one another | Conditional follow-on when budget and blockers are resolved |
| Isolated read-only Admin Demo | Strong: real UI, search, filters, details and seeded summaries | 3–5 days | Backend denies business mutations; still needs isolated credentials, session limits and abuse monitoring; no recurring business-data reset if writes are truly closed | Best V1 balance |
| README screenshots and recorded walkthrough | Clear evidence of functionality; no visitor interaction | 0.5–1.5 days | No public Admin runtime; renew assets when UI changes; use synthetic data | Fallback and useful companion to read-only |

## 1. Current architecture and reusable components

Evidence paths are relative to the repository root.

| Area | Observed implementation | Reuse and limitation |
| --- | --- | --- |
| API boot | `apps/api/src/main.ts`, `app.module.ts`: NestJS, `/api` prefix, whitelist/transform/forbid-extra-field validation; credentialed CORS to `WEB_ORIGIN`; global throttler | Reuse validation and boot structure. Demo startup validation and policy enforcement are additional work |
| Admin auth | `modules/auth/auth.service.ts`, `auth.controller.ts`, `strategies/admin-jwt.strategy.ts` | bcrypt credentials, cookie JWTs, rotating hashed refresh tokens, persisted `AdminSession`, active-user checks. Reuse primitives, modify demo lifecycle |
| Authorization | `decorators/require-admin.decorator.ts`, `guards/admin-roles.guard.ts` | `RequireAdmin` combines cookie auth and `ADMIN` role guard. Schema only has `AdminRole.ADMIN`; no granular permissions or demo policy |
| Web/API routing | `apps/web/next.config.ts`, `src/lib/api-base-url.ts`, `src/proxy.ts` | Browser production calls use same-origin `/api`, rewritten to `ORDERLY_API_ORIGIN`; server reads use configured API origin. Separate project configuration can reuse this |
| Orders dashboard | `apps/web/src/app/admin/page.tsx`; `modules/orders/orders.service.ts` | `/admin` redirects to `/admin/orders`. Paginated list, search, status/type filters and seven global status counts. No separate Dashboard analytics controller, revenue series or editable settings route found |
| Menu | `modules/menu/admin/{products,categories}`, `apps/web/src/features/admin-menu` | Product/category forms, option groups, price conversion, nested ownership validation, availability, reorder and archive workflows reusable beneath demo controls |
| Order actions | `modules/orders/order-action.ts`, `orders.service.ts` | Existing transitions, idempotent repeat actions and optimistic status matching reusable. Reset fencing must encompass the service work |
| Settings | `prisma/schema.prisma`, `orders.service.ts`, `menu.service.ts` | `StoreSettings` singleton exists and drives ordering. No Admin settings controller/UI found. Editable settings would be new functionality |
| Provider integration | `modules/menu/admin/ai/admin-menu-ai.service.ts`, `modules/customer-auth/registration-mailer.ts`, Google configuration | AI suggestion can call OpenAI; registration mailer has an external delivery integration. These need disabled demo routes and absent provider credentials |
| Deployment | `apps/api/Dockerfile`, `docs/api-docker.md`, README deployment section; web configuration | Existing Linux API runtime and Vercel rewrite reusable. No Railway/Vercel configuration-as-code file found; repository does not prove live service settings |

Components reusable without changing their business behavior: Admin list/detail components, menu forms and mappers, category reorder UI, DTO validation, order pricing/snapshots and action rules, private-response cache policy, catalog data definitions, Prisma models/migrations and proxy identity signing. The full protected request pipeline is **not** reusable unchanged for public editing. Some service transaction boundaries need extension to coordinate reset. Existing auth TTL configuration cannot alone implement a minute-scale absolute demo lifetime.

### Authentication and privacy details

Admin cookies are HttpOnly, Secure in production, SameSite=Lax, host-only (no Domain), path `/api`. The access cookie has no explicit maxAge; its JWT expires independently. Refresh cookie/session expiry is derived from positive integer `JWT_REFRESH_TTL_DAYS`, consistent with `JWT_REFRESH_TTL`. Every refresh updates `expiresAt` to a new deadline. No absolute maximum based on `createdAt`, session count cap or reset epoch exists.

The access strategy checks the session row, expiry and active Admin on every protected request. Deleting sessions therefore invalidates already-issued access JWTs for **subsequent** authorization checks; it does not cancel a request that already passed its guard. Role is checked against the database. Login returns user identity rather than tokens; refresh uses optimistic token-version rotation. These are useful foundations.

Admin login requires JSON. No general Admin mutation Origin/CSRF guard was found; refresh/logout accept bodyless POSTs. CORS controls browser response access, not direct HTTP authorization, and SameSite does not protect all same-site sibling-origin scenarios. Add a narrow demo Admin mutation guard with exact Origin checks and an explicit policy for missing Origin; adapt bodyless refresh/logout to a consistent same-origin request contract. If permitted hosting origins cannot be made unambiguous, use a session-bound CSRF token. Customer Security 2A/2B and Google OAuth implementation must remain unchanged.

Order list/detail responses expose name, phone, email, addresses, notes, user IDs, financial totals and payment status. Receipt capability hash/expiry/revocation fields are explicitly omitted. Synthetic financial values are acceptable; real data is not. There is no tenant/demo predicate on these queries: safety depends on the selected database and credentials.

## 2. Endpoint permission matrix

Inventory covers all existing Admin controllers and Admin auth routes, including the AI assistant. All paths below include the global `/api` prefix. “Safe” means safe **only on an isolated synthetic deployment with proposed session, reset, CSRF and abuse controls**. It does not mean safe to expose in production. Writes are denied in the read-only alternative except essential session lifecycle operations.

| Method | Endpoint | Classification | Demo decision / exposure |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | Restricted write | Creates session; allow only designated demo identity under admission limits, never arbitrary Admin provisioning |
| POST | `/api/auth/refresh` | Restricted write | Rotates credentials; allow only before immutable session/reset deadline |
| POST | `/api/auth/logout` | Restricted write | Allow own session revocation and cookie clearing; cannot trigger restoration |
| GET | `/api/auth/me` | Safe read | Demo identity only; no password hash or JWT secret |
| GET | `/api/orders` | Safe read | Synthetic PII, totals/payment status; pagination/search/status/type filters and global status counts |
| GET | `/api/orders/:id` | Safe read | Synthetic contact/address/notes/items/payment metadata; reject production IDs |
| PATCH | `/api/orders/:id/action` | Safe demo write | Existing ACCEPT, START_PREPARING, MARK_READY, COMPLETE, CANCEL only; no payment action |
| GET | `/api/admin/menu/products` | Safe read | Product list/filter/pagination |
| GET | `/api/admin/menu/products/:productId` | Safe read | Product/options management detail |
| POST | `/api/admin/menu/products` | Safe demo write | Create with bounded totals and nesting |
| PATCH | `/api/admin/menu/products/:productId` | Safe demo write | Edit fields/options; local approved image paths only |
| PATCH | `/api/admin/menu/products/:productId/availability` | Safe demo write | Toggle availability |
| PATCH | `/api/admin/menu/products/:productId/archive` | Safe demo write | Soft archive, not physical deletion |
| GET | `/api/admin/menu/categories` | Safe read | Includes management counts/archive filtering |
| POST | `/api/admin/menu/categories` | Safe demo write | Create with category quota |
| PATCH | `/api/admin/menu/categories/reorder` | Safe demo write | Complete non-archived ID set validation; bounded category total |
| PATCH | `/api/admin/menu/categories/:categoryId` | Safe demo write | Name/description; slug remains stable |
| PATCH | `/api/admin/menu/categories/:categoryId/availability` | Safe demo write | Toggle category visibility |
| PATCH | `/api/admin/menu/categories/:categoryId/archive` | Safe demo write | Soft archive, hides dependent menu offerings |
| PATCH | `/api/admin/menu/categories/:categoryId/restore` | Safe demo write | Restore as inactive; explicit availability toggle afterwards |
| GET | `/api/admin/menu/ai/capability` | Safe read | Availability boolean only; should report unavailable in demo |
| POST | `/api/admin/menu/ai/content-suggestion` | Sensitive or prohibited operation | External paid provider call and submitted content disclosure; deny at backend and omit API key |

Inventory: **22 method/path pairs** (4 auth, 3 orders, 6 products, 7 categories, 2 AI). Product and category “deletion” currently means archive. There is no product hard-delete endpoint or product restore endpoint. Do not add hard deletion for the demo.

### Absent operations and other reachable surfaces

No existing Admin endpoints were found for account creation/deletion, password changes, security/provider settings, bulk exports, database-wide reset, payments/refunds, file uploads, dedicated analytics or operational settings mutation. Their absence is useful, but future routes must default to denied in demo. A reset command must not become a public Admin endpoint.

The same API imports CustomerAuthModule and public Orders/Menu controllers. A demo policy must cover those too:

- Allow `GET /api/menu` and minimal `GET /api/health` if needed; gate menu reads during restoration.
- Deny `POST /api/orders` in the Admin-only demo. Admin order creation is not a current feature; seed actionable orders instead. Leaving public checkout open admits real visitor-entered PII and uncontrolled growth.
- Deny `POST /api/orders/guest/lookup`, `/api/customer/orders` reads, all `/api/customer/account` routes and all `/api/customer/auth` routes, including OAuth callbacks/test-provider routes, registration and email sends. Prefer a demo deployment global deny-by-default guard or demo module composition, without modifying customer security or Google code.
- If settings are later added, classify preparation minutes and acceptance/pickup/delivery toggles as safe demo writes under an explicit field allowlist. Provider/security fields remain prohibited; fee/minimum changes should be excluded from initial demo scope. The stored financial fields are not credentials but deserve clear synthetic labeling.

## 3. Smallest feasible deployment and isolation

Proposed path: `visitor → separate Vercel demo project/origin → same-origin /api rewrite → separate Railway demo API service → demo-only PostgreSQL database`. A Railway Cron service runs a compiled, one-shot reset command against that database. Keep all services and variables in a dedicated demo environment, preferably a separate project to reduce accidental production variable references. No multi-tenancy is needed.

**A separate API process/service is required for the preferred deployment-level policy.** Sharing the production API introduces request-based environment selection, mixed credentials and reset blast radius. That is larger and less safe than deploying the same code twice. Cron is a separate scheduled service if Railway Cron is chosen; an in-process timer is possible but weaker under restarts, sleeping services and multiple instances.

**A separate PostgreSQL server/service is recommended, not logically mandatory.** A distinct logical database on an existing server can reduce idle cost if a dedicated non-superuser role has no CONNECT/schema access to production, grants and ownership are audited, and resource contention is accepted. A separate schema is technically possible but has greater search_path, migration and raw-SQL risk. The raw order-number sequence reference is unqualified. Do not assume a Prisma schema query parameter alone makes every SQL statement safe. Do not use a shared privileged database URL. For a small public V1 demo, dedicated Postgres is the simpler boundary to explain and verify.

| Boundary | Required proposed control | Remaining risk |
| --- | --- | --- |
| Frontend routing | Separate Vercel project; demo-only `ORDERLY_API_ORIGIN` at build/runtime, exact demo `WEB_ORIGIN`; independently managed deployment variables | A wrong origin can route real credentials or writes to production; verify from browser and built rewrite configuration |
| Database | Demo-only `DATABASE_URL` and `DIRECT_DATABASE_URL`, same intended logical database; runtime role limited to demo data, reset role limited to demo reset scope; migration credentials separate | A separate database cannot prevent effects from provider keys or shared services |
| Tokens | Unique demo access/refresh JWT keys; any customer module-required secrets also unique; demo login has no production identity | Existing JWTs have no issuer/audience checks; unique keys and isolated session DB are essential |
| Cookies | Host-only cookies on a distinct frontend hostname; retain Secure/HttpOnly/Lax; never put demo at a path on production hostname | Sibling domains may be same-site; exact Origin checks needed, shared cookie names alone are not an isolation failure on separate hosts |
| Proxy identity | Different `ORDERLY_PROXY_IDENTITY_SECRET` for demo web/API, matched only within demo | Signed identity is for rate limiting, not proof of authorization or a frontend-only firewall |
| Providers | Omit OpenAI, registration mail and Google provider credentials; deny corresponding routes before service invocation; no production storage write credentials | Config cloning is a release blocker; static shared public images are acceptable if read-only |
| Data provenance | Fresh migrations and curated synthetic fixtures; no production dump or copied logs; block customer input routes | Visitors may still put personal/offensive text in menu descriptions; banner, length caps and hourly removal reduce persistence |
| Operational permissions | Demo reset identity cannot reach production DB or cloud management; no infrastructure token in API | Account-wide spending caps or outages can affect other services even with separate data |

The Vercel project can reuse the present rewrite and browser API selection. Full app deployment still includes storefront/customer pages; hiding or routing them away improves clarity, but backend denial is mandatory. Verify any required customer auth startup configuration with dedicated dummy/isolated secrets without enabling providers.

**Can traffic access ordinary records?** Today, queries read whatever `PrismaService` database holds; no special isolation exists. Under the proposed architecture, production tokens fail signature checks, production IDs find no demo record and the runtime role has no production privilege. Prove this with two disposable databases, not production requests. No live conclusion about current credentials or networking is possible from this repository.

No payment gateway invocation, refund execution, or outbound order notification was found in the inspected order service. Payment status is stored metadata. This is not permission to share external keys: review the deployed environment inventory before release.

## 4. Seeding and hourly reset

### Existing infrastructure assessment

- `prisma/seed-demo.ts` is an atomic serializable **empty catalog bootstrap**. It aborts if any category/product exists, optionally creates missing settings, and inserts `createCatalogCategories()`. It neither replaces visitor edits nor seeds orders/Admins. It is not an hourly restoration job and lacks a deployment-specific target identity check.
- `prisma/seed.ts` is destructive, non-atomic across its sequential deletes, creates a legacy `User` Admin rather than `AdminUser`, and has no demonstration orders. `seed-safety.ts` explicitly refuses deployed/production environments and permits only opted-in disposable local targets. Preserve this protection.
- `prisma/seed-admin.ts` creates a missing Admin from environment credentials and leaves existing Admins unchanged. Useful bootstrap pattern, not reset orchestration; raw error logging is unsuitable for sanitized reset logs.
- `test/scripts/seed-browser-test-data.ts`, API e2e fixtures and browser helpers provide synthetic forms/options/order examples. Their local test-target safeguards and destructive cleanup are intentional. Reuse fixture ideas/data builders, not deployed test reset commands.
- API Docker runtime contains compiled API, Prisma schema/migrations and production dependencies; it does not copy seed source/catalog TypeScript. `tsx` is a dev dependency. Existing runtime cannot simply execute `pnpm seed:demo` as a Cron start command. Compile and package a dedicated reset entry point in a later implementation.

### Proposed reset protocol

Use a dedicated demo-only control row/table (for example `DemoEnvironmentState`) storing an environment identity, fixture version, generation, state, last successful reset and next reset deadline. This is **proposed schema work**, not performed in this audit. A demo-only SQL table is an alternative to a Prisma model, but still a database schema change. Reusing `StoreSettings` fields or an in-memory boolean for lifecycle metadata is not sufficient. Existing `AdminSession.createdAt` supports absolute lifetime without a session model change.

1. Validate deployment mode plus expected DB/server/database identity, non-production role and an out-of-band configured demo identity. Require both Prisma connection targets to resolve to the intended demo database. Never depend on a database name containing “demo” alone. Reset credentials must themselves lack production access.
2. Serialize reset jobs with a PostgreSQL advisory lock held on a dedicated connection. Use a bounded lock/statement/job timeout; duplicate jobs skip with a sanitized result. Connection release on crash releases ownership, but must not automatically reopen the environment.
3. Persist `RESETTING` before destructive work, closing admission and guarded reads/writes. Every demo request must check durable readiness and overdue deadline; missing state/database errors fail closed. Auth login and refresh participate, not only menu/order writes.
4. Coordinate in-flight work with the same database fencing mechanism. One workable design is a shared advisory transaction lock for each admitted request's relevant database operations, and an exclusive lock for reset. After obtaining the shared lock, recheck durable state/deadline and authenticate the session in that transaction; then execute the service work under that fence. The reset exclusive lock drains prior operations. A guard that checks a boolean and then releases its DB connection leaves a race and is inadequate. Multi-query reads should also be fenced to avoid mixing pre/post-reset summaries.
5. In one bounded transaction, revoke all demo Admin sessions; delete visitor business rows in FK order; restore fixtures/settings; verify baseline totals; advance generation; record `READY`, successful completion and next deadline atomically. No requests are admitted until the committed baseline is ready. A failed transaction rolls back business changes while the separately committed RESETTING state keeps the API closed.
6. On process death or transaction failure, leave the environment closed. A new worker acquires exclusive ownership, revalidates target and reruns the idempotent replacement. On API restart, read durable state and never infer readiness from “no reset process running.” Recovery must not clear RESETTING merely because a lease/time elapsed.
7. Emit only run ID, generation, fixture version, counts, duration, status and sanitized error code. Never log DB URLs, tokens, provider output, visitor notes or customer contacts. Alert on failure, stale success deadline or unexpectedly long execution.

The fencing design implies targeted transaction refactoring: existing menu mutations sometimes perform reads outside their write transaction; order actions perform a read followed by a conditional update. An interceptor alone cannot make those operations one Prisma transaction without threading a transaction client through the work. This is a major part of the estimate.

### Fixture and FK plan

Keep one predefined demo `AdminUser`, clear its sessions and prevent creation of other Admins. Leave customer/account tables empty and inaccessible; assert emptiness on verification rather than silently tolerating imported accounts. Explicit reset table allowlist: `AdminSession`, `OrderItemOption`, `OrderItem`, `Order`, `ProductOption`, `ProductOptionGroup`, `Product`, `Category`, `StoreSettings`. Any permitted additional state must be accounted for explicitly.

Delete order item options → items → orders; product options → groups → products → categories; restore settings singleton. Order children cascade; product/option links in historical items use SetNull; category reference uses Restrict. Do not issue unscoped `TRUNCATE ... CASCADE`, drop schemas or restore entire infrastructure backups. Preserve migration metadata and lifecycle control state.

Seed fixed IDs, slugs, prices, option relationships, item snapshots and order numbers. Include pickup/delivery, all six statuses, actionable PENDING/ACCEPTED/PREPARING/READY orders, cancelled/completed examples and varied synthetic notes. Use `.invalid` email addresses and clearly fictitious contacts/addresses; avoid plausible personal records. Define exact item arithmetic and status-count expectations. The current dashboard has no date/revenue aggregation; fixed timestamps suffice. If future date analytics are added, anchor relative timestamps to a recorded reset time with deterministic offsets.

`Order_orderNumber_seq` exists through the atomic-number migration and is used by checkout. Prefer leaving its value monotonic and choosing fixed noncolliding fixture numbers; do not use `setval` assuming it rolls back with the reset. If creation is later enabled, prove allocation exceeds fixture numbers and all sequence operations are correctly scoped. Stable IDs require session/epoch fencing so an old queued mutation cannot update a freshly restored fixture with the same ID.

## 5. Session and scheduler lifecycle

Proposed absolute demo session lifetime: **30 minutes**, independent of the approximate 60-minute shared reset. At admission compute `min(createdAt + 30 minutes, current generation's nextResetAt)`. Refresh must never extend past that deadline; access JWT expiry and cookie maxAge must be clipped to it. Existing whole-day refresh configuration needs a demo-specific duration path. Reject login/refresh while overdue or resetting.

After reset, deleting all sessions means the existing JWT strategy can reject old tokens even before token expiry. Pair that with transaction-time revalidation/generation checks to close authorization races. Logout revokes only that visitor session. A public “Enter Demo” could create distinct bounded sessions for a fixed demo Admin without revealing a password; a displayed demo-only login is simpler but its credential must be treated as public, not a security boundary. Admission limits apply to both. No registration route is needed.

Add server-provided `sessionExpiresAt`, generation/state and next reset time. Show persistent “shared synthetic demo” and “changes are cleared” messaging, warn approximately five minutes before restoration, and show a maintenance state during it. Logout on expiry using a browser timer plus foreground/focus revalidation; the server remains authoritative when timers are suspended. Clear cached Admin data and unsaved mutation queues on generation/session change. Do not transparently obtain a new demo session and replay an expired write. After restoration, invite explicit re-entry and fetch fresh data. Existing `api-fetch.ts` refreshes and retries a 401 once; demo handling must preserve the old session boundary and deal separately with maintenance/503 responses.

Railway Cron is a suitable low-cost scheduler: configure an hourly UTC expression such as `0 * * * *`, run a short reset command and close all connections. Railway permits schedules at least five minutes apart, does not guarantee minute-exact execution, and skips a scheduled run if the previous execution remains active; it does not terminate the earlier job automatically. [Railway Cron documentation](https://docs.railway.com/cron-jobs).

Hourly restoration is shared-environment scheduling, not “60 minutes after each visitor enters.” Use a next-reset deadline tied to the UTC schedule, with a documented small launch-delay tolerance (for example five minutes). If it passes without successful restoration, API admission/writes fail closed and a health signal alerts the operator. A small independently scheduled watchdog or platform alert is preferable; request-time overdue checks still protect the environment if traffic is absent. Bound worker runtime, rollback timed-out work and exit nonzero; if Railway still shows an active job, operator intervention may be required before scheduling resumes. An in-API scheduler saves one service but requires restart catch-up and lock-safe ownership and is less operationally robust.

## 6. Abuse and direct HTTP security

Existing global limit is 100 requests/minute per tracker; Admin login is 5/minute; AI suggestion is 5/minute. Signed Vercel client identity prevents trusting arbitrary forwarded IPs; direct API traffic falls back to socket peer identity, which may group clients behind platform proxies. No distributed throttler storage is configured, so limits are process-local and reset on restart. This supports a single small demo instance but is not a global resource budget.

Existing controls include strict DTO fields, page size ≤100 for orders/products, bounded product strings, up to 20 option groups and 50 options per group, local image path validation, nested option ownership checks and optimistic order actions. No multipart/upload route exists. Large permitted nesting can still create hundreds of rows in one request; soft archives also retain storage until reset. Order search has no explicit MaxLength and contains searches plus seven summary count queries execute per list response; large offsets, pollers and multiple visitors can be costly.

Proposed initial limits to tune against measurements, not existing guarantees:

| Risk | Narrow proposed control |
| --- | --- |
| Admission/session spam | 10 concurrent active sessions globally, 2 per client admission window; transactional global admission count to prevent races; remove expired sessions; do not count all visitors as one because they share an Admin |
| Menu/database growth | Total cap of 100 products including archived, 20 categories, and 2,000 option rows; lower per-request nesting in demo (e.g. 5 groups ×10 options); enforce counts and insert atomically under a quota lock |
| Repeated mutations | Per-session mutation limit (e.g. 10/minute), IP admission limit and total demo write budget; archive/action quotas; fail with 429 and Retry-After |
| Query load | Demo page size ≤50, bounded search length/offset, moderate UI polling; global/session request budget; measure query plans and latency before adding indexes |
| Payload size | Explicit demo JSON body limit (e.g. 64 KiB), reject multipart and remote image URLs; test boundary responses. Nest/Express defaults are not a documented demo quota |
| Provider spend / PII | Deny AI, checkout, customer auth/account and notifications; absent provider keys; seeded orders only |
| Direct API requests | Apply policy, auth, CSRF contract and quotas in NestJS regardless of frontend; CORS and hidden buttons cannot enforce permissions |
| DoS / shared compute | One API replica initially, bounded DB pool/request timeouts, resource/spend alerts; reject stale/reset state; consider stronger edge controls only if measured abuse requires them |
| Public credentials | Dedicated demo identity and keys, no privileged operator endpoint accessible by that identity; password secrecy is not assumed |

No extensive new role/security framework or Redis service is required initially. A backend deployment-mode allowlist plus current `ADMIN` authentication is sufficient **only because the complete deployment/database contains demo data** and sensitive routes default to denied. A `DEMO_ADMIN` enum alone would neither isolate data nor solve races. Use a true permission model if real Admins and demo visitors ever share a backend; that is outside the recommended V1 architecture.

## 7. Railway Hobby cost and operations

Current pricing was checked on 13 October 2026. Amounts below are USD before tax/conversion. Railway Hobby has a $5 monthly minimum with $5 included resource usage across the account, not per service. There is no separate included $5 for a demo API/database. [Railway billing explanation](https://docs.railway.com/pricing/understanding-your-bill).

Published container rates are RAM $10/GB-month, CPU $20/vCPU-month, egress $0.05/GB and volume $0.15/GB-month. Builds are currently free. Hobby's documented volume limit is 5 GB; advertised RAM/CPU maxima are far above this demo's intended size and include replica multiplication. These ceilings are not free allocations. [Railway plan/resource rates](https://docs.railway.com/pricing/plans).

Let existing monthly usage be U and added demo usage D. Incremental bill on an existing standard Hobby account is `max(5, U + D) − max(5, U)`. For example, U=$3 and D=$4 gives $2 more billed; U=$8 and D=$4 gives $4 more billed. A separately subscribed account adds its own minimum. Special credits/waivers are not assumed.

| Component | Incremental usage estimate method | Repository-supported conclusion |
| --- | --- | --- |
| Always-on demo API | Average RAM GB × $10 + average CPU cores × $20 per month | Separate process adds idle memory and burst CPU; actual RSS/CPU unknown |
| Dedicated PostgreSQL service | Same compute formula plus volume and traffic | Adds independent idle compute; logical DB on existing server saves that baseline but adds contention and storage |
| Reset Cron | Runtime minutes × memory/CPU per-minute rates, plus any egress | Roughly 720–744 runs/month if hourly; close connections and exit to avoid continuous usage |
| Storage | Stored GB-month × $0.15; include indexes/WAL/bloat and provider allocation rules | Small fixed fixtures likely modest; hourly deletes do not guarantee disk shrink. Autovacuum/volume growth must be observed |
| Traffic | Railway public egress GB × $0.05; use private API↔DB networking where available | Actual visits, response sizes and image traffic unknown |
| Logs | Confirm retention/export charges and bound logged volume | No invoice or log product configuration available; do not assume a free external log sink |
| Vercel demo project | Account/project limits and measured frontend/proxy usage | Existing project count, limits, remaining allowances and paid plan unknown |

Illustrative calculation, **not a forecast or measured footprint**: if API averages 0.25 GB/0.02 core, Postgres 0.25 GB/0.02 core, volume 1 GB and egress 1 GB/month, added usage is approximately $6.00/month before Cron or external logs. A worker averaging 0.25 GB/0.1 core for one minute per hourly run costs about $0.08/month using published per-minute rates. If combined API/database RAM is instead 1 GB with combined average CPU 0.1 core, the same storage/egress yields approximately $12.20 plus Cron. Memory assumptions dominate; these examples are scenarios, not a promised $6–12 deployment budget. Shared logical database removes dedicated Postgres baseline but may raise existing service usage.

Vercel Hobby is for personal, non-commercial use; assess eligibility for this portfolio deployment and remaining account limits. A second project is not automatically a paid upgrade, nor does it receive independent unlimited free usage. [Vercel Hobby plan](https://vercel.com/docs/plans/hobby), [Vercel limits](https://vercel.com/docs/limits).

Before release, obtain current Railway bill/U, service RAM/CPU and connection baselines, database host/provider and grants, volume occupancy/bloat, expected visits/concurrency, bandwidth, current Vercel plan/allowances, restart/sleep settings and a chosen spend ceiling. Run a synthetic pilot/load sample on isolated infrastructure to estimate D. Repository README says migrations run before API activation, but Docker CMD itself only starts Node; confirm actual Railway pre-deploy settings and make them target demo only. None of this was changed during the audit.

## 8. Implementation work breakdown

| Work | Likely files/modules | Engineering days |
| --- | --- | --- |
| Demo mode, startup target validation, backend route policy and Admin mutation checks | `app.module.ts`, `main.ts`, new demo module/guards; auth wiring; route contract tests | 1.0–1.5 |
| Absolute session expiry and admission quotas | `auth.service.ts`, JWT strategy, auth DTO/types/controller, new demo admission helper | 0.75–1.0 |
| Durable lifecycle, deterministic fixtures, reset command and service fencing | Proposed Prisma lifecycle model/SQL and later migration; reset runner; catalog builders; menu/order transaction-client plumbing | 2.0–2.5 |
| Demo UI entry, reset warnings, logout/cache behavior and quotas | Auth bootstrap/store/API wrapper, protected Admin layout, menu/order mutations; backend quota helpers | 0.75–1.0 |
| Automated isolation/reset/concurrency and browser acceptance | API e2e/support fixtures; Jest unit tests; existing Playwright Admin workflows | 1.5–2.0 |
| Separate project/services, worker packaging, budget validation and runbook | Dockerfile/build scripts, env examples/deployment documentation; Vercel/Railway manual configuration | 1.0–1.5 |
| **Total** | Existing menu/order scope | **7.0–9.5; plan 7–10 days (B)** |

This includes engineering validation and deployment setup, not reviewer waiting time or provider outages. A new settings API/UI with field authorization adds roughly 1–2 days; new analytics is separate scope (roughly 2–4 days depending on requirements). Those additions plus the editable baseline can exceed 10 days, class C. Estimates assume one engineer familiar with this repository and one API replica.

Database: no tenancy change required. Existing business schema can be reused; recommended durable lifecycle metadata needs a small later schema change, which is deliberately not performed here. Existing migrations must be applied to a fresh demo target only during an authorized implementation. If future implementation also forbids any schema additions, redesign durable state storage and revise the estimate before proceeding.

Infrastructure: separate Vercel project, API service, preferably PostgreSQL service/volume, short-lived Cron service, separate secret set and minimal alerting. Maintenance: review failures/costs, update fixtures and allowlist with releases, verify reset after migrations and exercise recovery periodically. Expect approximately 1–2 hours/month after stabilization, plus incident time; this is a planning allowance, not measured operations.

## 9. Focused automated test design

Reuse `apps/api/test/auth.e2e-spec.ts`, `admin-menu.e2e-spec.ts`, `admin-orders.e2e-spec.ts`, `proxy-identity.e2e-spec.ts`, local target safeguards, and `apps/web/test/browser/critical-workflow.spec.ts` and Admin semantics tests. New reset tests must run only on newly created disposable targets validated by existing safety patterns. Do not repoint current reset commands at Railway, staging or production.

| Test area | Assertions |
| --- | --- |
| Auth/admission | Demo identity succeeds; ordinary Admin/production-signed token fails; per-session and global caps hold under simultaneous login; identity/hash/token fields never leak |
| Endpoint restrictions | Enumerate all 22 method/path pairs; only intended capabilities allowed; AI and all customer/checkout/provider routes denied via raw HTTP; unknown/new routes fail closed; read-only mode rejects every business mutation |
| Menu CRUD | Create/edit/options/availability/reorder/archive/category restore; DTO/ownership validation; quota rollback; archives count toward storage quota; no invented hard-delete semantics |
| Order actions | Valid transitions and repeat idempotency; invalid transitions fail; simultaneous action conflict; synthetic contact/detail exposure only; payment metadata cannot be mutated |
| Data isolation | Two disposable databases with different sentinels and roles; demo request/reset cannot read/write ordinary sentinel; DB role denies ordinary access; both URL targets and raw sequence access validated |
| Absolute expiry | Controlled server clock; refresh near 30 minutes clips expiry; repeated refresh cannot extend it; tokens at reset deadline invalid; expired browser timer and foreground revalidation work |
| Concurrent visitors | Distinct sessions share edits intentionally; quotas atomic; shared credential cannot revoke all sessions; idle visitors do not pin reset |
| Active-request reset | Pause a service between auth/read/write; reset drains or rejects it; no mutation lands on new generation; login/refresh races fenced; summaries/list cannot mix generations |
| Interrupted reset | Kill worker after RESETTING and at delete/insert/commit boundaries; rollback/closed state survives API restart; recovery restores exact baseline; duplicate workers do not overlap; timeout leaves safe state |
| Scheduler failure | Missed/late/stuck job closes admission after tolerance, raises sanitized health/alert; failed recovery does not reopen; successful retry records next deadline |
| Dashboard baseline | Exact all-status counts, page totals, item snapshots/prices, settings and foreign keys after repeated resets; visitor-created and archived rows gone |
| Cookie/CORS/CSRF | HTTPS same-origin proxy sets host-only Secure cookies; distinct demo/ordinary hosts do not share sessions; wrong Origin and sibling-origin mutations denied; preflight policy correct; spoofed identity headers fail |
| Abuse | Payload/nesting/row/search/page bounds; direct API quotas; process restart behavior documented; provider spy confirms zero external calls |
| Browser/accessibility | Keyboard forms/dialog focus, search/filter/detail/mobile, readable demo/expiry warnings and live maintenance feedback; stale caches cleared; no expired mutation replay; main Customer flows regressions unchanged |

No application tests were run for this documentation-only audit; the table is an implementation acceptance design, not passing test evidence. No destructive database validation was attempted.

### Manual acceptance checklist

- [ ] Confirm fresh synthetic provenance, dedicated database grants, both DB URLs and independent JWT/proxy/customer-required secrets.
- [ ] Confirm deployed demo rewrite/API origin, exact CORS origin, cookie host/path/flags and no production credentials/provider/storage write tokens.
- [ ] Enter demo in two browsers; navigate orders/menu, search/filter, inspect synthetic details, create/edit/archive products, reorder/archive/restore categories and perform allowed order actions.
- [ ] Confirm visitors see each other's changes and understand the shared environment; no claim of private visitor data.
- [ ] Use direct HTTP to attempt checkout, AI, customer registration/account/OAuth, unlisted routes and forbidden fields; backend rejects them and no provider request occurs.
- [ ] Wait through absolute expiry and hourly restoration; warnings are usable, caches clear, old session/queued writes fail and re-entry loads the fixture baseline.
- [ ] In disposable demo infrastructure only, interrupt reset and disable a scheduled run; environment stays closed, alert appears, documented recovery restores it.
- [ ] Verify no ordinary database access using disposable sentinels/roles; never perform production reset or write probes.
- [ ] Measure idle and representative concurrent load, query latency, row/volume growth and projected bill; confirm spend and resource limits.
- [ ] Check keyboard/mobile/accessibility and refresh/logout across tabs; verify no data/URL/token leakage in logs.
- [ ] Review future route default-deny behavior, deployment migration target and operator recovery/runbook ownership.

## 10. Release blockers and final decision

Editable release remains blocked until:

1. Demo API/database/frontend separation and independent secret/provider inventory are evidenced; production access is denied by credentials as well as configuration.
2. Backend default-deny policy covers Admin, public checkout and customer/provider routes; narrow CSRF protection and payload/quota controls are verified.
3. Immutable session deadline, reset invalidation and transaction-time fencing prevent old requests from mutating restored records.
4. Durable reset state, packaged worker, deterministic order fixtures and interruption/overlap recovery pass on disposable infrastructure.
5. Missed/stuck scheduler monitoring, bounded jobs and fail-closed overdue behavior exist with a recovery owner.
6. Measured Hobby usage, Vercel eligibility/limits and an agreed spend ceiling show the additional deployment is affordable.
7. Browser/automated acceptance passes and customer security/Google behavior remains unchanged.

**Verdict: CONDITIONAL GO — technically feasible with bounded scope, but not ready to expose safely today. Best V1 option: isolated read-only Admin Demo plus recorded editable walkthrough.** Screenshots/walkthrough alone are the fallback when the additional hosting or 3–5-day read-only effort is not justified. Keep new analytics and operational settings outside initial scope. Stop at this report; no implementation approval is requested and no Packaging is begun.
