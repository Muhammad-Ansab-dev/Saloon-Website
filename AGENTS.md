# AGENTS.md — Guidance for AI agents working in this repo

This file is written so that **a person with zero coding knowledge** can read it and
understand the project. Read it top to bottom before touching code. Everything you
need to navigate safely is here.

---

## 1. What this project is

Paul Hair Studio — a luxury hair-salon marketing website with two big halves:

1. **The public site** (what visitors see): homepage, services menu, gallery, about,
   contact, a booking form, and a small product cart.
2. **The admin dashboard** (what the owner sees at `/dashboard`): a password-protected
   control panel backed by a PostgreSQL database where bookings, services, stylists,
   media, branches, and content can be created/edited/deleted without touching code.

**Tech stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4,
motion (framer-motion), PostgreSQL. Package manager is **pnpm**.

### The 4-layer mental model (memorise this)

```
 1. STATIC DEFAULTS   src/data/salonData.ts + galleryData.ts
        │  (arrays of products, services, stylists, images, locations…)
        ▼  (first run of the DB seeds these in)
 2. POSTGRES STORE    src/lib/store.ts  — the "filing cabinet"
        ▲  (admin edits write here)        │  (public site reads here)
 3. API ENDPOINTS     /api/content, /api/availability, /api/booking (public)
                      /api/admin/*,        /api/auth/*                (protected)
        ▲ objects ▼
 4. UI COMPONENTS     React components render whatever the API returns
```

The site never "blanks": if the DB is unreachable, every component falls back to the
static defaults in layer 1.

---

## 2. Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Dev server → **http://localhost:3010** (hot reload) |
| `pnpm lint` | **Type-check only** (`tsc --noEmit`, strict). NO style linting. |
| `pnpm build` | Production build (`next build`) |
| `pnpm start` | Serve the production build on :3010 |
| `psql "postgres://salon:salon_dev_2026@localhost:5432/salon"` | Inspect the DB |

> `pnpm lint` is the ONLY verification gate used in this repo. Always run it after
> edits and before finishing.

---

## 3. Workflow / practical rules (follow unconditionally)

- **VERIFY with the dev server.** After edits, wait a few seconds, then
  `curl -s http://localhost:3010/<route>` and grep for the expected markup.
  The HMR host is **:3010**. A separate *legacy Vite* project runs on **:3000** —
  do **not** touch it (see Gotchas).
- **Never `rm -rf .next`** while `next dev` is running, and **never run `pnpm build`
  over a live dev session** — a production build stomps `.next` and the running dev
  server starts failing with stale-chunk 500/404s.
- **Never kill the user's dev process** (`pkill -f next`, `killall node`, etc.).
  It runs in the user's terminal. Exception: see the standing restart permission below.
- **Never print secrets** from `.env.local` (`DATABASE_URL` credentials,
  `ADMIN_*`, `CLOUDINARY_*`, `SMTP_*`). Never echo them, never commit them.
- **Never commit** unless the user explicitly asks.
- **Never edit the sibling Vite repo** — all edits belong in **this** directory.

---

## 4. Environment variables

See `.env.example`. `.env*` is git-ignored except `.env.example`.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Prod | PostgreSQL connection string. Dev fallback: the local `salon` DB. |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` / `ADMIN_SECRET` | Prod | Superadmin login + cookie-signing secret. Dev fallbacks: `admin` / `paul123` / `dev-secret-change-me`. **Production fails closed** when unset (login can never succeed). |
| `BRANCH_ZURICH/USERNAME|PASSWORD`, `BRANCH_PARIS/USERNAME|PASSWORD` | Optional | Only SEED the initial Zurich/Paris branch rows on first store init. Afterwards the **Branches tab is the source of truth** (DB rows win). Dev fallbacks: `zurich`/`zurich123`, `paris`/`paris123`. A branch login lands on `/dashboard/branch/<slug>` and its session is scoped to that branch server-side. |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` (+ `CLOUDINARY_FOLDER`) | Optional | When set, admin uploads go to Cloudinary; otherwise files land in `data/uploads/`, served by `src/app/images/cms/[name]/route.ts`. |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `MAIL_FROM` | Optional | Booking-confirmation emails on status "confirmed". Unset = emails are skipped, never an error. |

---

## 5. Where things live (annotated map)

```
src/
  app/                    Next.js public routes (thin shells — they just render views)
    page.tsx              /  — homepage
    about/ contact/ gallery/ services/      public pages
    services/[id]/        /services/<slug-or-id>  (category page OR service detail)
    dashboard/            /dashboard (admin), /dashboard/login, /dashboard/branch/<id>
    api/                  route handlers (the "API layer" of the mental model)
      content/            public site-data feed (NO manager credentials, NO bookings)
      availability/       free slot checker for booking forms
      booking/            public booking submission (always creates status=‘pending’)
      admin/[col]/        CATCH-ALL admin CRUD for every collection (see §7.5)
      admin/upload/       image upload (raster only)
      auth/login/         login (rate-limited) + sign-out
    images/cms/[name]/    streams manually uploaded files from data/uploads
    layout.tsx            root shell: mounts <Providers> once + all site chrome
    globals.css           design tokens (blush pinks, fonts), Tailwind v4 import
  views/                  route-level compositions (HomePage, AboutPage, GalleryPage, ServicesPage)
                          NOTE: named views/, NOT pages/ — src/pages is reserved by Next.js
  sections/<page>/        sections grouped by their page (home/, services/, about/, contact/)
  components/
    layout/               Providers, Header, Footer, FloatingWidget
    booking/              BookingModal, BookingForm, DatePickerField, TimeSlotDropdown
    cart/                 CartDrawer, ProductModal, ProductBottleVisual
    dashboard/            the 8 admin tabs + helpers (see §7)
    ui/                   animation primitives + shadcn-style controls
  hooks/useSiteContent.ts mirrors admin data into the public site (with static fallback)
  lib/                    the brains: store.ts (Postgres), auth.ts, email.ts, bookingTime.ts,
                          dateWindows.ts, calendarGrid.ts, cloudinary.ts, utils.ts
  data/                   STATIC DEFAULT CONTENT (edit copy here)
  experience/             scoped CSS for hero/sections
  middleware.ts           hallway guard for /dashboard + /api/admin/*
types.ts                 shared TypeScript interfaces
next.config.ts           security headers, Cloudinary image allow-list
```

---

## 6. Key concepts, explained simply

### 6.1 Global state — `<Providers>` + `useSite()`
`src/components/layout/Providers.tsx` holds one React context containing ALL shared
site state: cart items, cart drawer open/close, booking modal open/close + which
service is pre-selected, product modal state. Every component reaches it through the
`useSite()` hook, which exposes:
`onBookNow`, `onSelectServiceForBooking(service)`, `onOpenCart`, `onOpenProduct`,
`onAddToCart`. Providers ALSO hides all site chrome on `/dashboard` and resolves
`/?scrollTo=<sectionId>` deep links (used by footer/header links from other pages).

### 6.2 The booking flow (modal + /contact form are ONE widget)
- Any "Book now" button calls `onSelectServiceForBooking(service)` → the `BookingModal`
  opens with that service pre-selected.
- The `/contact` page renders the **same** `BookingForm` inline as a card.
- ⚠️ **Never fork BookingForm.** If you edit booking markup, edit
  `src/components/booking/BookingForm.tsx` only, so modal and contact stay identical.
- The form asks `/api/availability` for free slots and submits to `/api/booking`.

### 6.3 The cart flow
Product card → `onOpenProduct` → `ProductModal` → `onAddToCart` → `CartDrawer` opens.
Header shows a bag button with a live item count.

### 6.4 Auth & roles (how the dashboard stays private)
- `src/lib/auth.ts` mints an HMAC-signed, `httpOnly` session cookie
  (`ph_admin_session`, 12h) carrying a role claim: **`admin`** (superadmin) or
  **`branch`** (branch manager).
- `src/middleware.ts` guards `/dashboard` → redirect to `/dashboard/login`, and
  `/api/admin/*` → 401. Branch managers are pinned to their own `/dashboard/branch/<slug>`.
- `authenticate()` is **Edge-safe** (no pg import); it accepts the DB branch rows
  so store-managed branch logins verify, and compares everything in constant time.
- `/api/auth/login` is rate-limited (8 attempts/min/IP) and returns the canonical
  redirect per role.

### 6.5 The content store (`src/lib/store.ts`)
The PostgreSQL "filing cabinet". Owns: schema creation, a **one-time seed** from the
static defaults, serialised (write-locked) transactions. Collections:
`services`, `stylists`, `gallery`, `site_images`, `categories`, `bookings`, `branches`.
**Auto-cancel:** `cancelOverdueBookings()` flips any `pending`/`confirmed` booking whose
date has already passed to `cancelled`. Every `GET /api/admin/bookings` runs this sweep
first, so the dashboard never shows stale past bookings as live.

### 6.6 Dates — one rule
Always build "today" with `todayISO()` from `src/lib/bookingTime.ts`. NEVER cache it
at module scope — a long-lived server process would freeze the date.

---

## 7. The dashboard in detail (`/dashboard`)

Protected by middleware. The left rail switches **eight** tabs, each a panel component:

| Tab | Component | What it does |
| --- | --- | --- |
| Overview | `OverviewTab` | Revenue KPIs. GBP formatting (`gbp()`). Period filter (Total/Daily/Weekly/Monthly/Yearly/Custom) with two inline `DateField` calendars for a custom range. recharts `AreaChart` + KPI sparklines. |
| Bookings | `BookingTab` | The biggest tab — see §7.1. |
| Services | `ServicesPanel` | CRUD over the `services` collection; create services & categories. |
| Stylists | `StylistsPanel` | CRUD over `stylists`. Branch managers see ONLY their own branch's stylists. |
| Media | `MediaPanel` | CRUD over `site_images` + uploads via `ImagePicker`. |
| Branches | `BranchesTab` | **admin-only** CRUD for branches. Branch rows carry manager credentials, so they are never exposed to branch logins. Per-branch stats + GBP revenue. "+ New branch" button. |
| Content | `ContentPanel` | Edit free-form content blocks / slides. |
| Notifications | `NotificationsPanel` | Pending-bookings inbox (see §7.2). |

### 7.1 `BookingTab` sub-views
`Analytics | All Bookings | Today Bookings | Branch`:
- **Analytics:** period tabs (Total/Daily/Weekly/Monthly/Yearly) + Custom range,
  revenue trend chart, status donut, KPI cards. The trend chart's XAxis MUST use
  `dataKey="label"` — `dataKey="key"` silently drops the Area paths in THIS chart.
- **All Bookings:** search bar + status filter + date presets + pagination (10/page).
  The default preset is **"From today onward"** — bookings are filtered to
  `date >= today` and sorted **ascending** so the list reads from the present day
  into the future. Past bookings are excluded (they auto-cancel server-side anyway).
  Custom single date via `DateField`. Inline status editing (PATCH `/api/admin/bookings`).
  "Add Booking" modal (POST `/api/admin/bookings`).
- **Today Bookings:** shorthand for `date == today`.
- **Branch:** a dropdown (All branches / one branch) that scopes the SAME analytics to a
  branch (e.g. ZURICH). Driven by the `analyticsBookings` memo which filters
  `scopedBookings` by the selected branch.

### 7.2 `NotificationsPanel` — pending-bookings inbox
Shows only `status === 'pending'` bookings **from today onward**, newest first,
10 per page. Filters: day-of-week (Today / Monday…Sunday) + a custom single date whose
calendar has `minDate={today}` (earlier days are disabled). Search covers name, email,
service, stylist, branch, date, time, notes. Each row has a status dropdown with EXACTLY
3 options (pending / confirmed / cancelled — completed is not offered). Choosing
"confirmed" PATCHes the booking; the API then sends the confirmation email via
`sendBookingConfirmationEmail` and the response reports `confirmationEmail:
'sent'|'skipped'|'error'`, surfaced in a toast. A Refresh button reloads the inbox.

### 7.3 Branch consoles (`/dashboard/branch/<id>`)
Rendered by `BranchDashboardShell` (overview / bookings / stylists views), data scoped
to one branch slug. Server-side, branch sessions can only read/mutate their OWN branch's
bookings and stylists; they CANNOT touch services/gallery/siteImages/uploads, and branch
rows are admin-only because they carry manager credentials.

### 7.4 Period semantics (used by analytics)
- `total` = all time; `daily` = last 30 days; `weekly` = last 8 weeks (Mondays);
  `monthly` = this year to date; `yearly` = current calendar year.
- These come from `dateWindows.ts` (`periodWindow()`); the calendar grid for date
  pickers comes from `calendarGrid.ts`.

### 7.5 Admin API (`/api/admin/[col]`)
One catch-all route serves every collection (services, stylists, gallery, site_images,
categories, bookings, branches). Method matrix:
GET (list, `{ items: [...] }`), POST (create), PUT (replace), PATCH (partial update),
DELETE. Booking PATCH validates status; status → `'confirmed'` triggers the confirmation
email. GET `/bookings` sorts date+time descending and runs the overdue-cancel sweep.
Admin row-scoping lives server-side here (branch managers filtered), plus
`Cache-Control: no-store` everywhere and `dynamic = 'force-dynamic'`.

---

## 8. Comment conventions (READ — the codebase is now fully documented)

Every source file carries a `// ─────` file-header block (what/why/how), and non-obvious
functions/state/logic carry inline comments. Preserve this when editing:

1. Keep every file-header accurate — if you repurpose a component, update its header.
2. Add a comment above any NEW function / state variable / non-obvious logic block,
   explaining its purpose in plain terms.
3. Do NOT add noisy comments to trivial lines (JSX markup, obvious one-liners).
4. Style: `//` line comments only; prefer a comment line ABOVE code over end-of-line.
5. Use the existing `// ── Section ──` banner style when adding grouped sections.

---

## 9. Styling conventions

- Headings: `font-editorial` (Syne, `font-black uppercase tracking-tight`).
- Script accent: `font-script`; luxury serif: `font-serif-luxury`.
- Brand pinks: `--color-blush*` tokens (`#fce8ee` family) in `src/app/globals.css`.
- Content page background: `bg-[#f7f5ee]`.
- Animations: prefer `ScrollReveal` / `SpringReveal` / `Parallax`
  (`src/components/ui/ScrollReveal.tsx`); use `motion` `AnimatePresence` for mounts/exits.

---

## 10. Security posture (keep intact at all costs)

- `src/lib/auth.ts` fails closed in production; credentials & signatures compared in
  constant time; cookie is `Secure` in production.
- `/api/auth/login` rate-limited — 8 attempts/min/IP.
- `/api/admin/upload` accepts only a whitelist of **raster** image types (no SVG = no
  stored XSS); 25 MB cap.
- `src/app/images/cms/[name]/route.ts` sends `X-Content-Type-Options: nosniff`.
- `next.config.ts` sets baseline security headers and `poweredByHeader: false`.

---

## 11. Dev-server lifecycle (standing permission, granted by the user)

I MAY kill/restart the running `pnpm dev` server (port 3010) whenever a **middleware
matcher change**, a **`next.config.ts` change**, or a **stale-client-chunk fix**
requires it. Prefer targeted restarts over `pnpm build` (never build over a live dev
session). If I restart it, I MUST tell the user it happened and that they should reload
the browser tab.

---

## 12. Gotchas / lessons learned (history of this project)

- **stale-canvas pitfall:** BOTH a Vite project (`/home/arch/Projects/Hair-Salon-Website`)
  and this Next.js project exist. Edits must go into THIS directory; the Vite repo is
  used by nothing live now.
- **Vercel 404 build:** previously failed with "No Output Directory named dist" — fixed
  by `vercel.json` (`buildCommand: pnpm build`, `outputDirectory: .next`).
- **Testimonials:** the homepage uses `TestimonialGrid` (3D coverflow).
- **Hero:** `Hero` (`src/sections/home/Hero.tsx`) is active — other hero/stylist/shop/
  gallery experiments were removed and `src/experience/` CSS pruned to match.
- **Booking consistency:** modal + `/contact` card are ONE widget — edit
  `src/components/booking/BookingForm.tsx`, never fork it.
- **Dates:** always `todayISO()` from `src/lib/bookingTime.ts`; never cache at module scope.
- **Admin endpoint naming:** `/api/admin/bookings` is served by the `[col]` catch-all,
  not a dedicated folder.
- **psql gotcha:** `bookings.date` is stored as TEXT. Compare with
  `date::date < CURRENT_DATE`, NOT `date < CURRENT_DATE` (type error).
- **Trend-chart gotcha:** Bookings trend AreaChart must use `dataKey="label"` (see §7.1).
- **Currency:** admin money formatting is GBP via `gbp()` in `OverviewTab`/`BranchesTab`.