import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/store';

// Public, unauthenticated: the live-data endpoint used by the public site
// (ServiceMenu, TeamSection, Gallery) to reflect admin edits. Bookings are
// intentionally excluded (private) and served only via /api/admin/content.
export async function GET() {
  const [services, stylists, gallery] = await Promise.all([
    getCollection('services'),
    getCollection('stylists'),
    getCollection('gallery'),
  ]);
  return NextResponse.json({ services, stylists, gallery }, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate', 'Pragma': 'no-cache' },
  });
}