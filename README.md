# Little Steps — Trusted 24×7 Childcare Platform

A full-stack web app connecting parents with verified childcare centers and
caregivers. Built with **Next.js 16 (App Router) · TypeScript · Tailwind CSS ·
Prisma · PostgreSQL**.

The three core phases of the roadmap are all delivered end-to-end:

1. **Booking flow** — role-based auth (parent / provider / admin), center search
   with filters, center detail pages, booking requests, provider
   accept/reject/complete, admin approvals.
2. **Subscriptions & notifications** — recurring care plans with pause/resume/
   cancel and next-billing dates, plus an in-app notification bell for every
   account, center, booking and subscription event.
3. **Payments** — in-app checkout for bookings and subscription renewals through
   a mock gateway (card / UPI / net banking), receipts, refunds, and collected
   earnings on the provider and admin dashboards.

## Features

- **Parents** — register, search & filter centers (24×7, age group, timing,
  plan, max price), view center details and caregivers, book hourly/daily/monthly
  slots, track and cancel bookings, subscribe to recurring care, pay from the
  dashboard, and read receipts.
- **Providers** — register (pending admin verification), create and list
  centers, receive booking requests, accept/reject/complete them, review
  subscriptions and payments, and refund paid transactions.
- **Admins** — approve/reject users and centers, monitor platform stats and
  total collected revenue.

### Payments are simulated

No real money moves. `POST /api/payments` creates a `PENDING` row and resolves it
to `SUCCESS` (or `FAILED` when `simulateFailure: true` in the body) immediately,
which is enough to exercise the whole ledger: refunds, "collected = successful −
refunded", receipts and notification emails-in-app. Swapping in Razorpay/Stripe
later means replacing only that resolve step.

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
npm run db:migrate   # applies the prisma/migrations schema
npm run db:seed      # demo users, centers, caregivers, bookings, subscriptions, payments
```

### 3. Run

```bash
npm run dev
```

Open http://localhost:3000.

If the SWC native binary is blocked on your machine (Windows apps under
Application Control report `Turbopack is not supported on this platform`), run
`npx next dev --webpack` instead.

## Demo accounts

All seeded accounts use the password `password123`:

| Role     | Email                     | Notes                                   |
| -------- | ------------------------- | --------------------------------------- |
| Admin    | `admin@littlesteps.com`   | Full approval console                   |
| Provider | `provider@littlesteps.com`| Approved, owns 2 centers                |
| Provider | `pending@littlesteps.com` | Awaiting admin approval                 |
| Parent   | `parent@littlesteps.com`  | Sample bookings, subscriptions, payments|

## Project structure

```
prisma/            schema.prisma + seed.ts + migrations
src/lib/           prisma client, auth (JWT cookie), api guards, notify, billing
src/components/    Nav, StatusBadge
src/app/api/       REST route handlers: auth, centers, bookings, subscriptions,
                   notifications, payments (+ /payments/[id]/refund), admin
src/app/           pages: landing, login, register, centers, dashboard,
                   provider, admin, notifications
```

## Notes

- Parents are auto-approved on signup; providers require admin verification
  before their centers appear in search.
- Session auth uses a signed JWT (`jose`) in an httpOnly cookie; passwords are
  hashed with bcrypt.
- Prisma is pinned to **v6** on purpose — the v8 CLI is a different
  "Prisma Developer Platform" and no longer provides `generate` / `migrate dev`
  / `db seed`, which the npm scripts above depend on.
- Live CCTV feeds, native mobile apps and AI caregiver recommendations remain
  out of scope (stretch items in the PRD).
