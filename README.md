# Orderly

A production-grade online ordering platform built with Next.js, NestJS, PostgreSQL, Prisma and Docker.

Orderly is designed as a full-stack portfolio project to demonstrate frontend architecture, backend API design, relational database modelling, cart state management, and order workflow logic.

## Tech Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS
- State Management: Redux Toolkit
- Backend: NestJS, TypeScript
- Database: PostgreSQL, Prisma
- DevOps: Docker Compose, pnpm workspace

## Core Features

### Customer Menu

- Responsive customer-facing menu page
- Restaurant-style hero section
- Category tabs for menu filtering
- API-driven menu rendering from the NestJS backend
- Product cards with image, name, description and price
- Product detail modal with size, add-ons and quantity selection
- Empty and error states

### Cart

- Add items to cart
- Update item quantity
- Remove items from cart
- Cart drawer
- Header cart button with item count and subtotal
- Mobile sticky cart bar
- Cart subtotal calculation
- localStorage cart persistence

### Backend API

- Health check endpoint
- Menu endpoint backed by PostgreSQL and Prisma
- Seeded menu data for local development

### Planned Features

- Checkout flow
- Order submission
- Order status tracking
- Admin order management
- Product and category management
- Store availability control

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
- [x] Frontend menu page
- [x] Product detail modal
- [x] Redux Toolkit cart state
- [x] Cart drawer
- [x] Header cart button
- [x] Mobile cart bar
- [x] localStorage cart persistence
- [ ] Checkout flow
- [ ] Order submission API
- [ ] Admin order management

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
GET /api/health
GET /api/menu
```

## Key Engineering Decisions

- Uses a separated frontend and backend architecture instead of a Next.js-only full-stack app.
- Uses a feature-based frontend structure for menu and cart modules.
- Uses Redux Toolkit for scalable client-side cart state management.
- Uses localStorage persistence for cart continuity before checkout.
- Uses PostgreSQL for relational product, option and order modelling.
- Uses Prisma for type-safe database access and migration management.
- Product prices will be recalculated on the backend instead of trusting client-side prices.
- Orders will store product and price snapshots to preserve historical order accuracy.
- Docker Compose is used to make the local database setup reproducible.

## Next Steps

- Build checkout page
- Add customer information form
- Add order summary
- Implement order submission API
- Persist submitted orders in PostgreSQL
