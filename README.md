# Orderly

A production-grade online ordering platform built with Next.js, NestJS, PostgreSQL, Prisma and Docker.

Orderly is designed as a full-stack portfolio project to demonstrate frontend architecture, backend API design, relational database modelling, cart state management, checkout flow, and order workflow logic.

## Tech Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS
- State Management: Redux Toolkit
- Backend: NestJS, TypeScript
- Database: PostgreSQL, Prisma
- DevOps: Docker Compose, pnpm workspace

## Core Features

### Customer Ordering

- Responsive customer-facing menu page
- API-driven menu rendering
- Product detail modal with size, add-ons and quantity selection
- Cart drawer with quantity updates and item removal
- Header cart button with item count and subtotal
- Mobile sticky cart bar
- localStorage cart persistence
- Checkout page with fulfillment choice, customer details, delivery address and order notes
- Order submission flow
- Order success page

### Backend API

- Health check endpoint
- Menu endpoint backed by PostgreSQL and Prisma
- Order creation API
- Order listing API
- Order detail API
- Order status update API
- Seeded menu data for local development

### Admin

- Admin orders dashboard foundation
- Order summary cards
- Order list and detail panel
- Order status badges
- Order status update actions

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

## Current Progress

- [x] Monorepo setup
- [x] Docker PostgreSQL setup
- [x] Prisma schema and migrations
- [x] Seed data
- [x] NestJS backend foundation
- [x] Health API
- [x] Menu API
- [x] Customer menu page
- [x] Product detail modal
- [x] Redux Toolkit cart state
- [x] Cart drawer
- [x] localStorage cart persistence
- [x] Checkout flow
- [x] Order submission API
- [x] Order success page
- [x] Admin order API foundation
- [x] Admin orders dashboard foundation
- [ ] Admin filtering, search and pagination
- [ ] Customer order status tracking
- [ ] Admin authentication
- [ ] Product and category management

## Local Development

Start PostgreSQL:

```bash
pnpm db:up
```

Run database migration:

```bash
pnpm db:migrate
```

Seed development data:

```bash
pnpm db:seed
```

Start backend API:

```bash
pnpm dev:api
```

Start frontend app:

```bash
pnpm dev:web
```

Backend API:

```txt
http://localhost:4000/api
```

Available endpoints:

```txt
GET    /api/health
GET    /api/menu
POST   /api/orders
GET    /api/orders
GET    /api/orders/:id
PATCH  /api/orders/:id/status
```

## Key Engineering Decisions

- Uses a separated frontend and backend architecture instead of a Next.js-only full-stack app.
- Uses a feature-based frontend structure for menu, cart, checkout and admin orders.
- Uses Redux Toolkit for scalable client-side cart state management.
- Uses localStorage persistence for cart continuity before checkout.
- Uses PostgreSQL for relational product, option and order modelling.
- Uses Prisma for type-safe database access and migration management.
- Recalculates order pricing on the backend instead of trusting client-side prices.
- Stores product and price snapshots on orders to preserve historical accuracy.
- Uses reusable UI primitives such as Button and Card to keep the design system consistent.
- Uses Docker Compose to make local database setup reproducible.

## Next Steps

- Polish admin orders dashboard responsiveness and empty/loading/error states
- Add admin order filtering, search and pagination
- Add customer order status page
- Add admin authentication and protected routes
- Add product and category management
