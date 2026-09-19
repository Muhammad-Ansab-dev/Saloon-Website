# Paul Hair Studio — Website

An editorial, luxury **hair-salon marketing website** for Paul Hair Studio, with a
full **admin dashboard** so the owner can manage the business without touching code.

**Two audiences, one site:**

1. **Visitors** get an elegant homepage, a full services menu, a filterable gallery,
   an about page, a booking flow, a contact page, and a small product cart.
2. **The owner** (and branch managers) get a password-protected dashboard at
   `/dashboard` to track bookings and revenue, manage services/stylists/media,
   handle branches, and answer pending bookings.

---

## Features

**Public site**
- Homepage with hero, partner marquee, about, service menu, lookbook, team, 3D
  coverflow testimonials, visit-us locations and newsletter.
- Full services flow: `/services` (category grid) → `/services/<category>` →
  `/services/<service-id>`.
- Filterable gallery + editorial films.
- Booking everywhere: any "Book now" button opens the booking modal with the
  service pre-selected. The contact page embeds the same form inline.
- Luxury product cart (product modal → cart drawer).

**Admin dashboard (`/dashboard`)** — 8 tabs:
- **Overview** — revenue, appointments, clients, average booking value, with
  Total / Daily / Weekly / Monthly / Yearly / Custom-period filters and charts.
- **Bookings** — Analytics (trend chart + status donut + KPIs), All Bookings,
  Today Bookings, and a Branch sub-view that scopes analytics to one branch.
- **Services / Stylists / Media / Branches / Content / Notifications** — full
  CRUD over the database, plus a pending-bookings inbox.

**Branch consoles** (`/dashboard/branch/<slug>`) — branch managers get their own
scoped overview / bookings / stylists views.

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 15 (App Router) |
| UI | React 19, TypeScript, Tailwind CSS v4 |
| Animation | motion (framer-motion) |
| Database | PostgreSQL (via `pg`) |
| Charts | recharts |
| Uploads | Cloudinary (optional) or local `data/uploads/` |
| Email | nodemailer SMTP (optional) |
| Package manager | pnpm |

---

## Getting started

Requires **Node 18.18+**, **pnpm**, and a **PostgreSQL** database.

```bash
pnpm install                       # install dependencies
cp .env.example .env.local         # then fill in values (see below)
pnpm dev                           # dev server → http://localhost:3010
```

Other commands:

```bash
pnpm lint     # type-check only (tsc --noEmit) — run after any code change
pnpm build    # production build
pnpm start    # serve the production build on :3010
```

> ⚠️ `pnpm build` writes into `.next`, the same folder `pnpm dev` runs from.
> Running a build while the dev server is running breaks the live dev session
> (stale chunks → 404 / 500). Stop the dev server first, or restart it after.

The first request to any content endpoint creates the database tables and seeds
them from the static defaults in `src/data/`.

---

## Environment variables

See `.env.example`. `.env*` files are git-ignored except `.env.example`.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Production | PostgreSQL connection string. Dev fallback: `postgres://salon:salon_dev_2026@localhost:5432/salon`. |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Production | Superadmin login. Dev fallbacks: `admin` / `paul123`. |
| `ADMIN_SECRET` | Production | HMAC secret that signs the session cookie. Generate with `openssl rand -hex 32`. |
| `BRANCH_ZURICH_USERNAME/PASSWORD`, `BRANCH_PARIS_USERNAME/PASSWORD` | Optional | Only used to **seed** the initial Zurich/Paris branch rows. Afterwards the **Branches tab is the source of truth**. Dev fallbacks: `zurich`/`zurich123`, `paris`/`paris123`. |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Optional | When all three are set, admin uploads go to Cloudinary; otherwise files are stored in `data/uploads/` and served by the site. |
| `CLOUDINARY_FOLDER` | Optional | Cloudinary folder name (default `hair-salon`). |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Optional | SMTP for booking confirmation emails. `smtp.gmail.com` + a Gmail App Password works. Unset = no emails. |
| `MAIL_FROM` | Optional | Sender shown on confirmation emails. |

> **Fail closed:** in production, without `ADMIN_USERNAME`, `ADMIN_PASSWORD` and
> `ADMIN_SECRET`, login can **never** succeed and no session verifies.

---

## How the site works (the big picture)

Think of it in four layers — static data → database → API → screen:

```
 1. STATIC DEFAULTS   src/data/salonData.ts + galleryData.ts
        │              (arrays: services, products, stylists, images, locations…)
        ▼              (first run of the DB seeds these in)
 2. POSTGRES STORE    src/lib/store.ts  — the database "filing cabinet"
        ▲              (admin edits save here)   │   (public site reads here)
 3. API ENDPOINTS     /api/content, /api/availability, /api/booking   (public)
                      /api/admin/*, /api/auth/*                      (protected)
        ▲ objects ▼
 4. UI COMPONENTS     React components render whatever the API returns
```

Everything ships with static fallbacks: if the database is unreachable, the site
still renders using the defaults in `src/data/` — it never goes blank.

---

## Project structure

```
src/
  app/                    Route shells (thin pages — they render the "views")
    page.tsx              /  — homepage
    about/ contact/ gallery/ services/     public pages
    services/[id]/        /services/<slug-or-id>  (category OR detail)
    dashboard/            admin console, login, branch consoles
    api/                  API endpoints (see below)
    images/cms/[name]/    serves local uploads from data/uploads
  views/                  route-level compositions (HomePage, AboutPage, …)
  sections/<page>/        sections grouped by their page
  components/
    layout/               Providers, Header, Footer, FloatingWidget
    booking/              the booking flow (modal + form + pickers)
    cart/                 cart drawer + product modal
    dashboard/            8 admin tabs + helpers
    ui/                   animation + UI primitives
  hooks/                  useSiteContent — mirrors admin data into the site
  lib/                    store (Postgres), auth, email, dates, uploads
  data/                   STATIC DEFAULT CONTENT (edit copy here)
  middleware.ts           guards /dashboard and /api/admin/*
types.ts                 shared TypeScript interfaces
```

## Page map

| URL | What it is |
| --- | --- |
| `/` | Homepage (hero → partners → about → service menu → lookbook → team → testimonials → locations → newsletter) |
| `/about` | Story, stats, philosophy, team, timeline |
| `/services` | Category cards |
| `/services/<slug-or-id>` | Category page **or** service detail |
| `/gallery` | Filterable image grid + films |
| `/contact` | Locations, hours, inline booking form |
| `/dashboard` | Admin console (all tabs) |
| `/dashboard/login` | Sign-in |
| `/dashboard/branch/<slug>` | Branch-manager console |

---

## Booking flow

- The booking modal and the `/contact` booking card are **one and the same widget**
  (`src/components/booking/BookingForm.tsx`) so they can never disagree.
- A booking form asks `/api/availability` for free time slots, then submits to
  `/api/booking`. New bookings are always created as **pending**.
- Booking dates & times come from salon business hours in `src/lib/bookingTime.ts`.

## Cart flow

Product → product modal → add to cart → cart drawer. The header bag button shows a
live item count. Cart state lives in the global context (`Providers`).

## Admin dashboard & analytics

- **All revenue/money formatting is GBP** (`gbp()`).
- Analytics periods: Total (all time), Daily (last 30 days), Weekly (last 8 weeks),
  Monthly (this year), Yearly (calendar year), and a custom date range.
- The **All Bookings** list defaults to **"From today onward"** — it starts at today
  and runs forward, ascending.
- Past-dated pending/confirmed bookings are **automatically cancelled** every time
  the bookings list is loaded.
- **Notifications** lists only *pending* bookings from today onward, with
  today/day-of-week/custom-date filters, search, and a status dropdown
  (pending / confirmed / cancelled). Confirming a booking triggers the confirmation
  email (if SMTP is configured) and shows the result in a toast.

## Roles & security

- Sessions are signed cookies (`httpOnly`, 12h). Two roles: **admin** (reads
  everything) and **branch** (scoped to their own branch console).
- Login is rate-limited (8 attempts/min/IP), credentials compare in constant time,
  and production fails closed without the admin env vars.
- Admin uploads accept **raster images only** (no SVG), max 25 MB.
- Baseline security headers are set in `next.config.ts`.

---

## Deployment

Hosted on **Vercel**; `vercel.json` sets `buildCommand: pnpm build` and
`outputDirectory: .next`.

Set these in the Vercel project environment: `DATABASE_URL`, `ADMIN_USERNAME`,
`ADMIN_PASSWORD`, `ADMIN_SECRET` — plus Cloudinary / SMTP variables if used.

Git remote: `git@github.com:Muhammad-Ansab-dev/Saloon-Website.git` (`main`).

---

## Editing site copy without code

The static (fallback) content lives in `src/data/salonData.ts` (services, products,
testimonials, stylists, locations, image maps) and `src/data/galleryData.ts`
(gallery items + films). Editing those arrays changes the site's default content —
and anything edited through the dashboard overrides those defaults in the database.