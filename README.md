# Orderly

A production-grade online ordering platform built with Next.js, NestJS, PostgreSQL, Prisma and Docker.

Orderly demonstrates a full customer ordering flow and an admin order-management workflow, including cart state, checkout, relational order modelling, server-side filtering, pagination, and protected business rules.

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
- Checkout with pickup/delivery, customer details, address and notes
- Order submission and success page

### Admin Orders

- Responsive admin orders dashboard
- Server-side search, status/type filters and pagination
- Order summary metrics, list and detail panel
- Loading, empty, error and refresh states
- Action-based order workflow:

```txt
PENDING → ACCEPTED → PREPARING → READY → COMPLETED
```

- Backend-enforced workflow rules and idempotent repeated actions

### API

```txt
GET    /api/health
GET    /api/menu

POST   /api/orders
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
  ↓ HTTP
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

```bash
pnpm db:up
pnpm db:migrate
pnpm db:seed
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

## Key Engineering Decisions

- Separate Next.js frontend and NestJS REST API.
- Feature-based frontend modules for menu, cart, checkout and admin orders.
- Redux Toolkit for scalable client-side cart state.
- Backend price recalculation and order snapshots for historical accuracy.
- Server-side admin search, filters and pagination rather than loading every order.
- Action-based order API: clients express intent, while the backend controls valid state transitions.
- Reusable UI primitives such as Button, Card, Input and Select.
- Docker Compose for reproducible local PostgreSQL setup.

## Current Progress

- [x] Customer menu, product customisation and cart
- [x] Checkout and order submission
- [x] Prisma order modelling and order snapshots
- [x] Admin orders dashboard
- [x] Search, filtering and pagination
- [x] Action-based order workflow with unit tests
- [ ] Customer order status tracking
- [ ] Admin authentication and protected routes
- [ ] Product and category management

## Next Steps

- Add admin authentication and route protection
- Add customer order status tracking
- Add product and category management
