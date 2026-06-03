# Orderly

A production-grade online ordering platform built with Next.js, NestJS, PostgreSQL, Prisma and Docker.

This project is designed as a full-stack portfolio project to demonstrate frontend architecture, backend API design, relational database modelling, and order workflow logic.

## Tech Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS
- Backend: NestJS, TypeScript
- Database: PostgreSQL, Prisma
- DevOps: Docker Compose, pnpm workspace

## Core Features

### Customer Menu

- Responsive customer-facing menu page
- Restaurant-style hero section
- Category tabs for menu filtering
- Product cards with name, description and price
- API-driven menu rendering from the NestJS backend
- Basic empty and error states

### Backend API

- Health check endpoint
- Menu endpoint backed by PostgreSQL and Prisma
- Seeded menu data for local development

### Customer

- Browse menu by category
- View product details
- Select product options
- Add items to cart
- Submit order
- View order status

### Admin

- View incoming orders
- Update order status
- Manage products
- Manage categories
- Control store availability

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
- [ ] Frontend menu page
- [ ] Product detail modal
- [ ] Cart drawer
- [ ] Checkout flow
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
- Uses PostgreSQL for relational product, option and order modelling.
- Uses Prisma for type-safe database access and migration management.
- Product prices will be recalculated on the backend instead of trusting client-side prices.
- Orders will store product and price snapshots to preserve historical order accuracy.
- Docker Compose is used to make the local database setup reproducible.

## Next Steps
