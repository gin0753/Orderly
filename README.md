# Orderly

A production-grade online ordering platform built with Next.js, NestJS, PostgreSQL, Prisma and Docker.

Orderly demonstrates a complete customer ordering flow and an authenticated admin order-management workflow, including cart state, checkout, relational order modelling, protected admin APIs, server-side filtering, pagination, and order lifecycle rules.

## Tech Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS
- State Management: Redux Toolkit
- Backend: NestJS, TypeScript
- Database: PostgreSQL, Prisma
- Tooling: pnpm workspace, Docker Compose

## Features

### Customer Ordering

- Responsive menu with API-driven products and categories
- Product modal with size, add-ons and quantity selection
- Redux Toolkit cart with localStorage persistence
- Cart drawer, mobile cart bar and order summary
- Guest checkout with pickup/delivery, customer details, address and notes
- Order submission and success page

### Admin Orders

- Protected admin orders dashboard
- Server-side search, status/type filters and pagination
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

## API

### Public

```txt
GET    /api/health
GET    /api/menu
POST   /api/orders
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
```

### Admin Only

```txt
GET    /api/auth/me
GET    /api/orders
GET    /api/orders/:id
PATCH  /api/orders/:id/action
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

## Architecture

```txt
Next.js Frontend
  ↓ HTTP + HttpOnly Cookies
NestJS REST API
  ↓ Prisma
PostgreSQL
```

## Project Structure

```txt
orderly/
  apps/
    web/      # Next.js frontend
    api/      # NestJS backend
  packages/
    shared/   # Shared types and schemas
```

## Local Development

Start PostgreSQL:

```bash
pnpm db:up
```

Run migrations and seed menu data:

```bash
pnpm db:migrate
pnpm db:seed
```

Configure `apps/api/.env` with:

```env
DATABASE_URL=
WEB_ORIGIN=http://localhost:3000

JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=

JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d
JWT_REFRESH_TTL_DAYS=7

ADMIN_SEED_EMAIL=
ADMIN_SEED_PASSWORD=
```

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
- Feature-based frontend modules for menu, cart, checkout, admin orders and auth.
- Redux Toolkit for scalable client-side state.
- HttpOnly cookies keep access and refresh tokens unavailable to browser JavaScript.
- Refresh token rotation and database-backed sessions support logout and session revocation.
- Nest guards enforce admin access at the API boundary.
- Backend price recalculation and order snapshots preserve historical accuracy.
- Server-side admin search, filters and pagination avoid loading every order.
- Action-based order APIs express business intent while the backend controls valid transitions.
- Reusable UI primitives such as Button, Card and Input.
- Docker Compose provides reproducible local PostgreSQL setup.

## Current Progress

- [x] Customer menu, product customisation and cart
- [x] Guest checkout and order submission
- [x] Prisma order modelling and order snapshots
- [x] Admin orders dashboard
- [x] Search, filtering and pagination
- [x] Action-based order workflow with tests
- [x] Admin authentication and protected routes
- [x] Auth unit tests and protected API boundary tests
- [ ] Customer order status tracking
- [ ] Product and category management
- [ ] Customer accounts and saved addresses
- [ ] Customer social login

## Next Steps

- Add customer order status tracking
- Add product and category management
- Add customer accounts with guest-order linking
- Add optional customer Google sign-in while preserving guest checkout
