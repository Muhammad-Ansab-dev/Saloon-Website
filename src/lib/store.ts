// ─────────────────────────────────────────────────────────────
// store.ts — PostgreSQL-backed content store for the admin panel.
// Replaces the old JSON-file store (data/content.json); every
// collection lives in its own table and all reads go through the
// pool, so every route handler sees the latest committed writes
// (no module cache, no temp-file races).
//
// Tables:
//   services(id, name, description, price, duration_minutes,
//            category, sort_order)
//   stylists(id, name, role, sort_order)
//   gallery(id, image, alt, caption, category, sort_order)
//   bookings(id, service_id, service_name, stylist_name, date,
//            time, client_name, client_email, client_phone,
//            notes, created_at)
//
// Schema is created idempotently on first use, then seeded once
// from the TS defaults in data/salonData.ts / galleryData.ts.
// Collections are replaced wholesale on save (DELETE + INSERT in a
// transaction) so admin "Save" semantics stay identical to before.
//   collections: services, stylists, gallery, bookings, brands
// ─────────────────────────────────────────────────────────────
import { Pool } from 'pg';
import { SERVICES, STYLISTS } from '../data/salonData';
import { GALLERY_ITEMS } from '../data/galleryData';

export interface Booking {
  id: string;
  serviceId?: string;
  serviceName: string;
  stylistName: string;
  date: string;
  time: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  notes?: string;
  createdAt: string;
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}

export type ServiceRow = {
  id: string;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  category: string;
};
export type StylistRow = { id: string; name: string; role: string };
export type GalleryRow = {
  image: string;
  alt: string;
  caption: string;
  category: string;
};

export type ContentCollections = {
  services: ServiceRow[];
  stylists: StylistRow[];
  gallery: GalleryRow[];
  bookings: Booking[];
};

const DEFAULTS = {
  services: SERVICES,
  stylists: STYLISTS,
  gallery: GALLERY_ITEMS,
  bookings: [],
} as const;

// ── Pool (shared across route bundles via globalThis — a module-level
// pool would be duplicated per route in dev and exhaust connections) ──
const POOL_KEY = '__contentStorePgPool';
type GlobalWithPool = typeof globalThis & {
  [POOL_KEY]?: Pool;
};

function getPool(): Pool {
  const g = globalThis as GlobalWithPool;
  if (!g[POOL_KEY]) {
    const connectionString =
      process.env.DATABASE_URL ??
      'postgres://salon:salon_dev_2026@localhost:5432/salon';
    g[POOL_KEY] = new Pool({ connectionString });
  }
  return g[POOL_KEY];
}

const TABLE_BY_COLLECTION: Record<
  keyof ContentCollections,
  string
> = {
  services: 'services',
  stylists: 'stylists',
  gallery: 'gallery',
  bookings: 'bookings',
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
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS stylists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT '',
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
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  service_id TEXT,
  service_name TEXT NOT NULL DEFAULT '',
  stylist_name TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL DEFAULT '',
  time TEXT NOT NULL DEFAULT '',
  client_name TEXT NOT NULL DEFAULT '',
  client_email TEXT NOT NULL DEFAULT '',
  client_phone TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

let initPromise: Promise<void> | null = null;

/** Create tables if missing and seed default content on first run.
 * Safe to call repeatedly and from every route bundle. */
async function ensureSchema(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      const pool = getPool();
      await pool.query(SCHEMA_SQL);
      await pool.query(
        `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'`
      );
      const { rows } = await pool.query(
        'SELECT COUNT(*)::int AS n FROM services'
      );
      if (rows[0].n === 0) {
        await seedFromDefaults();
      }
    })();
  }
  return initPromise;
}

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
           (id, name, description, price, duration_minutes, category, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [s.id, s.name, s.description, s.price, s.durationMinutes, s.category, i]
      );
    }
    for (let i = 0; i < DEFAULTS.stylists.length; i++) {
      const st = DEFAULTS.stylists[i];
      await cx.query(
        `INSERT INTO stylists (id, name, role, sort_order) VALUES ($1,$2,$3,$4)`,
        [st.id, st.name, st.role, i]
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
    await cx.query('COMMIT');
  } catch (err) {
    await cx.query('ROLLBACK');
    throw err;
  } finally {
    cx.release();
  }
}

function mapService(row: Record<string, unknown>): ServiceRow {
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    description: String(row.description ?? ''),
    price: Number(row.price ?? 0),
    durationMinutes: Number(row.duration_minutes ?? 0),
    category: String(row.category ?? ''),
  };
}

function mapStylist(row: Record<string, unknown>): StylistRow {
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    role: String(row.role ?? ''),
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

function mapBooking(row: Record<string, unknown>): Booking {
  const status = String(row.status ?? '');
  return {
    id: String(row.id),
    serviceId: row.service_id ? String(row.service_id) : undefined,
    serviceName: String(row.service_name ?? ''),
    stylistName: String(row.stylist_name ?? ''),
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

async function queryCollection<K extends keyof ContentCollections>(
  key: K
): Promise<ContentCollections[K]> {
  await ensureSchema();
  const pool = getPool();
  const table = TABLE_BY_COLLECTION[key];

  if (key === 'bookings') {
    const { rows } = await pool.query(
      `SELECT id, service_id, service_name, stylist_name, date, time,
              client_name, client_email, client_phone, notes, status, created_at
       FROM bookings ORDER BY created_at DESC, id`
    );
    return (rows.map(mapBooking) as unknown) as ContentCollections[K];
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

/** Read one collection by key. */
export async function getCollection<K extends keyof ContentCollections>(
  key: K
): Promise<ContentCollections[K]> {
  return queryCollection(key);
}

/** Replace one collection wholesale, in a transaction. Runs through the
 * serial write queue so concurrent saves cannot interleave. */
export async function setCollection<K extends keyof ContentCollections>(
  key: K,
  value: ContentCollections[K]
): Promise<void> {
  await ensureSchema();
  await withWriteLock(() => replaceCollection(key, value));
}

/** Core replace-one-collection logic (must be called while holding the lock —
 * assumes the caller, setCollection or updateContent, is inside withWriteLock).
 * Uses a transaction so a failure rolls the table back intact. */
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
             (id, name, description, price, duration_minutes, category, sort_order)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [s.id, s.name, s.description, s.price, s.durationMinutes, s.category, i]
        );
      }
    } else if (key === 'stylists') {
      await cx.query('DELETE FROM stylists');
      const rows = value as unknown as StylistRow[];
      for (let i = 0; i < rows.length; i++) {
        const st = rows[i];
        await cx.query(
          `INSERT INTO stylists (id, name, role, sort_order) VALUES ($1,$2,$3,$4)`,
          [st.id, st.name, st.role, i]
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
    } else {
      // bookings: read-only in admin; allow replace for parity
      await cx.query('DELETE FROM bookings');
      const rows = value as unknown as Booking[];
      for (let i = 0; i < rows.length; i++) {
        const b = rows[i];
        await cx.query(
          `INSERT INTO bookings
             (id, service_id, service_name, stylist_name, date, time,
              client_name, client_email, client_phone, notes, status, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
          [
            b.id,
            b.serviceId ?? null,
            b.serviceName,
            b.stylistName,
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

/** Run a mutation as one serialised read-modify-write: `fn` is given the
 * current full content and returns the new content to persist. Because it
 * runs inside the write lock, concurrent callers cannot clobber each other. */
export async function updateContent(
  fn: (current: ContentCollections) => ContentCollections
): Promise<void> {
  await ensureSchema();
  await withWriteLock(async () => {
    const [services, stylists, gallery, bookings] = await Promise.all([
      getCollection('services'),
      getCollection('stylists'),
      getCollection('gallery'),
      getCollection('bookings'),
    ]);
    const next = fn({ services, stylists, gallery, bookings });
    if (next !== undefined) {
      // Persist only the collections that actually changed.
      if (next.services !== services) await replaceCollection('services', next.services);
      if (next.stylists !== stylists) await replaceCollection('stylists', next.stylists);
      if (next.gallery !== gallery) await replaceCollection('gallery', next.gallery);
      if (next.bookings !== bookings) await replaceCollection('bookings', next.bookings);
    }
  });
}

/** Read the full content (used by updateContent; public API parity). */
export async function getContent(): Promise<ContentCollections> {
  const [services, stylists, gallery, bookings] = await Promise.all([
    getCollection('services'),
    getCollection('stylists'),
    getCollection('gallery'),
    getCollection('bookings'),
  ]);
  return { services, stylists, gallery, bookings };
}

/** Reset one collection back to its seed defaults. */
export async function resetCollection<K extends keyof ContentCollections>(
  key: K
): Promise<void> {
  await setCollection(key, (DEFAULTS[key] as unknown) as ContentCollections[K]);
}

export const COLLECTION_KEYS = ['services', 'stylists', 'gallery', 'bookings'] as const;