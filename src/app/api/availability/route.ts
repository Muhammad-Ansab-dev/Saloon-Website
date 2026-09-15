import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/store';

// Public, unauthenticated: returns already-booked time slots for a given date
// (optionally filtered to one stylist) so the booking modal can disable taken
// slots. Only active (non-cancelled) bookings are counted as taken.
//   GET /api/availability?date=YYYY-MM-DD&stylist=<name>
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
  const taken = bookings
    .filter(
      (b) =>
        b.date === date &&
        (!stylist || b.stylistName === stylist) &&
        b.status !== 'cancelled'
    )
    .map((b) => b.time);

  return NextResponse.json(
    { date, stylist, taken },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
  );
}