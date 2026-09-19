import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/store';

// ─────────────────────────────────────────────────────────────
// AVAILABILITY API ("GET /api/availability") — the booking form's helper.
// What it does: tells the front-end which time slots are already taken on a
// given date so the booking modal can grey them out.
// What it connects to: the bookings collection in src/lib/store.ts.
// Why it exists: public + unauthenticated by design — anyone needs to see
// free slots before booking.
// Rule: only active (non-cancelled) bookings count as taken; a cancelled
// slot frees back up. Optional ?stylist= narrows the check to one stylist.
//   GET /api/availability?date=YYYY-MM-DD&stylist=<name>
// ─────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const stylist = searchParams.get('stylist')?.trim() || '';

  if (!date) {
    return NextResponse.json(
      { error: 'date query param is required (YYYY-MM-DD)' },
      { status: 400 }
    );
  }

  const bookings = await getCollection('bookings');
  // Keep only bookings that match the date (+ optional stylist) and are not
  // cancelled; what remains, the list of occupied times, is what we return.
  const taken = bookings
    .filter(
      (b) =>
        b.date === date &&
        (!stylist || b.stylistName === stylist) &&
        b.status !== 'cancelled'
    )
    .map((b) => b.time);

  // no-store: slot availability must always be checked live, never cached.
  return NextResponse.json(
    { date, stylist, taken },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
  );
}