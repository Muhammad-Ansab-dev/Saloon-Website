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
import { sendBookingConfirmationEmail, EmailResult } from '@/lib/email';
import { cookies } from 'next/headers';
import { sessionFromRequest } from '@/lib/auth';

/** Access scope derived from the session cookie (middleware already
 * guarantees a valid cookie; this narrows view+edit rights further for
 * branch managers: they only act on their own branch). */
async function scopeOf(
  cookieStore: { get(name: string): { value?: string } | undefined }
): Promise<{ admin: boolean; branch?: string } | null> {
  const claim = await sessionFromRequest({ cookies: cookieStore });
  if (!claim) return null;
  return claim.role === 'branch' ? { admin: false, branch: claim.branch } : { admin: true };
}

/** Resolve the session scope for this route handler. */
async function requestScope(): Promise<{ admin: boolean; branch?: string } | null> {
  return scopeOf(await cookies());
}

function accountMissing(): NextResponse {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

function forbiddenForBranch(): NextResponse {
  return NextResponse.json(
    { error: 'This action is only available to the superadmin account' },
    { status: 403 }
  );
}

const EDITABLE = ['services', 'stylists', 'gallery', 'siteImages', 'siteTexts', 'categories', 'branches'] as const;
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
  if (typeof patch.branch === 'string') next.branch = patch.branch.trim().toLowerCase();
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

/** Branch slugs are lowercase alphanumeric+hyphen (e.g. "new-york"). */
function slugifyBranch(city: string): string {
  const slug = city
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'branch';
}

function parseBranchPatch(patch: Record<string, unknown>): Record<string, string> {
  const next: Record<string, string> = {};
  if (typeof patch.city === 'string' && patch.city.trim()) next.city = patch.city.trim();
  if (typeof patch.address === 'string') next.address = patch.address.trim();
  if (typeof patch.email === 'string') next.email = patch.email.trim();
  if (typeof patch.telephone === 'string') next.telephone = patch.telephone.trim();
  if (typeof patch.hours === 'string') next.hours = patch.hours.trim();
  if (typeof patch.managerUsername === 'string' && patch.managerUsername.trim()) {
    next.managerUsername = patch.managerUsername.trim();
  }
  if (typeof patch.managerPassword === 'string' && patch.managerPassword.trim()) {
    next.managerPassword = patch.managerPassword.trim();
  }
  return next;
}

/** Unique branch slug for a new branch: base slug from the city, deduped
 * against the existing rows with a random suffix when it collides. */
function uniqueBranchSlug(city: string, existing: { slug: string }[]): string {
  const taken = new Set(existing.map((r) => r.slug));
  let slug = slugifyBranch(city);
  while (taken.has(slug)) {
    slug = `${slugifyBranch(city)}-${Math.random().toString(36).slice(2, 6)}`;
  }
  return slug;
}

/**
 * Admin collection endpoints — protected by middleware (matches /api/admin/*).
 *   GET  /api/admin/[col]         → current full array (for admin UI + edits)
 *   PUT  /api/admin/[col]         → replace whole array  (body: { items: [...] })
 *   POST /api/admin/stylists      → create one stylist  (body: { name, role? })
 *   POST /api/admin/services      → create one service  (body: { name, category?, price? })
 *   POST /api/admin/bookings      → create one booking  (body: { clientName, clientEmail, serviceName, date, time, … })
 *   POST /api/admin/branches      → create one branch + its manager login
 *                                (body: { city, address?, email?, telephone?, hours?, managerUsername, managerPassword })
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
  const scope = await requestScope();
  if (!scope) return accountMissing();
  const { col } = await params;
  if (col === 'bookings') {
    const body = await readBody<{
      clientName?: unknown;
      clientEmail?: unknown;
      clientPhone?: unknown;
      serviceId?: unknown;
      serviceName?: unknown;
      stylistName?: unknown;
      branch?: unknown;
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
    // Branch managers can only ever create bookings for their own branch.
    const branch =
      scope.branch ??
      (typeof body.branch === 'string' ? body.branch.trim().toLowerCase() : '');
    const booking: Booking = {
      id: `bk-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
      serviceId: typeof body.serviceId === 'string' ? body.serviceId.trim() : '',
      serviceName,
      stylistName: typeof body.stylistName === 'string' ? body.stylistName.trim() : '',
      branch,
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
    if (!scope.admin) return forbiddenForBranch();
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
  if (col === 'branches') {
    if (!scope.admin) return forbiddenForBranch();
    const body = await readBody<{
      city?: unknown;
      address?: unknown;
      email?: unknown;
      telephone?: unknown;
      hours?: unknown;
      managerUsername?: unknown;
      managerPassword?: unknown;
    }>(request);
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const city = typeof body.city === 'string' ? body.city.trim() : '';
    const managerUsername = typeof body.managerUsername === 'string' ? body.managerUsername.trim() : '';
    const managerPassword = typeof body.managerPassword === 'string' ? body.managerPassword.trim() : '';
    if (!city) {
      return NextResponse.json({ error: 'city is required' }, { status: 400 });
    }
    if (!managerUsername || !managerPassword) {
      return NextResponse.json(
        { error: 'managerUsername and managerPassword are required for the branch login' },
        { status: 400 }
      );
    }
    const current = await getCollection('branches');
    const slug = uniqueBranchSlug(city, current);
    const branch = {
      slug,
      city,
      address: typeof body.address === 'string' ? body.address.trim() : '',
      email: typeof body.email === 'string' ? body.email.trim() : '',
      telephone: typeof body.telephone === 'string' ? body.telephone.trim() : '',
      hours: typeof body.hours === 'string' ? body.hours.trim() : '',
      managerUsername,
      managerPassword,
      createdAt: new Date().toISOString(),
    };
    await setCollection('branches', [...current, branch]);
    return NextResponse.json({ ok: true, item: branch });
  }
  if (col !== 'stylists' && col !== 'services') {
    return NextResponse.json({ error: 'POST is only supported for stylists and services' }, { status: 404 });
  }

  if (col === 'services' && !scope.admin) return forbiddenForBranch();

  const body = await readBody<{ name?: unknown; role?: unknown; category?: unknown; price?: unknown; image?: unknown; branch?: unknown }>(request);
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
    // Branch managers can only ever add stylists to their own branch.
    branch: (scope.branch ?? (typeof body.branch === 'string' ? body.branch.trim().toLowerCase() : '')),
  };
  await setCollection('stylists', [...(await getCollection('stylists')), item]);
  return NextResponse.json({ ok: true, item });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ col: string }> }
) {
  const scope = await requestScope();
  if (!scope) return accountMissing();
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
    // Branch managers may only touch their own branch's bookings.
    if (scope.branch) {
      const target = (await getCollection('bookings')).find((b) => b.id === id);
      if (!target) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      if (target.branch?.toLowerCase() !== scope.branch) return forbiddenForBranch();
    }
    const affected = await updateBooking(id, { status });
    if (affected === 0) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    const booking = (await getCollection('bookings')).find((b) => b.id === id) ?? null;
    // Confirming a booking emails the customer ("Your booking is confirmed").
    // The send is skipped when SMTP is not configured; the API never fails
    // because the mailer errored.
    const confirmationEmail: EmailResult =
      status === 'confirmed' && booking
        ? await sendBookingConfirmationEmail(booking)
        : 'skipped';
    return NextResponse.json({ ok: true, booking, confirmationEmail });
  }

  if (col === 'branches') {
    if (!scope.admin) return forbiddenForBranch();
    if (!id) {
      return NextResponse.json({ error: 'Branch slug is required' }, { status: 400 });
    }
    const updates = parseBranchPatch(patch);
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    }
    const current = await getCollection('branches');
    const idx = current.findIndex((b) => b.slug === id);
    if (idx === -1) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }
    const existing = current[idx];
    const updated = { ...existing, ...updates };
    await setCollection('branches', current.map((b, i) => (i === idx ? updated : b)));
    return NextResponse.json({ ok: true, item: updated });
  }

  if (col === 'services') {
    if (!scope.admin) return forbiddenForBranch();
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
  if (scope.branch) {
    const target = current.find((s) => s.id === id);
    if (!target) return NextResponse.json({ error: 'Stylist not found' }, { status: 404 });
    if (target.branch?.toLowerCase() !== scope.branch) return forbiddenForBranch();
  }
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
    // Branch managers can never move a stylist out of their branch.
    branch: scope.branch ?? updates.branch ?? existing.branch,
  };
  await setCollection('stylists', current.map((s, i) => (i === idx ? updated : s)));
  return NextResponse.json({ ok: true, item: updated });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ col: string }> }
) {
  const scope = await requestScope();
  if (!scope) return accountMissing();
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
    if (scope.branch) {
      const target = (await getCollection('bookings')).find((b) => b.id === id);
      if (!target) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      if (target.branch?.toLowerCase() !== scope.branch) return forbiddenForBranch();
    }
    await setCollection('bookings', (await getCollection('bookings')).filter((b) => b.id !== id));
    return NextResponse.json({ ok: true, id });
  }

  if (col === 'branches') {
    if (!scope.admin) return forbiddenForBranch();
    const current = await getCollection('branches');
    if (!current.some((b) => b.slug === id)) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }
    // Deleting a branch is allowed; anything already booked / assigned to it
    // falls into the "Unassigned" sleeve afterwards.
    await setCollection('branches', current.filter((b) => b.slug !== id));
    return NextResponse.json({ ok: true, id });
  }

  if (col === 'categories') {
    if (!scope.admin) return forbiddenForBranch();
    const current = await getCollection('categories');
    const next = current.filter((c) => c.name !== id);
    if (next.length === current.length) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    await setCollection('categories', next);
    return NextResponse.json({ ok: true, id });
  }

  if (col === 'services') {
    if (!scope.admin) return forbiddenForBranch();
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
  if (scope.branch) {
    const target = current.find((s) => s.id === id);
    if (!target) return NextResponse.json({ error: 'Stylist not found' }, { status: 404 });
    if (target.branch?.toLowerCase() !== scope.branch) return forbiddenForBranch();
  }
  const next = current.filter((s) => s.id !== id);
  if (next.length === current.length) {
    return NextResponse.json({ error: 'Stylist not found' }, { status: 404 });
  }
  await setCollection('stylists', next);
  return NextResponse.json({ ok: true, id });
}

const NO_STORE = { 'Cache-Control': 'no-store, no-cache, must-revalidate' } as const;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ col: string }> }
) {
  const scope = await requestScope();
  if (!scope) return accountMissing();
  const { col } = await params;
  if (col === 'bookings') {
    const bookings = (await getCollection('bookings'))
      .filter((b) => (scope.branch ? b.branch?.toLowerCase() === scope.branch : true))
      .slice()
      .sort((a: { date?: string; time?: string }, b: { date?: string; time?: string }) =>
        `${b.date || ''} ${b.time || ''}`.localeCompare(`${a.date || ''} ${a.time || ''}`)
      );
    return NextResponse.json({ items: bookings }, { headers: NO_STORE });
  }
  if (!isEditable(col)) {
    return NextResponse.json({ error: 'Unknown collection' }, { status: 404 });
  }
  // Branch rows expose manager credentials — only the superadmin may read them.
  if (col === 'branches' && scope.branch) {
    return forbiddenForBranch();
  }
  if (col === 'stylists' && scope.branch) {
    const items = (await getCollection('stylists')).filter(
      (s) => s.branch?.toLowerCase() === scope.branch
    );
    return NextResponse.json({ items }, { headers: NO_STORE });
  }
  const items = await getCollection(col);
  return NextResponse.json({ items }, { headers: NO_STORE });
}

// Never let Next.js cache GET responses here — the dashboard must always
// see fresh rows (a cached "pending" would hide status changes).
export const dynamic = 'force-dynamic';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ col: string }> }
) {
  const scope = await requestScope();
  if (!scope) return accountMissing();
  if (!scope.admin) return forbiddenForBranch();
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