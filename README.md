# Little Steps — Trusted 24×7 Childcare Platform

A full-stack web app connecting parents with verified childcare centers and
caregivers. Built with **Next.js 16 (App Router) · TypeScript · Tailwind CSS ·
Prisma · PostgreSQL**.

Five of the six roadmap phases are delivered end-to-end:

1. **Booking flow** — role-based auth (parent / provider / admin), center search
   with filters, center detail pages, booking requests, provider
   accept/reject/complete, admin approvals.
2. **Subscriptions & notifications** — recurring care plans with pause/resume/
   cancel and next-billing dates, plus an in-app notification bell for every
   account, center, booking and subscription event.
3. **Payments** — in-app checkout for bookings and subscription renewals through
   a mock gateway (card / UPI / net banking), receipts, refunds, and collected
   earnings on the provider and admin dashboards.
4. **Live CCTV monitoring** — providers manage per-center cameras; enrolled
   parents watch HLS/MP4/embedded feeds from a dedicated Live page, gated by
   active care.
5. **AI recommendations** — parent reviews plus an explainable weighted scoring
   engine that ranks centers and caregivers on the dashboard.

The mobile/PWA pass (Phase 6) is in place too: an installable web manifest,
generated icons, a service worker that keeps visited pages readable offline,
and a phone-sized bottom tab bar.

## Features

- **Parents** — register, search & filter centers (24×7, age group, timing,
  plan, max price), view center details and caregivers, book hourly/daily/monthly
  slots, track and cancel bookings, subscribe to recurring care, pay from the
  dashboard, read receipts, watch the live CCTV feeds of centers they are
  enrolled in, rate the centers they have used, and see a "Recommended for you"
  panel on their dashboard.
- **Providers** — register (pending admin verification), create and list
  centers, receive booking requests, accept/reject/complete them, review
  subscriptions and payments, refund paid transactions, and manage their own
  CCTV cameras (add / pause / edit / remove feeds).
- **Admins** — approve/reject users and centers, monitor platform stats and
  total collected revenue.

### Live CCTV viewing

Providers register cameras per center (`HLS`, plain `MP4` or an embeddable
`IFRAME` stream). A parent only sees a center's feeds while they hold an ACTIVE
subscription or a CONFIRMED booking that covers today — the API returns `403`
for everyone else, so the gate cannot be bypassed from the client. `hls.js`
handles HLS where supported and the player falls back to native playback
otherwise; a paused camera never opens a network connection.

### Recommendations & reviews

`GET /api/recommendations` scores approved centers and caregivers for a parent
with a small, explainable weighted model (weights sum to 100, so the result
reads as a % match):

| Signal        | Weight | Source                                             |
| ------------- | ------ | -------------------------------------------------- |
| Age fit       | 22     | child age groups from past bookings vs center      |
| Rating        | 20     | `CenterReview`, Bayesian-smoothed toward 3.5       |
| Price fit     | 16     | median daily spend vs the center's daily rate      |
| Locality      | 14     | cities the parent already books in                 |
| Safety        | 10     | verified-caregiver ratio and years of experience   |
| Neighbours    | 10     | item-based collaborative filtering ("similar families") |
| Availability  | 8      | free places left against capacity                  |

Centers the parent already uses are excluded, and a center that is not 24×7 is
penalised ×0.6 when the parent's history shows night care. The top three
contributing signals are returned as human-readable reasons, so every score is
auditable. Parents can only review a center after a confirmed booking or an
active subscription (one review per parent+center, edited in place).

### Installable and offline (PWA)

`src/app/manifest.ts` serves the web manifest; `scripts/make-icons.mjs` renders
the PNG icon set (any + maskable + `apple-touch-icon`) from `public/icon.svg`:

```bash
node scripts/make-icons.mjs   # only needed after changing the artwork
```

`public/sw.js` is registered in production only, so `next dev` hot reload stays
predictable. Its rules:

- Precaches `/offline.html` and the icons on install.
- Stale-while-revalidate for `/_next/static/*` and image/font files.
- Network-first for page navigations, falling back to the cached copy and then
  to `/offline.html`.
- **Never** caches anything under `/api/`, so bookings, payments and live feeds
  can't be served from a stale cache.

On phones the header nav collapses into a fixed bottom tab bar
(`src/components/MobileTabBar.tsx`) whose tabs follow the signed-in role —
Find / Live / Home / Alerts for parents, Find / Home / Alerts for providers and
admins, Find / Log in when signed out.

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
npm run db:seed      # demo users, centers, caregivers, cameras, reviews,
                     # bookings, subscriptions and payments
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
| Parent   | `kavya@littlesteps.com`   | Confirmed care at a camera-equipped center |
| Parent   | `rohit@littlesteps.com`   | Two confirmed bookings, no subscription |

## Project structure

```
prisma/            schema.prisma + seed.ts + migrations
scripts/           make-icons.mjs (renders the PWA icon set)
public/            icon.svg, offline.html, sw.js, icons/
src/lib/           prisma client, auth (JWT cookie), api guards, notify, billing,
                   access (enrolment gate for live feeds), recommend* (scoring)
src/components/    Nav, MobileTabBar, ServiceWorker, StatusBadge, CameraPlayer,
                   CenterCameras, Recommendations, CenterReviews
src/app/           pages: landing, login, register, centers, dashboard, live,
                   provider, admin, notifications + manifest.ts
src/app/api/       REST route handlers: auth, centers, centers/[id]/cameras,
                   cameras/[id], live, bookings, subscriptions, notifications,
                   payments (+ /payments/[id]/refund), reviews, recommendations,
                   admin
```

## Notes

- Parents are auto-approved on signup; providers require admin verification
  before their centers appear in search.
- Session auth uses a signed JWT (`jose`) in an httpOnly cookie; passwords are
  hashed with bcrypt.
- Prisma is pinned to **v6** on purpose — the v8 CLI is a different
  "Prisma Developer Platform" and no longer provides `generate` / `migrate dev`
  / `db seed`, which the npm scripts above depend on.
- CCTV streams in the seed are public test assets (Mux / Apple HLS and a Big
  Buck Bunny MP4), so the live page plays without a real camera behind it.
- The PWA is installable and reads cached pages offline; native iOS/Android
  wrappers are still future work.
