import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/store';
import { SITE_IMAGES_DEFAULTS } from '@/data/salonData';

// Public, unauthenticated: the live-data endpoint used by the public site
// (ServiceMenu, TeamSection, Gallery) to reflect admin edits. Bookings are
// intentionally excluded (private) and served only via /api/admin/content.
export async function GET() {
  const [services, stylists, gallery, siteImages, categories] = await Promise.all([
    getCollection('services'),
    getCollection('stylists'),
    getCollection('gallery'),
    getCollection('siteImages'),
    getCollection('categories'),
  ]);
  const images = {
    ...SITE_IMAGES_DEFAULTS,
    ...Object.fromEntries(siteImages.map((r) => [r.key, r.value])),
  };
  return NextResponse.json({ services, stylists, gallery, images, categories }, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate', 'Pragma': 'no-cache' },
  });
}