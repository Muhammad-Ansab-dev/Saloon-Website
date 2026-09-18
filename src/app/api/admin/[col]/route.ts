// ─────────────────────────────────────────────────────────────
// /api/admin/[col] — admin CRUD for the content store, protected by
// middleware (matches /api/admin/*). `col` is one of the EDITABLE
// collections; `bookings` additionally supports create (POST) and
// status update (PATCH). Full method matrix is documented on POST
// below.
// ─────────────────────────────────────────────────────────────
import { NextResponse } from 'next/server';
import {
  Booking,
  BookingStatus,
  ContentCollections,
  ServiceRow,
  StylistRow,
  getCollection,
  setCollection,
  updateBooking,
  updateContent,
} from '@/lib/store';

const EDITABLE = ['services', 'stylists', 'gallery', 'siteImages', 'categories'] as const;
type Editable = (typeof EDITABLE)[number];

function isEditable(v: string): v is Editable {
  return (EDITABLE as readonly string[]).includes(v);
}

const BOOKING_STATUSES: readonly BookingStatus[] = [
  'pending',
  'confirmed',
  'completed',
  'cancelled',
];
function isBookingStatus(v: string): v is BookingStatus {
  return (BOOKING_STATUSES as readonly string[]).includes(v);
}

async function readBody<T extends Record<string, unknown>>(
  request: Request
): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

function newStylistId(): string {
  return `stylist-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

function newServiceId(): string {
  return `srv-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

function parseStylistPatch(patch: Record<string, unknown>): Record<string, string> {
  const next: Record<string, string> = {};
  if (typeof patch.name === 'string') next.name = patch.name.trim();
  if (typeof patch.role === 'string') next.role = patch.role.trim();
  if (typeof patch.image === 'string') next.image = patch.image;
  return next;
}

function parseServicePatch(patch: Record<string, unknown>): Record<string, string | number> {
  const next: Record<string, string | number> = {};
  if (typeof patch.name === 'string') next.name = patch.name.trim();
  if (typeof patch.category === 'string') next.category = patch.category.trim();
  if (typeof patch.price === 'number' && Number.isFinite(patch.price)) {
    next.price = Math.max(0, Math.round(patch.price));
  }
  if (typeof patch.image === 'string') next.image = patch.image;
  return next;
}

/**
 * Admin collection endpoints — protected by middleware (matches /api/admin/*).
 *   GET  /api/admin/[col]         → current full array (for admin UI + edits)
 *   PUT  /api/admin/[col]         → replace whole array  (body: { items: [...] })
 *   POST /api/admin/stylists      → create one stylist  (body: { name, role? })
 *   POST /api/admin/services      → create one service  (body: { name, category?, price? })
 *   POST /api/admin/bookings      → create one booking  (body: { clientName, clientEmail, serviceName, date, time, … })
 *   PATCH /api/admin/stylists     → update one stylist  (body: { id, patch })
 *   PATCH /api/admin/services     → update one service  (body: { id, patch })
 *   PATCH /api/admin/bookings     → update one booking  (body: { id, patch })
 *   DELETE /api/admin/stylists    → delete one stylist  (body: { id })
 *   DELETE /api/admin/services    → delete one service  (body: { id })
 *   DELETE /api/admin/bookings    → delete one booking  (body: { id })
 *   POST /api/admin/[col]/reset   → restore seed defaults
 * The bookings collection is created via /api/booking (public form).
 * New bookings arrive as `pending` (see /api/booking); the admin confirms
 * them from the dashboard and later moves them to completed / cancelled.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ col: string }> }
) {
  const { col } = await params;
  if (col === 'bookings') {
    const body = await readBody<{
      clientName?: unknown;
      clientEmail?: unknown;
      clientPhone?: unknown;
      serviceId?: unknown;
      serviceName?: unknown;
      stylistName?: unknown;
      date?: unknown;
      time?: unknown;
      notes?: unknown;
      status?: unknown;
    }>(request);
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const clientName = typeof body.clientName === 'string' ? body.clientName.trim() : '';
    const clientEmail = typeof body.clientEmail === 'string' ? body.clientEmail.trim() : '';
    const serviceName = typeof body.serviceName === 'string' ? body.serviceName.trim() : '';
    const date = typeof body.date === 'string' ? body.date.trim() : '';
    const time = typeof body.time === 'string' ? body.time.trim() : '';
    if (!clientName || !clientEmail || !serviceName || !date || !time) {
      return NextResponse.json(
        { error: 'clientName, clientEmail, serviceName, date and time are required' },
        { status: 400 }
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }
    const status: BookingStatus =
      typeof body.status === 'string' && isBookingStatus(body.status) ? body.status : 'pending';
    const booking: Booking = {
      id: `bk-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
      serviceId: typeof body.serviceId === 'string' ? body.serviceId.trim() : '',
      serviceName,
      stylistName: typeof body.stylistName === 'string' ? body.stylistName.trim() : '',
      date,
      time,
      clientName,
      clientEmail,
      clientPhone: typeof body.clientPhone === 'string' ? body.clientPhone.trim() : '',
      notes: typeof body.notes === 'string' ? body.notes.trim() : '',
      status,
      createdAt: new Date().toISOString(),
    };
    await updateContent((current) => ({ ...current, bookings: [booking, ...current.bookings] }));
    return NextResponse.json({ ok: true, item: booking });
  }
  if (col === 'categories') {
    const body = await readBody<{ name?: unknown; stylists?: unknown }>(request);
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }
    const stylists = Array.isArray(body.stylists)
      ? body.stylists.filter((s): s is string => typeof s === 'string')
      : [];
    const current = await getCollection('categories');
    if (current.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      return NextResponse.json({ error: 'Category already exists' }, { status: 409 });
    }
    const item = { name, stylists };
    await setCollection('categories', [...current, item]);
    return NextResponse.json({ ok: true, item });
  }
  if (col !== 'stylists' && col !== 'services') {
    return NextResponse.json({ error: 'POST is only supported for stylists and services' }, { status: 404 });
  }

  const body = await readBody<{ name?: unknown; role?: unknown; category?: unknown; price?: unknown; image?: unknown }>(request);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  if (col === 'services') {
    const price = typeof body.price === 'number' && Number.isFinite(body.price) ? Math.max(0, Math.round(body.price)) : 0;
    const item: ServiceRow = {
      id: newServiceId(),
      name,
      description: '',
      price,
      durationMinutes: 0,
      category: typeof body.category === 'string' ? body.category.trim() : '',
      image: typeof body.image === 'string' ? body.image.trim() : '',
    };
    await setCollection('services', [...(await getCollection('services')), item]);
    return NextResponse.json({ ok: true, item });
  }

  const item: StylistRow = {
    id: newStylistId(),
    name,
    role: typeof body.role === 'string' ? body.role.trim() : '',
    image: typeof body.image === 'string' ? body.image.trim() : '',
  };
  await setCollection('stylists', [...(await getCollection('stylists')), item]);
  return NextResponse.json({ ok: true, item });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ col: string }> }
) {
  const { col } = await params;

  const body = await readBody<{ id?: unknown; patch?: unknown }>(request);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const id = typeof body.id === 'string' ? body.id : '';
  const patch = body.patch && typeof body.patch === 'object' ? (body.patch as Record<string, unknown>) : {};

  if (col === 'bookings') {
    const status = typeof patch.status === 'string' ? patch.status : '';
    if (!id) {
      return NextResponse.json({ error: 'Booking id is required' }, { status: 400 });
    }
    if (!isBookingStatus(status)) {
      return NextResponse.json(
        { error: 'Invalid status — expected pending, confirmed, completed or cancelled' },
        { status: 400 }
      );
    }
    const affected = await updateBooking(id, { status });
    if (affected === 0) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    const booking = (await getCollection('bookings')).find((b) => b.id === id) ?? null;
    return NextResponse.json({ ok: true, booking });
  }

  if (col === 'services') {
    if (!id) {
      return NextResponse.json({ error: 'Service id is required' }, { status: 400 });
    }
    const updates = parseServicePatch(patch);
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }
    const current = await getCollection('services');
    const idx = current.findIndex((s) => s.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }
    const existing = current[idx];
    const updated: ServiceRow = {
      ...existing,
      name: typeof updates.name === 'string' ? updates.name : existing.name,
      category: typeof updates.category === 'string' ? updates.category : existing.category,
      price: typeof updates.price === 'number' ? updates.price : existing.price,
      image: typeof updates.image === 'string' ? updates.image : existing.image,
    };
    await setCollection('services', current.map((s, i) => (i === idx ? updated : s)));
    return NextResponse.json({ ok: true, item: updated });
  }

  if (col !== 'stylists') {
    return NextResponse.json(
      { error: 'PATCH is only supported for bookings, stylists and services' },
      { status: 404 }
    );
  }
  if (!id) {
    return NextResponse.json({ error: 'Stylist id is required' }, { status: 400 });
  }

  const updates = parseStylistPatch(patch);
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const current = await getCollection('stylists');
  const idx = current.findIndex((s) => s.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: 'Stylist not found' }, { status: 404 });
  }
  const existing = current[idx];
  const updated: StylistRow = {
    ...existing,
    name: updates.name ?? existing.name,
    role: updates.role ?? existing.role,
    image: updates.image ?? existing.image,
  };
  await setCollection('stylists', current.map((s, i) => (i === idx ? updated : s)));
  return NextResponse.json({ ok: true, item: updated });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ col: string }> }
) {
  const { col } = await params;

  let body: { id?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const id = typeof body.id === 'string' ? body.id : '';
  if (!id) {
    return NextResponse.json({ error: 'Item id is required' }, { status: 400 });
  }

  if (col === 'bookings') {
    await setCollection('bookings', (await getCollection('bookings')).filter((b) => b.id !== id));
    return NextResponse.json({ ok: true, id });
  }

  if (col === 'categories') {
    const current = await getCollection('categories');
    const next = current.filter((c) => c.name !== id);
    if (next.length === current.length) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    await setCollection('categories', next);
    return NextResponse.json({ ok: true, id });
  }

  if (col === 'services') {
    const current = await getCollection('services');
    const next = current.filter((s) => s.id !== id);
    if (next.length === current.length) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }
    await setCollection('services', next);
    return NextResponse.json({ ok: true, id });
  }

  if (col !== 'stylists') {
    return NextResponse.json(
      { error: 'DELETE is only supported for bookings, stylists and services' },
      { status: 404 }
    );
  }

  const current = await getCollection('stylists');
  const next = current.filter((s) => s.id !== id);
  if (next.length === current.length) {
    return NextResponse.json({ error: 'Stylist not found' }, { status: 404 });
  }
  await setCollection('stylists', next);
  return NextResponse.json({ ok: true, id });
}

export async function GET(
  _: Request,
  { params }: { params: Promise<{ col: string }> }
) {
  const { col } = await params;
  if (col === 'bookings') {
    const bookings = (await getCollection('bookings'))
      .slice()
      .sort((a: { date?: string; time?: string }, b: { date?: string; time?: string }) =>
        `${b.date || ''} ${b.time || ''}`.localeCompare(`${a.date || ''} ${a.time || ''}`)
      );
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

  await setCollection(col, body.items as ContentCollections[Editable]);
  const updated = await getCollection(col);
  return NextResponse.json({ ok: true, items: updated });
}