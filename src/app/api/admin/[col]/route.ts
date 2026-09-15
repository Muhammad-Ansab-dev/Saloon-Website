import { NextResponse } from 'next/server';
import { Booking, getCollection, setCollection, updateContent } from '@/lib/store';

const EDITABLE = ['services', 'stylists', 'gallery'] as const;
type Editable = (typeof EDITABLE)[number];

function isEditable(v: string): v is Editable {
  return (EDITABLE as readonly string[]).includes(v);
}

const BOOKING_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'] as const;
type BookingStatus = (typeof BOOKING_STATUSES)[number];
function isBookingStatus(v: string): v is BookingStatus {
  return (BOOKING_STATUSES as readonly string[]).includes(v);
}

/**
 * Admin collection endpoints — protected by middleware (matches /api/admin/*).
 *   GET  /api/admin/[col]         → current full array (for admin UI + edits)
 *   PUT  /api/admin/[col]         → replace whole array  (body: { items: [...] })
 *   PATCH  /api/admin/bookings    → update one booking  (body: { id, patch })
 *   DELETE /api/admin/bookings    → delete one booking  (body: { id })
 *   POST /api/admin/[col]/reset   → restore seed defaults
 * The bookings collection is created via /api/booking (public form).
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ col: string }> }
) {
  const { col } = await params;
  if (col !== 'bookings') {
    return NextResponse.json({ error: 'PATCH is only supported for bookings' }, { status: 404 });
  }

  let body: { id?: unknown; patch?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const id = typeof body.id === 'string' ? body.id : '';
  const patch = body.patch && typeof body.patch === 'object' ? (body.patch as Record<string, unknown>) : {};
  if (!id) {
    return NextResponse.json({ error: 'Booking id is required' }, { status: 400 });
  }

  let updated: Booking | null = null;
  let found = false;
  await updateContent((current) => {
    const bookings = current.bookings.map((b) => {
      if (b.id !== id) return b;
      found = true;
      if (patch.status === undefined || !isBookingStatus(String(patch.status))) {
        return b;
      }
      updated = { ...b, status: String(patch.status) as BookingStatus };
      return updated;
    });
    return { ...current, bookings };
  });

  if (!found) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }
  if (!updated) {
    return NextResponse.json(
      { error: 'Invalid status — expected pending, confirmed, completed or cancelled' },
      { status: 400 }
    );
  }
  return NextResponse.json({ ok: true, booking: updated });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ col: string }> }
) {
  const { col } = await params;
  if (col !== 'bookings') {
    return NextResponse.json({ error: 'DELETE is only supported for bookings' }, { status: 404 });
  }

  let body: { id?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const id = typeof body.id === 'string' ? body.id : '';
  if (!id) {
    return NextResponse.json({ error: 'Booking id is required' }, { status: 400 });
  }

  await setCollection('bookings', (await getCollection('bookings')).filter((b) => b.id !== id));
  return NextResponse.json({ ok: true, id });
}

export async function GET(
  _: Request,
  { params }: { params: Promise<{ col: string }> }
) {
  const { col } = await params;
  if (col === 'bookings') {
    const bookings = await getCollection('bookings');
    return NextResponse.json({ items: bookings });
  }
  if (!isEditable(col)) {
    return NextResponse.json({ error: 'Unknown collection' }, { status: 404 });
  }
  const items = await getCollection(col);
  return NextResponse.json({ items });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ col: string }> }
) {
  const { col } = await params;
  if (!isEditable(col)) {
    return NextResponse.json({ error: 'Unknown collection' }, { status: 404 });
  }

  let body: { items?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (!Array.isArray(body.items)) {
    return NextResponse.json({ error: 'Body must be { items: [...] }' }, { status: 400 });
  }

  await setCollection(col, body.items as never);
  const updated = await getCollection(col);
  return NextResponse.json({ ok: true, items: updated });
}