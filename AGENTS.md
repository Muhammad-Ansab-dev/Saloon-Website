# AGENTS.md — Guidance for AI agents working in this repo

## Project at a glance
Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS v4 + motion (framer-motion). A luxury hair salon marketing site for Paul Hair Studio: homepage, services menu, gallery, about, contact, booking modal, product cart, and a password-protected admin dashboard backed by PostgreSQL.

## Commands
- Dev server: `pnpm dev` → **http://localhost:3010**
- Type-check only: `pnpm lint` (runs `tsc --noEmit`, strict)
- Production build: `pnpm build`
- Serve build: `pnpm start` (also :3010)
- Inspect the DB: `psql "postgres://salon:salon_dev_2026@localhost:5432/salon"`

## Workflow / practical rules
- **VERIFY with the dev server:** after edits, wait a few seconds and `curl -s http://localhost:3010/<route>` and grep for the expected markup. The HMR host is at :3010 (a separate Vite build exists on :3000 for a legacy project — do not touch it).
- **Do NOT delete or `rm -rf .next` while `next dev` is running.** A production `pnpm build` writes over `.next` and will break the running dev session (stale chunks → 500 / 404). If a build runs, the dev server must be restarted.
- **Do NOT kill the user's dev process** (`pkill -f next` etc.) — the dev server runs in the user's terminal (`pts/0`), except under the standing permission below.
- **Never print secrets** from `.env.local` (`DATABASE_URL` credentials, `ADMIN_*`, `CLOUDINARY_*`).
- **Never commit** unless the user explicitly asks.

## Environment
See `.env.example`. `.env*` is git-ignored except `.env.example`.
- `DATABASE_URL` — required in production; dev falls back to the local `salon` DB.
- `ADMIN_USERNAME` / `ADMIN_PASSWORD` / `ADMIN_SECRET` — required in production. Dev fallbacks: `admin` / `paul123` / `dev-secret-change-me`. In production the auth layer fails closed when these are unset.
- `BRANCH_ZURICH_USERNAME|PASSWORD` / `BRANCH_PARIS_USERNAME|PASSWORD` — optional. These only SEED the initial Zurich/Paris branch rows on first store init. Afterwards the Branches tab is the source of truth: branch rows (city, contacts, manager username/password) are created/edited/deleted in the DB via `/api/admin/branches`, and the DB row wins over the env var for a given slug. Dev fallbacks: `zurich`/`zurich123`, `paris`/`paris123` (fail-closed in production at seed time). A branch login lands on `/dashboard/branch/<slug>` and its session is scoped to that branch server-side.
- `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` (+ `CLOUDINARY_FOLDER`) — optional; when set, uploads go to Cloudinary, otherwise to `data/uploads/` served by `src/app/images/cms/[name]/route.ts`.

## Architecture notes
- **State:** global React context lives in `src/components/layout/Providers.tsx` (cart items, cart-open, booking modal state, pre-selected service, product modal) and is exposed via `useSite()` (`onBookNow`, `onSelectServiceForBooking`, `onOpenCart`, `onOpenProduct`, `onAddToCart`). Providers also hides all site chrome on `/dashboard` and resolves `/?scrollTo=<sectionId>` deep links.
- **Shell:** `src/app/layout.tsx` mounts `<Providers>` once → Header, Footer, FloatingWidget, CartDrawer, BookingModal, ProductModal are rendered there for every route (suppressed on `/dashboard`).
- **Folder layout:** `src/components/` is organised by responsibility:
  - `layout/` — chrome that ships on every route (Providers, Header, Footer, FloatingWidget)
  - `views/` — route-level compositions (HomePage, ServicesPage, GalleryPage, AboutPage) —
    NOTE: named `views/`, not `pages`, because `src/pages` is reserved by Next.js for the legacy Pages Router
  - `sections/<page>/` — sections grouped by the page they belong to (`home/`, `services/`, `about/`, `contact/`)
  - `booking/` — the shared booking flow (BookingModal, BookingForm, DatePickerField, TimeSlotDropdown)
  - `cart/` — CartDrawer, ProductModal, ProductBottleVisual
  - `dashboard/` — admin console tabs (OverviewTab, BookingTab, ServicesPanel, StylistsPanel, MediaPanel, BranchesTab, ImagePicker, DateField, AddBookingModal)
  - `ui/` — shared primitives (ScrollReveal/SpringReveal/Parallax) plus shadcn-style controls (button, card, badge, avatar, input, separator, tabs, dropdown-menu, chart)
- **Data:** static defaults live in `src/data/salonData.ts` (products, testimonials, services + media, stylists, locations, image-CMS maps) and `src/data/galleryData.ts` (categories, gallery items, editorial films + posters). Editing copy = editing these arrays. Types mirror it in `types.ts`.
- **Store (PostgreSQL):** `src/lib/store.ts` owns the schema, one-time seed from the static defaults, and serialised transactions. Collections: `services`, `stylists`, `gallery`, `site_images`, `categories`, `bookings`, `branches`. Public endpoints: `/api/content` (ships `branches` WITHOUT `managerUsername`/`managerPassword` — see `/api/content` route), `/api/availability`, `/api/booking`. Admin endpoints: `/api/admin/[col]` (GET/PUT/POST/PATCH/DELETE), `/api/admin/upload`, `/api/auth/login` (passes DB branch rows into `authenticate()` so store-managed branch logins work; branch slugs in the DB override env accounts).
- **Auth:** `src/lib/auth.ts` issues an HMAC-signed `httpOnly` session cookie (`ph_admin_session`, 12h) carrying a role claim — `admin` (superadmin → `/dashboard` and all branch consoles) or `branch` (branch manager → only `/dashboard/branch/<own>`). `authenticate()` accepts an optional `extraBranches` list (DB-rows) so store-created branch accounts verify; this keeps auth.ts Edge-safe (no pg import). `src/middleware.ts` protects `/dashboard` (redirect; branch managers are bounced to their own console) and `/api/admin/*` (401; branch requests are additionally scoped server-side in the `[col]` route — they can only read/mutate their own branch's bookings and stylists, and cannot touch services/gallery/siteImages/uploads — branch rows themselves are admin-only because they carry manager credentials). `src/app/api/auth/login` is rate-limited, compares every known account in constant time (`authenticate()`), and returns the canonical `redirect` per role.
- **Hooks:** `src/hooks/useSiteContent.ts` mirrors admin collections into the public site via `/api/content`, with static fallbacks.
- **Animation primitives:** `src/components/ui/ScrollReveal.tsx` exports `ScrollReveal` (scrub), `SpringReveal` (whileInView spring), `Parallax`. Prefer these over hand-rolled animation code. Section-specific CSS is scoped under `src/experience/`.

## Routing specifics

### Services workflow (3 steps)
1. `/services` → `src/views/ServicesPage.tsx` → `src/sections/services/ServicesCategories.tsx` (category cards grid).
2. `/services/<slug>` → `src/app/services/[id]/page.tsx` resolves param:
   - if it matches a category **slug** → `ServicesByCategory` (all services in that category)
   - else if it matches a service **id** (`srv-N`) → `ServiceDetailPage`
   - else → inline "page not found"
   - Category slugs are generated by `categorySlug()` in `ServicesCategories.tsx` (lowercase, non-alphanumeric → `-`). Service categories are derived from `src/data/salonData.ts`.
   - Both services routes wrap `getCollection` in try/catch and fall back to the static `SERVICES`.
3. Booking: any "Book now" button calls `onSelectServiceForBooking(service)` → opens `BookingModal` with that service pre-selected. The `/contact` page renders the same form inline as a card.

### Homepage section order
`src/views/HomePage.tsx`: Hero → PartnerBar → About → ServiceMenu → LookbookTrio → TeamSection → TestimonialGrid → VisitUs → NewsletterSubscribe.

### About page section order
`src/views/AboutPage.tsx` composes `src/sections/about/`: AboutHero → AboutStats → AboutStory → AboutFounder → AboutValues → AboutTeam → AboutTimeline → AboutCta. Each section is self-contained; editing one only touches its own file. The `/about` route entry is a thin server component that renders the view.

### Dashboard (`/dashboard`)
Protected by middleware. Left rail switches five tabs: Overview, Bookings, Services, Stylists, Media.
- **BookingTab** sub-views: `Analytics | All Bookings | Today Bookings`. The period tabs (Total/Daily/Weekly/Monthly/Yearly) render only in Analytics. Period semantics: total = all time; daily = last 30 days; weekly = last 8 weeks (Mondays); monthly = this year to date; yearly = current calendar year. The list view has search + date presets + custom single date + pagination, and an **Add Booking** modal (POST `/api/admin/bookings`).

## Styling conventions
- Headings: `font-editorial` (Syne, `font-black uppercase tracking-tight`).
- Script: `font-script`; luxury serif: `font-serif-luxury`.
- Brand pinks: `--color-blush*` tokens (`#fce8ee` family) in `src/app/globals.css`.
- Content page background: `bg-[#f7f5ee]`.
- The codebase has generous header comments per file — keep them accurate when renaming or repurposing a component. Do not add inline comments beyond that unless asked.

## Security posture (keep intact)
- `src/lib/auth.ts` fails closed in production and compares credentials and signatures in constant time; cookie is `Secure` in production.
- `/api/auth/login` is rate-limited (8 attempts/min/IP).
- `/api/admin/upload` accepts only a whitelist of raster image types (no SVG).
- `src/app/images/cms/[name]/route.ts` sends `X-Content-Type-Options: nosniff`.
- `next.config.ts` sets baseline security headers and `poweredByHeader: false`.

- **Dev-server lifecycle (standing permission, granted by the user):** I may
  kill/restart the running `pnpm dev` server (port 3010) whenever a middleware
  matcher change, `next.config.ts` change, or stale-client-chunk fix requires a
  restart — the user explicitly authorized this. Prefer targeted restarts over
  `pnpm build` (never build over a live dev session: it stomps `.next` and 500s
  routes). If I restart it, the user must be told it happened and that they
  should reload the browser tab.

## Gotchas / lessons learned (from this project's history)
- **stale-canvas pitfall:** both a Vite (`/home/arch/Projects/Hair-Salon-Website`) and this Next.js project exist. Edits must go into this directory; the Vite repo is used by nothing live now.
- **Vercel 404 build:** previously failed with "No Output Directory named dist" — fixed by `vercel.json` (`buildCommand: pnpm build`, `outputDirectory: .next`).
- **Testimonials:** the homepage uses `TestimonialGrid` (3D coverflow).
- **Hero:** `Hero` (`src/sections/home/Hero.tsx`) is active (other hero/stylist/shop/gallery experiment components were removed; `src/experience/` CSS was pruned to match).
- **Booking consistency:** the modal and `/contact` booking card must stay one widget — edit `src/components/booking/BookingForm.tsx` rather than forking the markup.
- **Dates:** always call `todayISO()` from `src/lib/bookingTime.ts`; never cache it at module scope (a long-lived server would freeze the date).
- **Admin endpoint naming:** `/api/admin/bookings` is served by the `[col]` catch-all route, not a dedicated folder.
