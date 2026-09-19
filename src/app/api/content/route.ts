import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/store';
import { SITE_IMAGES_DEFAULTS } from '@/data/salonData';

// ─────────────────────────────────────────────────────────────
// PUBLIC CONTENT API ("GET /api/content") — the live-data feed the public
// site front-end reads so it reflects admin edits without a rebuild.
// What it does: returns every public collection in one JSON response.
// What it connects to: all store collections in src/lib/store.ts and the
// static defaults in src/data/salonData.ts.
// Why it exists: components like ServiceMenu, TeamSection and Gallery fetch
// from here instead of hard-coding copy (see useSiteContent hook).
// Privacy rules enforced here:
//   - bookings are intentionally excluded (they are private; the dashboard
//     reads them via /api/admin).
//   - branches are served WITHOUT managerUsername/managerPassword — those
//     credentials are admin-only.
// ─────────────────────────────────────────────────────────────
export async function GET() {
  // Fetch all public collections in parallel — one round trip instead of seven.
  const [services, stylists, gallery, siteImages, siteTexts, categories, branches] = await Promise.all([
    getCollection('services'),
    getCollection('stylists'),
    getCollection('gallery'),
    getCollection('siteImages'),
    getCollection('siteTexts'),
    getCollection('categories'),
    getCollection('branches'),
  ]);
  // Admin-edited image values win, but any key never edited keeps its default.
  const images = {
    ...SITE_IMAGES_DEFAULTS,
    ...Object.fromEntries(siteImages.map((r) => [r.key, r.value])),
  };
  // Strip the manager credentials off every branch before it leaves the server.
  const publicBranches = branches.map(({ managerUsername: _mu, managerPassword: _mp, ...rest }) => rest);
  return NextResponse.json({ services, stylists, gallery, images, siteTexts, categories, branches: publicBranches }, {
    // no-store: the site must always reflect the latest admin edits.
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate', 'Pragma': 'no-cache' },
  });
}