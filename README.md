# Little Steps — Trusted 24×7 Childcare Platform

A full-stack web app connecting parents with verified childcare centers and
caregivers. Built with **Next.js 16 (App Router) · TypeScript · Tailwind CSS ·
Prisma · PostgreSQL**.

Phase 1 delivers the core booking flow end-to-end: role-based auth (parent /
provider / admin), center search with filters, center detail pages, booking
requests, provider accept/reject, and admin approvals.

## Features

- **Parents** — register, search & filter centers (24×7, age group, timing,
  plan, max price), view center details and caregivers, book hourly/daily/monthly
  slots, track and cancel bookings.
- **Providers** — register (pending admin verification), create and list
  centers, receive booking requests, accept/reject/complete them, view earnings.
- **Admins** — approve/reject users and centers, monitor platform stats.

## Setup

### 1. Configure the database

Make sure PostgreSQL is running, then create the database:

```bash
psql -U postgres -h localhost -c "CREATE DATABASE littlesteps;"
```

Copy `.env.example` to `.env` (already present) and set your real values:

```
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/littlesteps?schema=public"
AUTH_SECRET="<any long random string>"
```

### 2. Install, migrate, seed

```bash
npm install
npm run db:migrate   # creates the schema (prisma migrate dev --name init)
npm run db:seed      # loads demo users, centers, caregivers, bookings
```

### 3. Run

```bash
npm run dev
```

Open http://localhost:3000.

## Demo accounts

All seeded accounts use the password `password123`:

| Role     | Email                     | Notes                    |
| -------- | ------------------------- | ------------------------ |
| Admin    | `admin@littlesteps.com`   | Full approval console    |
| Provider | `provider@littlesteps.com`| Approved, owns 2 centers |
| Provider | `pending@littlesteps.com` | Awaiting admin approval  |
| Parent   | `parent@littlesteps.com`  | Has sample bookings      |

## Project structure

```
prisma/            schema.prisma + seed.ts
src/lib/           prisma client, auth (JWT cookie), api guards
src/components/    Nav, StatusBadge
src/app/api/       REST route handlers (auth, centers, bookings, admin)
src/app/           pages: landing, login, register, centers, dashboards
```

## Notes

- Parents are auto-approved on signup; providers require admin verification
  before their centers appear in search.
- Session auth uses a signed JWT (`jose`) in an httpOnly cookie; passwords are
  hashed with bcrypt.
- Payments, live CCTV, and native mobile apps are out of scope (future phases).
