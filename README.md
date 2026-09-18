# Paul Hair Studio — Next.js Site

Editorial luxury hair salon & haircare studio website: interactive home page, full services menu (category landing → category pages → service detail), gallery with a filterable image grid, 3D coverflow testimonials, about page, appointments booking flow, a luxury product cart, and a password-protected admin dashboard backed by PostgreSQL.

Built with **Next.js 15 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS v4**, and **motion** (framer-motion).

> `src/views/` holds route-level compositions. Never rename it to `pages` — `src/pages` is reserved by Next.js for the legacy Pages Router and breaks the build.

---

## Getting started

Requires Node 18.18+, `pnpm`, and a PostgreSQL database.

```bash
pnpm install      # install dependencies
cp .env.example .env.local   # then fill in the values (see below)
pnpm dev          # dev server on http://localhost:3010
pnpm build        # production build (next build)
pnpm start        # serve the production build on :3010
pnpm lint         # type-check only (tsc --noEmit)
```

> **Note:** `pnpm build` writes into `.next`, the same directory `next dev` runs from. Running a production build while the dev server is running **will** break the running dev session (stale chunk 404s / 500s). Stop the dev server first, or restart it after a build.

### Environment variables

See `.env.example` for the full list.

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Production | PostgreSQL connection string. In development it falls back to `postgres://salon:salon_dev_2026@localhost:5432/salon`. |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Production | Dashboard credentials. Dev fallbacks: `admin` / `paul123`. |
| `ADMIN_SECRET` | Production | HMAC secret for the session cookie. Dev fallback only; generate one with `openssl rand -hex 32`. |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Optional | When all three are set, admin uploads go to Cloudinary; otherwise files are stored in `data/uploads/`. |
| `CLOUDINARY_FOLDER` | Optional | Cloudinary folder name (default `hair-salon`). |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Optional | SMTP credentials for booking confirmation emails (`smtp.gmail.com` + a Gmail App Password works out of the box). Unset = no emails sent. |
| `MAIL_FROM` | Optional | `From` header for confirmation emails (default `Paul Hair Studio <SMTP_USER>`). |

In production the auth layer **fails closed**: without `ADMIN_USERNAME`, `ADMIN_PASSWORD` and `ADMIN_SECRET`, login can never succeed and no session token verifies.

The first request to any content endpoint creates the tables and seeds them from the static defaults in `src/data/`.

---

## Project structure

```
src/                    source root (standard Next.js src/ layout)
  app/                  App Router routes (thin — wrap a page composition)
    page.tsx            /            — homepage (src/views/HomePage.tsx)
    about/page.tsx      /about
    services/page.tsx   /services    — category landing grid
    services/[id]/page.tsx /services/<slug-or-id> — category page OR service detail
    gallery/page.tsx    /gallery
    contact/page.tsx    /contact     — locations + inline booking form
    dashboard/page.tsx  /dashboard   — admin console (5 tabs)
    dashboard/login/    /dashboard/login
    layout.tsx          — root shell: fonts, metadata, Providers
    globals.css         — Tailwind v4, brand tokens, marquee, utilities
    api/                — route handlers (content, booking, availability, admin, auth, upload)
    images/cms/[name]/  — streams runtime uploads from data/uploads
  views/                route-level compositions (HomePage, ServicesPage, GalleryPage, AboutPage)
  sections/
    home/ services/ about/ contact/   sections grouped by the page they belong to
      about/            AboutHero, AboutStats, AboutStory, AboutFounder, AboutValues, AboutTeam, AboutTimeline, AboutCta
  components/
    layout/             Providers, Header, Footer, FloatingWidget
    booking/            BookingModal, BookingForm, DatePickerField, TimeSlotDropdown
    cart/               CartDrawer, ProductModal, ProductBottleVisual
    dashboard/          OverviewTab, BookingTab, ServicesPanel, StylistsPanel, MediaPanel, …
    ui/                 shared primitives (ScrollReveal + shadcn-style controls)
  hooks/                useSiteContent.ts — mirrors admin collections into the public site
  lib/                  store.ts (PostgreSQL), auth.ts, bookingTime.ts, cloudinary.ts, utils.ts
  data/                 salonData.ts + galleryData.ts (static source of truth)
  experience/           scoped CSS for hero slider, service menu, service detail
  types.ts              shared TypeScript interfaces
  middleware.ts         auth guard for /dashboard + /api/admin/*
vercel.json             Vercel build config for Next.js
```

## Page & workflow map

| URL | Route | Purpose |
| --- | --- | --- |
| `/` | `src/app/page.tsx` | Homepage: Hero → PartnerBar → About → ServiceMenu → LookbookTrio → TeamSection → TestimonialGrid → VisitUs → Newsletter |
| `/about` | `src/app/about/page.tsx` | Stats marquee, story, philosophy, team grid, journey timeline, locations |
| `/services` | `src/app/services/page.tsx` | Heading + category cards (derived from the services data) |
| `/services/<slug>` | `src/app/services/[id]/page.tsx` | Category page **or** service detail, resolved by slug/id |
| `/gallery` | `src/app/gallery/page.tsx` | Heading → filter pills → fade grid → editorial films |
| `/contact` | `src/app/contact/page.tsx` | Locations, hours, inline booking form |
| `/dashboard` | `src/app/dashboard/page.tsx` | Admin console (protected) |
| `/dashboard/login` | `src/app/dashboard/login/page.tsx` | Admin sign-in |

### Booking / cart workflow

All shared site state lives in `src/components/layout/Providers.tsx` (React context, exposed via `useSite()`):

- **Book flow:** any "Book now" → `onSelectServiceForBooking(service)` → `BookingModal` opens with that service pre-selected → user picks date/time/stylist → submits. The `/contact` page renders the same `BookingForm` inline as a card.
- **Cart flow:** product card → `onOpenProduct` → `ProductModal` → `onAddToCart` → `CartDrawer`. The `Header` shows a bag button with a live item count; `onOpenCart` opens the drawer.
- **Navigation:** `Header` uses App Router links. From a non-home route, section links navigate to `/?scrollTo=<sectionId>`, which `Providers` reads on arrival, smooth-scrolls, then strips the query param.

### Admin dashboard

The dashboard is reachable at `/dashboard` and guarded by `src/middleware.ts`. Tabs:

- **Overview** — revenue, appointments, clients and average booking value with period tabs (Total / Daily / Weekly / Monthly / Yearly).
- **Bookings** — `Analytics | All Bookings | Today Bookings`, period tabs (analytics only), search + date filters, pagination, status edits, delete, and an **Add Booking** modal.
- **Services / Stylists / Media** — full CRUD over the PostgreSQL content store, including image uploads.

---

## Data & the content store

- **Static defaults:** `src/data/salonData.ts` (products, testimonials, services + media, stylists, locations, image-CMS maps) and `src/data/galleryData.ts` (categories, gallery items, editorial films). Editing copy starts here.
- **Runtime data:** `src/lib/store.ts` is the PostgreSQL content store (schema, one-time seed from the static defaults, serialised transactions). Collections: `services`, `stylists`, `gallery`, `site_images`, `categories`, `bookings`.
- **Public endpoints:** `/api/content` (site data), `/api/availability` (taken slots), `/api/booking` (submit).
- **Protected endpoints:** `/api/admin/[col]` (GET/PUT/POST/PATCH/DELETE), `/api/admin/bookings`, `/api/admin/upload`, `/api/auth/login`.

## Services data & categories

Categories (`src/data/salonData.ts` → `SERVICES[].category`):
`Cut & Style`, `Style & Finish`, `Wash & Refresh`, `Color & Cut`, `Cut & Texture`, `Bridal & Occasion`.

- The `/services` grid derives its cards automatically from the data.
- Category slugs are generated by `categorySlug()` (lowercased, non-alphanumerics → `-`).
- `/services/<slug>` resolves the param to a category first, then falls back to a service id, else renders a "page not found" state.

## Styling conventions

- **Editorial headings:** `font-editorial` (Syne) with `font-black uppercase tracking-tight`.
- **Script accents:** `font-script` (Caveat); luxury serif: `font-serif-luxury` (Playfair).
- **Brand blush:** `--color-blush*` tokens defined in `src/app/globals.css`.
- **Content page background:** `bg-[#f7f5ee]`.
- **Animations:** prefer the `ScrollReveal` / `SpringReveal` / `Parallax` primitives; use `motion/react` `AnimatePresence` for mounts/exits.

## Security

- Session cookie is `httpOnly`, `SameSite=Lax`, and `Secure` in production; login is rate-limited (8 attempts/min/IP).
- Baseline security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, HSTS, `Permissions-Policy`) are set in `next.config.ts`; `X-Powered-By` is disabled.
- Uploads accept a strict whitelist of raster image types (no SVG) and are served with `X-Content-Type-Options: nosniff`.

## Deployment

- Hosted on **Vercel**. `vercel.json` sets `buildCommand: pnpm build` and `outputDirectory: .next`.
- Set `DATABASE_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_SECRET` (and Cloudinary vars if used) in the project environment.
- Git remote: `git@github.com:Muhammad-Ansab-dev/Saloon-Website.git` (`main`).
