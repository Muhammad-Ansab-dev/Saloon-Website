// ─────────────────────────────────────────────────────────────
// store.ts — PostgreSQL-backed content store for the admin panel.
// Replaces the old JSON-file store (data/content.json); every
// collection lives in its own table and all reads go through the
// pool, so every route handler sees the latest committed writes
// (no module cache, no temp-file races).
// In plain words: this is the site's filing cabinet. The admin dashboard
// saves its content here (menu, team, gallery, images, bookings, branches)
// and the public site reads from here too. On first use it creates its own
// database tables and fills them with the starter content.
//
// Tables:
//   services(id, name, description, price, duration_minutes,
//            category, image, sort_order)
//   stylists(id, name, role, image, branch, sort_order)
//   gallery(id, image, alt, caption, category, sort_order)
//   site_images(image_key, image_url)
//   site_texts(text_key, text_value)
//   categories(name, stylists)
//   bookings(id, service_id, service_name, stylist_name, date,
//            time, client_name, client_email, client_phone,
//            status, created_at)
//   branches(slug, city, address, email, telephone, hours,
//            manager_username, manager_password, created_at)
// Schema is created idempotently on first use, then seeded once
// from the TS defaults in data/salonData.ts / galleryData.ts.
// Collections are replaced wholesale on save (DELETE + INSERT in a
// transaction) so admin "Save" semantics stay identical to before.
// Bookings: created as `pending` by /api/booking and confirmed manually
// by the admin; status changes go through a targeted UPDATE
// (updateBooking), not a full rewrite.
//   collections: services, stylists, gallery, bookings, siteImages, siteTexts, categories, branches
// ─────────────────────────────────────────────────────────────
import { Pool } from 'pg';
import {
  SERVICES,
  STYLISTS,
  SERVICE_IMAGE_BY_ID,
  STYLIST_IMAGE_BY_ID,
  SITE_IMAGES_DEFAULTS,
  SITE_TEXT_DEFAULTS,
  BRANCH_BY_STYLIST_ID,
  stylistBranch,
  LOCATIONS,
} from '../data/salonData';
import { branchAccount } from './auth';
import { todayISO } from './bookingTime';
import { GALLERY_ITEMS } from '../data/galleryData';

// Life cycle of a booking: 'pending' (just booked) → 'confirmed' by an admin →
// 'completed' when the appointment is done; overdue pending/confirmed bookings
// automatically become 'cancelled' (see cancelOverdueBookings below).
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

// A single appointment as stored/returned by the store, and the shape every
// booking screen (public form, admin tabs) works with.
export interface Booking {
  id: string;
  serviceId?: string;
  serviceName: string;
  stylistName: string;
  branch?: string;
  date: string;
  time: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  notes?: string;
  createdAt: string;
  status?: BookingStatus;
}

// Row shapes — each maps one-to-one to a database table, and the mapper
// functions further down convert snake_case DB columns into these camelCase JS
// objects the rest of the app consumes.
export type ServiceRow = {
  id: string;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  category: string;
  image: string;
};
export type StylistRow = { id: string; name: string; role: string; image: string; branch: string };
export type GalleryRow = {
  image: string;
  alt: string;
  caption: string;
  category: string;
};
export type SiteImageRow = { key: string; value: string };
export type SiteTextRow = { key: string; value: string };
export type CategoryRow = { name: string; stylists: string[] };
// A branch row includes its manager's login credentials — which is why branch
// data is only ever exposed through the admin APIs, never on the public site.
export type BranchRow = {
  slug: string;
  city: string;
  address: string;
  email: string;
  telephone: string;
  hours: string;
  managerUsername: string;
  managerPassword: string;
  createdAt: string;
};

// Every collection the store owns, keyed by the admin tab that edits it.
export type ContentCollections = {
  services: ServiceRow[];
  stylists: StylistRow[];
  gallery: GalleryRow[];
  bookings: Booking[];
  siteImages: SiteImageRow[];
  siteTexts: SiteTextRow[];
  categories: CategoryRow[];
  branches: BranchRow[];
};

// The starter content everything gets seeded from: the static arrays above,
// plus derived maps (image entries, category names, branch rows from LOCATIONS).
const DEFAULTS = {
  services: SERVICES,
  stylists: STYLISTS,
  gallery: GALLERY_ITEMS,
  bookings: [],
  siteImages: Object.entries(SITE_IMAGES_DEFAULTS).map(([key, value]) => ({ key, value })),
  siteTexts: Object.entries(SITE_TEXT_DEFAULTS).map(([key, value]) => ({ key, value })),
  // Categories are derived from the service menu's unique categories, each
  // starting out with no assigned stylists.
  categories: [...new Set(SERVICES.map((s) => s.category).filter(Boolean))].map((name) => ({ name, stylists: [] })),
  branches: LOCATIONS.map((loc) => {
    const slug = loc.city.toLowerCase();
    const acc = branchAccount(slug);
    return {
      slug,
      city: loc.city,
      address: loc.address,
      email: loc.email,
      telephone: loc.telephone,
      hours: loc.hours,
      managerUsername: acc.username,
      managerPassword: acc.password,
      createdAt: '',
    };
  }),
} as const;

// ── Pool (shared across route bundles via globalThis — a module-level
// pool would be duplicated per route in dev and exhaust connections) ──
const POOL_KEY = '__contentStorePgPool';
type GlobalWithPool = typeof globalThis & {
  [POOL_KEY]?: Pool;
};

function getPool(): Pool {
  const g = globalThis as GlobalWithPool;
  // Create the pool once (keyed on globalThis) and reuse it forever after.
  if (!g[POOL_KEY]) {
    const connectionString =
      process.env.DATABASE_URL ??
      (process.env.NODE_ENV === 'production'
        ? ''
        : 'postgres://salon:salon_dev_2026@localhost:5432/salon');
    if (!connectionString) {
      throw new Error('DATABASE_URL is not configured');
    }
    g[POOL_KEY] = new Pool({ connectionString });
  }
  return g[POOL_KEY];
}

// Maps each collection key to the physical table that stores it, converting
// getCollection/setCollection calls into the right SQL.
const TABLE_BY_COLLECTION: Record<
  keyof ContentCollections,
  string
> = {
  services: 'services',
  stylists: 'stylists',
  gallery: 'gallery',
  bookings: 'bookings',
  siteImages: 'site_images',
  siteTexts: 'site_texts',
  categories: 'categories',
  branches: 'branches',
};

// ── Schema + one-time seed ──
const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL DEFAULT 0,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS stylists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  branch TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS gallery (
  id SERIAL PRIMARY KEY,
  image TEXT NOT NULL DEFAULT '',
  alt TEXT NOT NULL DEFAULT '',
  caption TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS site_images (
  image_key TEXT PRIMARY KEY,
  image_url TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS site_texts (
  text_key TEXT PRIMARY KEY,
  text_value TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS categories (
  name TEXT PRIMARY KEY,
  stylists TEXT NOT NULL DEFAULT '[]'
);
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  service_id TEXT,
  service_name TEXT NOT NULL DEFAULT '',
  stylist_name TEXT NOT NULL DEFAULT '',
  branch TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL DEFAULT '',
  time TEXT NOT NULL DEFAULT '',
  client_name TEXT NOT NULL DEFAULT '',
  client_email TEXT NOT NULL DEFAULT '',
  client_phone TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS branches (
  slug TEXT PRIMARY KEY,
  city TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  telephone TEXT NOT NULL DEFAULT '',
  hours TEXT NOT NULL DEFAULT '',
  manager_username TEXT NOT NULL DEFAULT '',
  manager_password TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

let initPromise: Promise<void> | null = null;

// Create the tables if missing and seed the starter content on first run.
// Runs once per process (the initPromise guard) so concurrent route bundles
// can't race each other, and is safe to call repeatedly. After a failure the
// guard resets so a later request can retry.
async function ensureSchema(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      const pool = getPool();
      await pool.query(SCHEMA_SQL);
      // Idempotent "migrations": add columns/defaults that newer code expects,
      // even on tables created by an older version of the store. Safe to re-run.
      await pool.query(
        `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'`
      );
      await pool.query(
        `ALTER TABLE bookings ALTER COLUMN status SET DEFAULT 'pending'`
      );
      await pool.query(
        `ALTER TABLE services ADD COLUMN IF NOT EXISTS image TEXT NOT NULL DEFAULT ''`
      );
      await pool.query(
        `ALTER TABLE stylists ADD COLUMN IF NOT EXISTS image TEXT NOT NULL DEFAULT ''`
      );
      await pool.query(
        `ALTER TABLE stylists ADD COLUMN IF NOT EXISTS branch TEXT NOT NULL DEFAULT ''`
      );
      await pool.query(
        `ALTER TABLE stylists ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0`
      );
      await pool.query(
        `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS branch TEXT NOT NULL DEFAULT ''`
      );
      // Backfill branch on rows that predate the column (keeps seeded
      // stylists correctly assigned to their branch without re-running
      // the one-time seed).
      for (const [id, branch] of Object.entries(BRANCH_BY_STYLIST_ID)) {
        await pool.query(
          `UPDATE stylists SET branch = $2 WHERE id = $1 AND branch = ''`,
          [id, branch]
        );
      }
      // Seed the named image slots + backfill empty image columns from the
      // static defaults — idempotent, never clobbers an admin override.
      for (const [key, value] of Object.entries(SITE_IMAGES_DEFAULTS)) {
        await pool.query(
          `INSERT INTO site_images (image_key, image_url) VALUES ($1,$2)
           ON CONFLICT (image_key) DO NOTHING`,
          [key, value]
        );
      }
      // Seed the editable text slots (hero copy) — admin edits are never
      // clobbered because ON CONFLICT keeps existing rows untouched.
      for (const [key, value] of Object.entries(SITE_TEXT_DEFAULTS)) {
        await pool.query(
          `INSERT INTO site_texts (text_key, text_value) VALUES ($1,$2)
           ON CONFLICT (text_key) DO NOTHING`,
          [key, value]
        );
      }
      for (const [id, image] of Object.entries(SERVICE_IMAGE_BY_ID)) {
        await pool.query(
          `UPDATE services SET image = $2 WHERE id = $1 AND image = ''`,
          [id, image]
        );
      }
      for (const [id, image] of Object.entries(STYLIST_IMAGE_BY_ID)) {
        await pool.query(
          `UPDATE stylists SET image = $2 WHERE id = $1 AND image = ''`,
          [id, image]
        );
      }
      await pool.query(
        `ALTER TABLE categories ADD COLUMN IF NOT EXISTS stylists TEXT NOT NULL DEFAULT '[]'`
      );
      // Seed categories from the services menu if the table is empty
      // (covers pre-existing DBs that predate the categories collection).
      const { rows: catRows } = await pool.query('SELECT COUNT(*)::int AS n FROM categories');
      if (catRows[0].n === 0) {
        const { rows: menu } = await pool.query('SELECT DISTINCT category FROM services WHERE category <> \'\'');
        for (const r of menu) {
          await pool.query(
            `INSERT INTO categories (name, stylists) VALUES ($1, '[]') ON CONFLICT (name) DO NOTHING`,
            [r.category]
          );
        }
      }
      // Seed the starter branches (Zurich, Paris) from LOCATIONS + the
      // env/fallback manager credentials. One-time only — admin edits to
      // a branch row (including its password) are never overwritten,
      // and DB rows are the source of truth for branch logins.
      for (const b of DEFAULTS.branches) {
        await pool.query(
          `INSERT INTO branches
             (slug, city, address, email, telephone, hours, manager_username, manager_password, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8, now())
           ON CONFLICT (slug) DO NOTHING`,
          [b.slug, b.city, b.address, b.email, b.telephone, b.hours, b.managerUsername, b.managerPassword]
        );
      }
      const { rows } = await pool.query(
        'SELECT COUNT(*)::int AS n FROM services'
      );
      if (rows[0].n === 0) {
        await seedFromDefaults();
      }
    })().catch((err) => {
      // Reset so a later request can retry after a transient failure
      // (otherwise every subsequent call would await the same rejection).
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}

// Insert the static starter content (services, stylists, gallery, branches)
// into a brand-new database. Only called when the services table is empty, so
// a fresh install is fully populated; the whole run happens in one transaction
// so any failure rolls everything back and leaves the DB untouched.
async function seedFromDefaults(): Promise<void> {
  const pool = getPool();
  const cx = await pool.connect();
  try {
    await cx.query('BEGIN');
    // services + stylists, one row each
    for (let i = 0; i < DEFAULTS.services.length; i++) {
      const s = DEFAULTS.services[i];
      await cx.query(
        `INSERT INTO services
           (id, name, description, price, duration_minutes, category, image, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [s.id, s.name, s.description, s.price, s.durationMinutes, s.category, SERVICE_IMAGE_BY_ID[s.id] ?? '', i]
      );
    }
    for (let i = 0; i < DEFAULTS.stylists.length; i++) {
      const st = DEFAULTS.stylists[i];
      await cx.query(
        `INSERT INTO stylists (id, name, role, image, branch, sort_order) VALUES ($1,$2,$3,$4,$5,$6)`,
        [st.id, st.name, st.role, STYLIST_IMAGE_BY_ID[st.id] ?? '', stylistBranch(st), i]
      );
    }
    for (let i = 0; i < DEFAULTS.gallery.length; i++) {
      const g = DEFAULTS.gallery[i];
      await cx.query(
        `INSERT INTO gallery (image, alt, caption, category, sort_order)
         VALUES ($1,$2,$3,$4,$5)`,
        [g.image, g.alt, g.caption, g.category, i]
      );
    }
    for (const b of DEFAULTS.branches) {
      await cx.query(
        `INSERT INTO branches
           (slug, city, address, email, telephone, hours, manager_username, manager_password, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8, now())`,
        [b.slug, b.city, b.address, b.email, b.telephone, b.hours, b.managerUsername, b.managerPassword]
      );
    }
    await cx.query('COMMIT');
  } catch (err) {
    await cx.query('ROLLBACK');
    throw err;
  } finally {
    cx.release();
  }
}

// Row mappers: each converts one snake_case database row into the camelCase
// shape defined by the matching Row type above. Every optional-ish column falls
// back to a sensible empty value so the UI never sees undefined.
function mapService(row: Record<string, unknown>): ServiceRow {
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    description: String(row.description ?? ''),
    price: Number(row.price ?? 0),
    durationMinutes: Number(row.duration_minutes ?? 0),
    category: String(row.category ?? ''),
    image: String(row.image ?? ''),
  };
}

function mapStylist(row: Record<string, unknown>): StylistRow {
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    role: String(row.role ?? ''),
    image: String(row.image ?? ''),
    branch: String(row.branch ?? ''),
  };
}

function mapGallery(row: Record<string, unknown>): GalleryRow {
  return {
    image: String(row.image ?? ''),
    alt: String(row.alt ?? ''),
    caption: String(row.caption ?? ''),
    category: String(row.category ?? ''),
  };
}

function mapSiteImage(row: Record<string, unknown>): SiteImageRow {
  return {
    key: String(row.image_key ?? ''),
    value: String(row.image_url ?? ''),
  };
}

function mapSiteText(row: Record<string, unknown>): SiteTextRow {
  return {
    key: String(row.text_key ?? ''),
    value: String(row.text_value ?? ''),
  };
}

function mapBranch(row: Record<string, unknown>): BranchRow {
  return {
    slug: String(row.slug ?? ''),
    city: String(row.city ?? ''),
    address: String(row.address ?? ''),
    email: String(row.email ?? ''),
    telephone: String(row.telephone ?? ''),
    hours: String(row.hours ?? ''),
    managerUsername: String(row.manager_username ?? ''),
    managerPassword: String(row.manager_password ?? ''),
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at ?? ''),
  };
}

function mapCategory(row: Record<string, unknown>): CategoryRow {
  let stylists: string[] = [];
  const raw = String(row.stylists ?? '');
  // The stylists column stores a JSON array; parse it defensively (bad JSON
  // simply yields an empty list).
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) stylists = parsed.filter((x) => typeof x === 'string');
  } catch {
    // keep empty
  }
  return { name: String(row.name ?? ''), stylists };
}

function mapBooking(row: Record<string, unknown>): Booking {
  const status = String(row.status ?? '');
  // Normalise the status string; anything unexpected becomes the default
  // 'pending' so older rows always carry a valid status.
  return {
    id: String(row.id),
    serviceId: row.service_id ? String(row.service_id) : undefined,
    serviceName: String(row.service_name ?? ''),
    stylistName: String(row.stylist_name ?? ''),
    branch: row.branch ? String(row.branch) : undefined,
    date: String(row.date ?? ''),
    time: String(row.time ?? ''),
    clientName: String(row.client_name ?? ''),
    clientEmail: String(row.client_email ?? ''),
    clientPhone: String(row.client_phone ?? ''),
    notes: String(row.notes ?? '') || undefined,
    status:
      status === 'confirmed' || status === 'completed' || status === 'cancelled'
        ? status
        : 'pending',
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at ?? ''),
  };
}

// Read one collection from its table with a stable ordering. Keyed collections
// have their own SELECT; the default path orders by sort_order then id.
// Params: key — which collection to read. Returns the mapped rows in JS shape.
async function queryCollection<K extends keyof ContentCollections>(
  key: K
): Promise<ContentCollections[K]> {
  await ensureSchema();
  const pool = getPool();
  const table = TABLE_BY_COLLECTION[key];

  if (key === 'bookings') {
    const { rows } = await pool.query(
      `SELECT id, service_id, service_name, stylist_name, branch, date, time,
              client_name, client_email, client_phone, notes, status, created_at
       FROM bookings ORDER BY created_at DESC, id`
    );
    return (rows.map(mapBooking) as unknown) as ContentCollections[K];
  }

  if (key === 'siteImages') {
    const { rows } = await pool.query(
      `SELECT image_key, image_url FROM site_images ORDER BY image_key ASC`
    );
    return (rows.map(mapSiteImage) as unknown) as ContentCollections[K];
  }

  if (key === 'siteTexts') {
    const { rows } = await pool.query(
      `SELECT text_key, text_value FROM site_texts ORDER BY text_key ASC`
    );
    return (rows.map(mapSiteText) as unknown) as ContentCollections[K];
  }

  if (key === 'categories') {
    const { rows } = await pool.query(
      `SELECT name, stylists FROM categories WHERE name <> '' ORDER BY name ASC`
    );
    return (rows.map(mapCategory) as unknown) as ContentCollections[K];
  }

  if (key === 'branches') {
    const { rows } = await pool.query(
      `SELECT slug, city, address, email, telephone, hours,
              manager_username, manager_password, created_at
       FROM branches ORDER BY created_at ASC, slug ASC`
    );
    return (rows.map(mapBranch) as unknown) as ContentCollections[K];
  }

  const { rows } = await pool.query(
    `SELECT * FROM ${table} ORDER BY sort_order ASC, id ASC`
  );

  if (key === 'services') {
    return (rows.map(mapService) as unknown) as ContentCollections[K];
  }
  if (key === 'stylists') {
    return (rows.map(mapStylist) as unknown) as ContentCollections[K];
  }
  return (rows.map(mapGallery) as unknown) as ContentCollections[K];
}

// ── Serial write queue (shared across route bundles) ──
const Q_KEY = '__contentStoreWriteFlow';
type GlobalWithFlow = typeof globalThis & { [Q_KEY]?: Promise<unknown> };

// Queue `op` behind whatever write is currently running and return its result.
// Each new operation is chained onto the last one, so writes complete strictly
// in the order they arrive and never run at the same time. Params: op — a
// function that performs one write. Returns op's promise/result.
function withWriteLock<T>(op: () => Promise<T>): Promise<T> {
  const g = globalThis as GlobalWithFlow;
  const prev = g[Q_KEY] ?? Promise.resolve();
  const next = prev.then(op, op);
  g[Q_KEY] = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

// Read one collection by key (e.g. 'services'). Params: key — the collection
// to read. Returns the collection's rows in their JS shape.
export async function getCollection<K extends keyof ContentCollections>(
  key: K
): Promise<ContentCollections[K]> {
  return queryCollection(key);
}

// Replace one collection wholesale inside a transaction. Runs through the
// serial write queue so concurrent saves cannot interleave. Params: key — the
// collection to overwrite; value — its complete new contents.
export async function setCollection<K extends keyof ContentCollections>(
  key: K,
  value: ContentCollections[K]
): Promise<void> {
  await ensureSchema();
  await withWriteLock(() => replaceCollection(key, value));
}

// Update one booking field in place (a targeted UPDATE, no full-table rewrite).
// Returns the number of rows affected — 0 means "no booking with that id".
// Runs through the serial write queue so it never interleaves with a wholesale
// save. New bookings arrive as 'pending' (see /api/booking); admins confirm,
// complete, or cancel them here.
export async function updateBooking(
  id: string,
  patch: { status?: BookingStatus }
): Promise<number> {
  await ensureSchema();
  const pool = getPool();
  let affected = 0;
  await withWriteLock(async () => {
    if (patch.status) {
      const res = await pool.query('UPDATE bookings SET status = $1 WHERE id = $2', [
        patch.status,
        id,
      ]);
      affected = res.rowCount ?? 0;
    }
  });
  return affected;
}

// Auto-cancel bookings whose date has already passed: pending/confirmed rows
// with a date earlier than today become 'cancelled'. Called from GET
// /api/admin/bookings so every dashboard load sweeps the table. Returns the
// number of rows it cancelled.
export async function cancelOverdueBookings(): Promise<number> {
  await ensureSchema();
  const pool = getPool();
  const today = todayISO();
  let affected = 0;
  await withWriteLock(async () => {
    const res = await pool.query(
      `UPDATE bookings SET status = 'cancelled'
        WHERE status IN ('pending','confirmed') AND date < $1`,
      [today]
    );
    affected = res.rowCount ?? 0;
  });
  return affected;
}

// Core replace-one-collection logic (must be called while holding the lock —
// the caller, setCollection or updateContent, is inside withWriteLock). Uses a
// transaction so a failure rolls the table back to its previous state.
async function replaceCollection<K extends keyof ContentCollections>(
  key: K,
  value: ContentCollections[K]
): Promise<void> {
  const pool = getPool();
  const table = TABLE_BY_COLLECTION[key];
  const cx = await pool.connect();
  try {
    await cx.query('BEGIN');

    if (key === 'services') {
      await cx.query('DELETE FROM services');
      const rows = value as unknown as ServiceRow[];
      for (let i = 0; i < rows.length; i++) {
        const s = rows[i];
        await cx.query(
          `INSERT INTO services
             (id, name, description, price, duration_minutes, category, image, sort_order)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [s.id, s.name, s.description, s.price, s.durationMinutes, s.category, s.image ?? '', i]
        );
      }
    } else if (key === 'stylists') {
      await cx.query('DELETE FROM stylists');
      const rows = value as unknown as StylistRow[];
      for (let i = 0; i < rows.length; i++) {
        const st = rows[i];
        await cx.query(
          `INSERT INTO stylists (id, name, role, image, branch, sort_order) VALUES ($1,$2,$3,$4,$5,$6)`,
          [st.id, st.name, st.role, st.image ?? '', st.branch ?? '', i]
        );
      }
    } else if (key === 'gallery') {
      await cx.query('DELETE FROM gallery');
      const rows = value as unknown as GalleryRow[];
      for (let i = 0; i < rows.length; i++) {
        const g = rows[i];
        await cx.query(
          `INSERT INTO gallery (image, alt, caption, category, sort_order)
           VALUES ($1,$2,$3,$4,$5)`,
          [g.image, g.alt, g.caption, g.category, i]
        );
      }
    } else if (key === 'siteImages') {
      await cx.query('DELETE FROM site_images');
      const rows = value as unknown as SiteImageRow[];
      for (let i = 0; i < rows.length; i++) {
        const img = rows[i];
        await cx.query(
          `INSERT INTO site_images (image_key, image_url) VALUES ($1,$2)`,
          [img.key, img.value ?? '']
        );
      }
    } else if (key === 'siteTexts') {
      await cx.query('DELETE FROM site_texts');
      const rows = value as unknown as SiteTextRow[];
      for (let i = 0; i < rows.length; i++) {
        const t = rows[i];
        await cx.query(
          `INSERT INTO site_texts (text_key, text_value) VALUES ($1,$2)`,
          [t.key, t.value ?? '']
        );
      }
    } else if (key === 'categories') {
      await cx.query('DELETE FROM categories');
      const rows = value as unknown as CategoryRow[];
      for (const cat of rows) {
        if (!cat.name) continue;
        await cx.query(`INSERT INTO categories (name, stylists) VALUES ($1, $2)`, [
          cat.name,
          JSON.stringify(cat.stylists ?? []),
        ]);
      }
    } else if (key === 'branches') {
      await cx.query('DELETE FROM branches');
      const rows = value as unknown as BranchRow[];
      for (const b of rows) {
        if (!b.slug) continue;
        await cx.query(
          `INSERT INTO branches
             (slug, city, address, email, telephone, hours, manager_username, manager_password, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [b.slug, b.city, b.address, b.email, b.telephone, b.hours, b.managerUsername, b.managerPassword, b.createdAt ?? new Date().toISOString()]
        );
      }
    } else {
      // bookings: read-only in admin; allow replace for parity
      await cx.query('DELETE FROM bookings');
      const rows = value as unknown as Booking[];
      for (let i = 0; i < rows.length; i++) {
        const b = rows[i];
        await cx.query(
          `INSERT INTO bookings
             (id, service_id, service_name, stylist_name, branch, date, time,
              client_name, client_email, client_phone, notes, status, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
          [
            b.id,
            b.serviceId ?? null,
            b.serviceName,
            b.stylistName,
            b.branch ?? '',
            b.date,
            b.time,
            b.clientName,
            b.clientEmail,
            b.clientPhone,
            b.notes ?? '',
            b.status ?? 'pending',
            new Date(b.createdAt ?? Date.now()),
          ]
        );
      }
    }

    await cx.query('COMMIT');
  } catch (err) {
    await cx.query('ROLLBACK');
    throw err;
  } finally {
    cx.release();
  }
}

// Run a mutation as one serialised read-modify-write: `fn` is handed the full
// current content and returns the new content to persist. Because everything
// runs inside the write lock, concurrent callers cannot clobber each other.
export async function updateContent(
  fn: (current: ContentCollections) => ContentCollections
): Promise<void> {
  await ensureSchema();
  await withWriteLock(async () => {
    const [services, stylists, gallery, bookings, siteImages, siteTexts, categories, branches] = await Promise.all([
      getCollection('services'),
      getCollection('stylists'),
      getCollection('gallery'),
      getCollection('bookings'),
      getCollection('siteImages'),
      getCollection('siteTexts'),
      getCollection('categories'),
      getCollection('branches'),
    ]);
    const next = fn({ services, stylists, gallery, bookings, siteImages, siteTexts, categories, branches });
    if (next !== undefined) {
      // Persist only the collections that actually changed.
      if (next.services !== services) await replaceCollection('services', next.services);
      if (next.stylists !== stylists) await replaceCollection('stylists', next.stylists);
      if (next.gallery !== gallery) await replaceCollection('gallery', next.gallery);
      if (next.bookings !== bookings) await replaceCollection('bookings', next.bookings);
      if (next.siteImages !== siteImages) await replaceCollection('siteImages', next.siteImages);
      if (next.siteTexts !== siteTexts) await replaceCollection('siteTexts', next.siteTexts);
      if (next.categories !== categories) await replaceCollection('categories', next.categories);
      if (next.branches !== branches) await replaceCollection('branches', next.branches);
    }
  });
}

// Read all eight collections at once into a single ContentCollections object
// (used by updateContent; also exposed as the public read-all API).
export async function getContent(): Promise<ContentCollections> {
  const [services, stylists, gallery, bookings, siteImages, siteTexts, categories, branches] = await Promise.all([
    getCollection('services'),
    getCollection('stylists'),
    getCollection('gallery'),
    getCollection('bookings'),
    getCollection('siteImages'),
    getCollection('siteTexts'),
    getCollection('categories'),
    getCollection('branches'),
  ]);
  return { services, stylists, gallery, bookings, siteImages, siteTexts, categories, branches };
}

// Reset one collection back to its seed defaults (a "restore original" action
// in the admin panel). Params: key — the collection to restore.
export async function resetCollection<K extends keyof ContentCollections>(
  key: K
): Promise<void> {
  await setCollection(key, (DEFAULTS[key] as unknown) as ContentCollections[K]);
}

// The canonical collection names, in the same order as ContentCollections.
// Used by admin routes and the reset action to enumerate everything the store
// manages.
export const COLLECTION_KEYS = ['services', 'stylists', 'gallery', 'bookings', 'siteImages', 'siteTexts', 'categories', 'branches'] as const;