# Paul Hair Studio — Next.js Site

Editorial luxury hair salon & haircare studio website: interactive home page, full services menu (category landing → category pages → service detail), gallery with filterable image grid, 3D coverflow testimonials, about page with stats marquee + team, appointments booking flow, and a luxury product cart.

Built with **Next.js 15 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS v4**, and **motion** (framer-motion). Animations are composed from a small shared primitive library (`src/components/ui/ScrollReveal.tsx`) plus a few scoped CSS files under `src/experience/`.

---

## Getting started

Requires Node 18.18+ and `pnpm`.

```bash
pnpm install      # install dependencies
pnpm dev          # start dev server on http://localhost:3010
pnpm build        # production build (next build)
pnpm start        # serve the production build on :3010
pnpm lint         # type-check only (tsc --noEmit)
```

> **Note:** `pnpm build` writes into `.next`, the same directory `next dev` runs from. Running a production build while the dev server is running **will** break the running dev session (stale chunk 404s / 500s). Stop the dev server first, or just restart it after a build.

---

## Project structure

```
src/                    source root (standard Next.js src/ layout)
  app/                  App Router routes (thin — wrap a page composition)
    page.tsx            /            — homepage (src/pages/HomePage.tsx)
    about/page.tsx      /about       — about page (src/sections/about/AboutPage.tsx)
    services/page.tsx   /services    — category landing grid
    services/[id]/page.tsx /services/<slug-or-id> — resolves category page OR service detail
    gallery/page.tsx    /gallery     — filterable image-grid page
    contact/page.tsx    /contact     — contact + locations + inline booking form
    layout.tsx          — root shell: fonts, metadata, Providers
    globals.css         — Tailwind v4, brand tokens, marquee, utilities
    api/                — route handlers (/api/content, /api/booking, /api/admin/*, …)
    admin/              — admin dashboard (login + content management)
  pages/                route-level compositions (HomePage, GalleryPage, ServicesPage)
  sections/
    home/               homepage sections (Hero, ServiceMenu, TeamSection, …)
    services/           services-route sections (ServicesCategories, ServiceDetailPage, …)
    about/              about page section (AboutPage)
    contact/            contact page section (ContactPage)
  components/           shared/reusable components
    booking/            shared booking flow (BookingModal, BookingForm, DatePickerField)
    cart/               CartDrawer, ProductModal, ProductBottleVisual
    layout/             Providers, Header, Footer, FloatingWidget
    ui/                 shared primitives (ScrollReveal)
  hooks/                client hooks shared across pages
    useSiteContent.ts   mirrors admin collections into the public site
  data/                 single source of truth static content
    salonData.ts        partners, products, press, testimonials, services, stylists, locations
    galleryData.ts      gallery items + filter categories
  experience/           scoped CSS for hero slider, service menu, service detail
  types.ts              shared TypeScript interfaces
  middleware.ts         auth guard for /admin routes + /api/admin

vercel.json             Vercel build config for Next.js
```

## Page & workflow map

| URL | Route | Purpose |
| --- | --- | --- |
| `/` | `src/app/page.tsx` | Homepage: Hero → PartnerBar → About → ServiceMenu → LookbookTrio → TeamSection → TestimonialGrid → VisitUs → Newsletter |
| `/about` | `src/app/about/page.tsx` | Stats marquee, story, philosophy, team grid (2-col), journey timeline, locations |
| `/services` | `src/app/services/page.tsx` | Heading + 6 category cards |
| `/services/<slug>` | `src/app/services/[id]/page.tsx` | Category page (all services in that category) **or** service detail, resolved by slug |
| `/gallery` | `src/app/gallery/page.tsx` | Heading → filter pills → fade grid |
| `/contact` | `src/app/contact/page.tsx` | Locations, hours, form, CTA |

### Booking / cart workflow

All state lives in `src/components/layout/Providers.tsx` (React context):

- **Book flow:** any "Book now" → `onSelectServiceForBooking(service)` → `BookingModal` opens pre-selected, styled by chosen service → user picks date/time/stylist → submits.
- **Cart flow:** product card → `ProductModal` → `onAddToCart(product)` → `CartDrawer` (quantity +/-, remove, clear). Cart count is shown in `Header` and the `FloatingWidget`.
- **Navigation:** `Header` uses App Router links; homepage section links smooth-scroll via the `Providers` `onNavigate` helper (`/?scrollTo=`).

---

## Services data & categories

Categories (`src/data/salonData.ts` → `SERVICES[].category`):
`Cut & Style`, `Style & Finish`, `Wash & Refresh`, `Color & Cut`, `Cut & Texture`, `Bridal & Occasion`.

- `/services` grid (`src/sections/services/ServicesCategories.tsx`) derives its cards automatically from the data.
- Category slugs are generated by `categorySlug()` (lowercased, non-alphanumerics → `-`).
- `/services/<slug>` is handled by `src/app/services/[id]/page.tsx`, which resolves the param to a category first, then falls back to a service id, else a 404.

## Styling conventions

- **Editorial headings:** `font-editorial` (Syne) with `font-black uppercase tracking-tight`.
- **Script accents:** `font-script` (Caveat); serif luxury: `font-serif-luxury` (Playfair).
- **Brand blush:** `--color-blush*` tokens defined in `src/app/globals.css`.
- **Background paper tone:** `bg-[#f7f5ee]` used across content pages.
- **Animations:** prefer the `ScrollReveal` / `SpringReveal` / `Parallax` primitives; use `motion/react` `AnimatePresence` for mounts/exits.

## Deployment

- Hosted on **Vercel**. `vercel.json` sets `buildCommand: pnpm build` and `outputDirectory: .next` (required — the account previously had Vite/`dist` defaults).
- Git remote: `git@github.com:Muhammad-Ansab-dev/Saloon-Website.git` (`main`).

## Structure notes

- `src/components/` holds all UI. Booking is consolidated under `src/components/booking/`:
  `BookingModal` (overlay chrome + confetti), `BookingForm` (the single reusable
  appointment form shared by the modal and the /contact page), and
  `DatePickerField` (custom calendar that opens downward).
- `src/hooks/useSiteContent.ts` is the shared client hook that mirrors admin-managed
  collections (`/api/content`) into the public site with static fallbacks.
- `src/lib/bookingTime.ts` centralises salon hours and date/time helpers so every
  booking surface stays consistent.
- `src/lib/store.ts` is the PostgreSQL content store (schema + seed + serialised
  writes) backing `/api/content`, `/api/booking`, `/api/availability` and the
  `/api/admin/*` endpoints.