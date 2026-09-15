# Orderly

A production-grade full-stack ordering platform built with Next.js, NestJS, PostgreSQL, Prisma and Docker.

Orderly demonstrates a complete customer-to-admin lifecycle: menu customisation, guest checkout, authenticated order management, status progression and customer tracking. Server-authoritative business rules protect pricing and order integrity, while rotating HttpOnly-cookie sessions secure admin workflows. Deterministic integration tests run against isolated PostgreSQL, and Playwright verifies the critical journey in a real browser.

## Live Deployment

- Web: https://orderly-web-gamma.vercel.app
- API health: https://orderly-production-1ac4.up.railway.app/api/health
- API menu: https://orderly-production-1ac4.up.railway.app/api/menu

The public web application is deployed on Vercel. Browser-facing `/api/*` requests stay same-origin and are rewritten by Vercel to the Railway-hosted NestJS API.

## Tech Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS

- Server State: TanStack Query

- Client State: Redux Toolkit

- Forms: React Hook Form

- Backend: NestJS, TypeScript

- Database: PostgreSQL, Prisma

- AI: OpenAI Responses API with Structured Outputs

- Testing: Jest, React Testing Library, Supertest, Playwright

- CI/CD: GitHub Actions

- Deployment: Vercel, Railway, Neon

- Tooling: pnpm workspace, Docker Compose, Docker/BuildKit

## Features

### Customer Ordering

- Responsive menu with API-driven products and categories

- Product customisation with sizes, modifiers and add-ons

- Redux Toolkit cart with localStorage persistence

- Cart drawer, mobile cart bar and order summary

- Guest checkout with pickup/delivery, customer details, address and notes

- Order submission and success page

### Admin Orders

- Protected admin orders dashboard

- Server-side public order-number search, status/type filters and pagination

- Consistent customer-facing order numbers across checkout, admin and tracking

- Order summary metrics, list and detail panel

- Loading, empty, error and refresh states

- Action-based order workflow:

```txt

PENDING → ACCEPTED → PREPARING → READY → COMPLETED

```

- Backend-enforced lifecycle rules and idempotent repeated actions

### Admin Authentication

- Dedicated `AdminUser` and `AdminSession` models

- Email/password admin login

- HttpOnly access and refresh cookies

- Refresh token rotation with server-side session revocation

- Protected admin routes and API guards

- Session-expired handling and sign-out flow

- Login rate limiting

- Unit and E2E tests for auth and route boundaries

### Guest Order Tracking

- Public guest order tracking by order number + email or phone

- Secure lookup flow that prevents order details being exposed by order number alone

- Customer-facing order progress timeline

- Pickup / delivery details and order summary

- Manual refresh and lightweight auto-refresh for status updates

### Admin Menu Management

- Protected category and product management

- Category create, edit, activate/deactivate and archive workflows

- Complete-order drag-and-drop category reordering

- Product search, category filtering, availability filtering and pagination

- Product create and edit routes

- Nested product option-group editor using React Hook Form

- Support for `SIZE`, `MODIFIER` and `ADD_ON` option groups

- Support for `SINGLE` and `MULTIPLE` selection rules

- Required, minimum and maximum selection constraints

- Option availability and default-selection controls

- Drag-and-drop ordering for option groups and options

- Product availability quick actions

- Product archive workflow with confirmation

- TanStack Query caching and targeted cache invalidation

- Loading, empty, error and mutation feedback states

### AI Menu Content Assistant

- AI-assisted product description generation and improvement in the admin product editor

- OpenAI Structured Outputs with strict response-schema validation

- Human review with explicit Apply / Discard / Regenerate workflow before persistence

- AI suggestions update form state only and never write directly to the database

- Product-context snapshotting prevents stale suggestions from being applied to changed form data

- Authenticated and rate-limited admin endpoint

- Bounded provider output with application-side content validation

- Sanitized handling for provider, timeout and missing-configuration failures

- Optional deployment feature controlled independently from the OpenAI API credential

## API

### Public

```txt

GET    /api/health

GET    /api/menu

POST   /api/orders

POST   /api/auth/login

POST   /api/auth/refresh

POST   /api/auth/logout

```

### Admin Orders

```txt

GET    /api/auth/me

GET    /api/orders

GET    /api/orders/:id

PATCH  /api/orders/:id/action

```

Example order action request:

```json

{

  "action": "ACCEPT"

}

```

Supported actions:

```txt

ACCEPT

START_PREPARING

MARK_READY

COMPLETE

CANCEL

```

### Admin Menu

```txt

GET    /api/admin/menu/categories

POST   /api/admin/menu/categories

PATCH  /api/admin/menu/categories/:id

DELETE /api/admin/menu/categories/:id

PATCH  /api/admin/menu/categories/reorder

GET    /api/admin/menu/products

GET    /api/admin/menu/products/:id

POST   /api/admin/menu/products

PUT    /api/admin/menu/products/:id

PATCH  /api/admin/menu/products/:id/availability

DELETE /api/admin/menu/products/:id

POST   /api/admin/menu/ai/content-suggestion

```

Category reorder requests submit the complete category order:

```json

{

  "categoryIds": ["category-uuid-1", "category-uuid-2", "category-uuid-3"]

}

```

Product create/update requests can include nested option groups and options. Their array order defines customer-facing display order.

AI-generated content is returned as a draft suggestion only. Persistence continues through the existing product create/update APIs after explicit admin approval.

## Architecture

```txt
Browser
  ↓ HTTPS
Vercel
  Next.js frontend
  ├─ pages / assets
  ├─ browser /api/* rewrite ───────────────┐
  └─ SSR absolute API requests             │
                                           ↓
                                  Railway (Singapore)
                                  NestJS Docker API
                                           ↓ Prisma
                                  Neon PostgreSQL
                                  (Singapore)
```

Browser API calls use the Vercel origin (`/api/*`) and are rewritten server-side to Railway. This keeps the browser-facing authentication flow same-origin while preserving the existing HttpOnly-cookie session model.

Prisma uses separate production connection roles:

```txt
DATABASE_URL
  └─ Neon pooled connection for application runtime

DIRECT_DATABASE_URL
  └─ Neon direct connection for migrations
```

Frontend state is split by responsibility:

```txt

Redux Toolkit

  └─ client-owned cart state

TanStack Query

  └─ server-owned admin data

React Hook Form

  └─ complex product editor state

```

The AI content workflow is isolated from product persistence:

```txt

Admin Product Form

  ↓

AI Suggestion Endpoint

  ↓

OpenAI Structured Output

  ↓

Validated Draft Suggestion

  ↓

Admin Apply / Discard

  ↓

Existing Product Create / Update API

```

Admin authentication uses rotating, server-backed sessions:

```txt

Admin Login

  → Access + Refresh HttpOnly Cookies

  → AdminSession

  → Refresh Rotation

  → Replay Detection / Session Revocation

```

## Testing & Quality

Testing is layered around production-critical behavior rather than coverage targets:

- **API:** Jest unit/service tests plus Supertest integration tests against real, isolated PostgreSQL cover checkout rules, server-authoritative validation, authentication, refresh rotation, replay detection, session revocation, and admin order/menu workflows.

- **Frontend:** Jest and React Testing Library protect authenticated refresh single-flight behavior, AI suggestion stale-context handling, checkout payload mapping and persisted-cart sanitation.

- **Browser:** Playwright verifies customer checkout → admin acceptance → guest tracking, protected-route redirects, mobile responsiveness, semantic keyboard-accessible interactions and unexpected browser error detection.

Database-backed tests use guarded `orderly_test` resets with real migrations. Safety checks prevent them from resetting the normal development database.

## CI/CD

GitHub Actions runs the production quality gate on pull requests and the production branch:

```txt
Checkout
  ↓
Node 22 + pnpm
  ↓
Install dependencies
  ↓
Prisma Client generation
  ↓
Lint
  ↓
Typecheck
  ↓
Jest / Supertest / React Testing Library
  ↓
Playwright Chromium
  ↓
Production build
```

The browser suite starts an isolated Docker PostgreSQL database, applies the real Prisma migrations, seeds deterministic browser fixtures, and verifies the critical customer → admin → guest-tracking workflow.

Railway is configured to wait for a successful CI check before deployment. API deployments build from `apps/api/Dockerfile`, then run the production migration gate before the new container becomes active:

```txt
Git push / pull request
  ↓
GitHub Actions CI
  ↓ success
Railway Docker build
  ↓
Pre-deploy: npx prisma migrate deploy
  ↓ success
NestJS deployment becomes active
```

Vercel deploys the Next.js frontend from Git and injects frontend configuration at build time.

## Deployment

Production is intentionally split across three managed services:

| Layer | Platform | Notes |
| --- | --- | --- |
| Frontend | Vercel | Next.js deployment, HTTPS, same-origin `/api/*` rewrite |
| API | Railway | Dockerized NestJS service in Southeast Asia / Singapore |
| Database | Neon | Serverless PostgreSQL in Singapore |

### Production API configuration

Railway owns backend-only configuration and secrets, including:

```env
DATABASE_URL=
DIRECT_DATABASE_URL=
WEB_ORIGIN=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
JWT_REFRESH_TTL_DAYS=7
ADMIN_SEED_EMAIL=
ADMIN_SEED_PASSWORD=
OPENAI_API_KEY=
```

`DATABASE_URL` uses the Neon pooled endpoint for runtime traffic. `DIRECT_DATABASE_URL` uses the Neon direct endpoint for Prisma migrations.

### Production frontend configuration

Vercel only needs browser/frontend configuration:

```env
NEXT_PUBLIC_API_BASE_URL=/api
NEXT_PUBLIC_AI_ASSISTANT_ENABLED=true
```

Backend secrets are intentionally kept out of the Vercel frontend project.

### Database initialization

Schema migrations run automatically through Railway's pre-deploy command:

```bash
npx prisma migrate deploy
```

Production seed data is explicit and separate from deployment:

```bash
railway run --service Orderly pnpm --filter api seed:admin
railway run --service Orderly pnpm --filter api seed:demo
```

`seed:admin` creates the initial `AdminUser` only when it does not already exist. `seed:demo` is non-destructive: it refuses to run when menu data already exists and creates demo menu data inside a serializable transaction. The destructive development seed is never used against production.

## Project Structure

```txt

orderly/

  apps/

    web/      # Next.js frontend

    api/      # NestJS backend

  packages/

    shared/   # Shared types and schemas

```

## Local Development

Start PostgreSQL:

```bash

pnpm db:up

```

### API tests

Fast API unit tests do not require PostgreSQL:

```bash

pnpm --filter api test:unit

```

Database-backed API E2E tests use the separate `orderly_test` database. Set

`TEST_DATABASE_URL` to the value shown in `.env.example`, then run:

```bash

pnpm --filter api test:db:prepare

pnpm --filter api test:e2e

```

`test:e2e` safely resets `orderly_test` and applies the real Prisma migrations

before running. It refuses missing URLs, the development URL, and database names

other than `orderly_test`. The normal development database is never reset.

### Frontend and browser tests

Frontend Jest tests cover authentication refresh behavior, the AI description

assistant, checkout mapping and persisted-cart sanitation:

```bash

pnpm test:web

```

The Playwright Chromium suite covers the critical customer checkout, admin order

acceptance and guest tracking journey, plus protected-route and mobile smokes:

```bash

pnpm exec playwright install chromium

pnpm test:browser

```

Start Docker PostgreSQL first with `pnpm db:up`. The browser command safely resets

and seeds only `orderly_test`, then manages its own API and web development servers.

It uses `TEST_DATABASE_URL` when provided, otherwise the documented local Docker

test URL. It never uses the development seed or resets `orderly_db`.

For a complete local Stage 10 pass after installing Chromium:

```bash

pnpm test:quality

```

Run migrations and seed menu data:

```bash

pnpm db:migrate

pnpm db:seed

```

Configure `apps/api/.env` with:

```env

DATABASE_URL=

DIRECT_DATABASE_URL=

WEB_ORIGIN=http://localhost:3000

JWT_ACCESS_SECRET=

JWT_REFRESH_SECRET=

JWT_ACCESS_TTL=15m

JWT_REFRESH_TTL=7d

JWT_REFRESH_TTL_DAYS=7

ADMIN_SEED_EMAIL=

ADMIN_SEED_PASSWORD=

OPENAI_API_KEY=

```

Enable the optional AI assistant in the frontend environment:

```env

NEXT_PUBLIC_AI_ASSISTANT_ENABLED=true

```

The AI assistant can remain disabled in deployments that do not provision an OpenAI API credential.

Create the initial admin account:

```bash

pnpm --filter api run seed:admin

```

Start the API and frontend in separate terminals:

```bash

pnpm dev:api

pnpm dev:web

```

Frontend:

```txt

http://localhost:3000

```

Backend:

```txt

http://localhost:4000/api

```

Admin login:

```txt

http://localhost:3000/admin/login

```

## Key Engineering Decisions

- Separate Next.js frontend and NestJS REST API.

- Feature-based frontend modules for menu, cart, checkout, admin orders, authentication and admin menu management.

- Redux Toolkit manages client-owned cart state while TanStack Query manages server-owned admin state.

- React Hook Form manages complex nested product-editor state.

- HttpOnly cookies keep access and refresh tokens unavailable to browser JavaScript.

- Refresh token rotation and database-backed sessions support logout and session revocation.

- Nest guards enforce admin access at the API boundary.

- Backend price recalculation and order snapshots preserve historical order accuracy.

- Server-side admin search, filtering and pagination avoid loading complete datasets into the browser.

- Action-based order APIs express business intent while the backend controls valid order transitions.

- Category reordering submits a complete ordered ID list so ordering is validated and persisted atomically by the backend.

- Product option-group and option order is represented by array order at the API boundary rather than exposing persistence-specific sort values to the frontend.

- Archived categories and products use domain-level archive workflows instead of destructive UI deletion.

- Product availability is modelled separately from archival state.

- Frontend validation improves editing UX while NestJS DTO and service validation remain the source of truth for domain integrity.

- AI-generated menu content is treated as untrusted draft output: responses use strict structured-output validation, require explicit human approval, and never persist directly from the AI endpoint.

- External AI provider failures are isolated from core menu-management workflows so product editing and persistence remain available when AI generation is unavailable.

- The AI assistant is an optional deployment capability controlled independently from server-side provider credentials, allowing public deployments to omit paid AI access without changing the underlying implementation.

- Reusable UI primitives and CSS design tokens keep admin and customer interfaces visually consistent.

- Production browser API calls use a same-origin Vercel `/api/*` rewrite to Railway so HttpOnly authentication cookies do not depend on cross-site browser cookie behavior.

- Runtime database traffic uses Neon pooling while Prisma migrations use a separate direct connection.

- Railway runs `prisma migrate deploy` as a pre-deploy gate so schema changes complete before a new API deployment becomes active.

- GitHub Actions gates deployment with linting, typechecking, database-backed tests, Playwright and production builds.

- Production seed commands are explicit and non-destructive; the destructive local development seed is isolated from production initialization.

- Docker Compose provides reproducible local PostgreSQL setup.

- Tests prioritize business and security invariants instead of coverage percentage.

- Database integration tests use isolated PostgreSQL with real migrations and destructive-operation guards.

- Playwright protects one critical full-stack workflow instead of duplicating every backend rule in browser tests.

## Project Status

Core application development and Stage 10 testing/quality work are complete. Remaining work is focused on delivery and presentation:

- CI pipeline

- Deployment

- Architecture diagrams and screenshots

- Portfolio and interview packaging

## Next Steps

- Add CI for lint, typechecking, tests and production builds

- Deploy the frontend, API and PostgreSQL-backed environment

- Produce architecture diagrams and portfolio screenshots

- Package the project’s technical decisions and tradeoffs for portfolio and interview use