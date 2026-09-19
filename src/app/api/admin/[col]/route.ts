// ─────────────────────────────────────────────────────────────
// ADMIN CRUD API ("/api/admin/[col]") — the one route that lets the
// dashboard read and edit every content collection.
// What it does: [col] is the collection name (services, stylists, gallery,
// siteImages, siteTexts, categories, branches, bookings). One file serves
// all CRUD verbs: GET read, PUT replace-all, POST create, PATCH update,
// DELETE remove.
// What it connects to: the PostgreSQL content store via src/lib/store.ts
// (getCollection / setCollection / updateBooking / cancelOverdueBookings)
// and the session cookie via src/lib/auth.ts.
// Why it exists: the admin UI talks to this one endpoint instead of having
// one route per collection.
// Security: protected by middleware (matches /api/admin/*), and this route
// further scopes branch managers to their own branch (they cannot touch
// services/gallery/siteImages/uploads and never see branch rows with
// manager credentials). Full method matrix is documented on POST below.
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
  cancelOverdueBookings,
} from '@/lib/store';
import { sendBookingConfirmationEmail, EmailResult } from '@/lib/email';
import { cookies } from 'next/headers';
import { sessionFromRequest } from '@/lib/auth';

// Access scope derived from the session cookie (middleware already
// guarantees a valid cookie; this narrows view+edit rights further for
// branch managers: they only act on their own branch).
// Params: the cookie store from next/headers.
// Returns: {admin:true} for the superadmin, {admin:false, branch:slug}
// for a branch manager, or null when there is no session.
async function scopeOf(
  cookieStore: { get(name: string): { value?: string } | undefined }
): Promise<{ admin: boolean; branch?: string } | null> {
  const claim = await sessionFromRequest({ cookies: cookieStore });
  if (!claim) return null;
  return claim.role === 'branch' ? { admin: false, branch: claim.branch } : { admin: true };
}

// Resolve the session scope for this route handler (wraps scopeOf with the
// current request's cookies). Returns the same shape as scopeOf.
async function requestScope(): Promise<{ admin: boolean; branch?: string } | null> {
  return scopeOf(await cookies());
}

// 401 response for "no/invalid session" — sent to unauthenticated calls.
function accountMissing(): NextResponse {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// 403 response for valid-but-insufficient rights (branch manager doing a superadmin action).
function forbiddenForBranch(): NextResponse {
  return NextResponse.json(
    { error: 'This action is only available to the superadmin account' },
    { status: 403 }
  );
}

// Collections the superadmin can edit through this route (branch managers
// are excluded from all of these except their own bookings/stylists).
const EDITABLE = ['services', 'stylists', 'gallery', 'siteImages', 'siteTexts', 'categories', 'branches'] as const;
type Editable = (typeof EDITABLE)[number];

// Type guard: is v one of the editable collection names?
function isEditable(v: string): v is Editable {
  return (EDITABLE as readonly string[]).includes(v);
}

// The only statuses a booking may have. Kept in one list so validation is
// a single source of truth.
const BOOKING_STATUSES: readonly BookingStatus[] = [
  'pending',
  'confirmed',
  'completed',
  'cancelled',
];
// Type guard: is v a real booking status?
function isBookingStatus(v: string): v is BookingStatus {
  return (BOOKING_STATUSES as readonly string[]).includes(v);
}

// Safely parse the JSON request body; returns null when the body is not JSON.
async function readBody<T extends Record<string, unknown>>(
  request: Request
): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

// Generate a unique stylist id, e.g. "stylist-m1x2abc".
function newStylistId(): string {
  return `stylist-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

// Generate a unique service id, e.g. "srv-k9f3qtz".
function newServiceId(): string {
  return `srv-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

// Pull only the editable stylist fields out of the incoming patch and trim
// them, so junk fields can never sneak into the stored row.
function parseStylistPatch(patch: Record<string, unknown>): Record<string, string> {
  const next: Record<string, string> = {};
  if (typeof patch.name === 'string') next.name = patch.name.trim();
  if (typeof patch.role === 'string') next.role = patch.role.trim();
  if (typeof patch.image === 'string') next.image = patch.image;
  if (typeof patch.branch === 'string') next.branch = patch.branch.trim().toLowerCase();
  return next;
}

// Pull only the editable service fields out of the incoming patch; prices are
// clamped to a non-negative rounded integer.
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

// Branch slugs are lowercase alphanumeric+hyphen (e.g. "new-york"),
// derived from the city name. Returns the slug or "branch" if empty.
function slugifyBranch(city: string): string {
  const slug = city
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'branch';
}

// Pull only the editable branch fields out of the incoming patch (including
// the manager login credentials, which only the superadmin may set).
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

// Unique branch slug for a new branch: base slug from the city, deduped
// against the existing rows with a random suffix when it collides.
function uniqueBranchSlug(city: string, existing: { slug: string }[]): string {
  const taken = new Set(existing.map((r) => r.slug));
  let slug = slugifyBranch(city);
  while (taken.has(slug)) {
    slug = `${slugifyBranch(city)}-${Math.random().toString(36).slice(2, 6)}`;
  }
  return slug;
}

// ── POST — create one item ─────────────────────────────────────
// Admin collection endpoints — protected by middleware (matches /api/admin/*).
//   GET  /api/admin/[col]         → current full array (for admin UI + edits)
//   PUT  /api/admin/[col]         → replace whole array  (body: { items: [...] })
//   POST /api/admin/stylists      → create one stylist  (body: { name, role? })
//   POST /api/admin/services      → create one service  (body: { name, category?, price? })
//   POST /api/admin/bookings      → create one booking  (body: { clientName, clientEmail, serviceName, date, time, … })
//   POST /api/admin/branches      → create one branch + its manager login
//                                (body: { city, address?, email?, telephone?, hours?, managerUsername, managerPassword })
//   PATCH /api/admin/stylists     → update one stylist  (body: { id, patch })
//   PATCH /api/admin/services     → update one service  (body: { id, patch })
//   PATCH /api/admin/bookings     → update one booking  (body: { id, patch })
//   DELETE /api/admin/stylists    → delete one stylist  (body: { id })
//   DELETE /api/admin/services    → delete one service  (body: { id })
//   DELETE /api/admin/bookings    → delete one booking  (body: { id })
//   POST /api/admin/[col]/reset   → restore seed defaults
// The bookings collection is also created via /api/booking (the public form).
// New bookings arrive as `pending` (see /api/booking); the admin confirms
// them from the dashboard and later moves them to completed / cancelled.
// Params: request + the [col] URL segment. Returns: {ok:true, item}.
// POST handler — create one item in a collection (full method matrix above).
export async function POST(
  request: Request,
  { params }: { params: Promise<{ col: string }> }
) {
  // Reject unauthenticated calls first; then read which collection is targeted.
  const scope = await requestScope();
  if (!scope) return accountMissing();
  const { col } = await params;
  // POST /bookings → create a new booking (dashboard's "Add Booking").
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
    // Required fields + email format are validated before anything is stored.
    if (!clientName || !clientEmail || !serviceName || !date || !time) {
      return NextResponse.json(
        { error: 'clientName, clientEmail, serviceName, date and time are required' },
        { status: 400 }
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }
    // Status is optional on create; anything unknown falls back to "pending".
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
  // POST /categories → create a category (admin-only; used by the Services tab).
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
    // Duplicate category names are rejected to keep filters unambiguous.
    const current = await getCollection('categories');
    if (current.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      return NextResponse.json({ error: 'Category already exists' }, { status: 409 });
    }
    const item = { name, stylists };
    await setCollection('categories', [...current, item]);
    return NextResponse.json({ ok: true, item });
  }
  // POST /branches → create a branch + its manager login (admin-only —
// branch rows carry credentials, so creation is never a branch action).
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
    // A branch is useless without a login — manager credentials are required.
    if (!managerUsername || !managerPassword) {
      return NextResponse.json(
        { error: 'managerUsername and managerPassword are required for the branch login' },
        { status: 400 }
      );
    }
    // Ensure the new slug doesn't collide with an existing branch.
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
  // Only stylists and services accept POST → anything else is a 404.
  if (col !== 'stylists' && col !== 'services') {
    return NextResponse.json({ error: 'POST is only supported for stylists and services' }, { status: 404 });
  }

  // Service creation is a superadmin action; stylists are branch-scoped below.
  if (col === 'services' && !scope.admin) return forbiddenForBranch();

  const body = await readBody<{ name?: unknown; role?: unknown; category?: unknown; price?: unknown; image?: unknown; branch?: unknown }>(request);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  // POST /services → new service; price is sanitized to a non-negative integer.
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

  // POST /stylists → new stylist (branch managers can only add to their own branch).
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

// PATCH handler — update one item: { id, patch: { fields to change } }.
// Params: request + the [col] URL segment. Returns: {ok:true, item} (and
// confirmationEmail for bookings).
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ col: string }> }
) {
  // Reject unauthenticated calls first; then read which collection is targeted.
  const scope = await requestScope();
  if (!scope) return accountMissing();
  const { col } = await params;

  const body = await readBody<{ id?: unknown; patch?: unknown }>(request);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  // The item id and the change-set; anything not an object is treated as empty.
  const id = typeof body.id === 'string' ? body.id : '';
  const patch = body.patch && typeof body.patch === 'object' ? (body.patch as Record<string, unknown>) : {};

  // PATCH /bookings → only ever changes a booking's status (pending/confirmed/...).
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

  // PATCH /branches → update a branch's details (admin-only, since the row
  // carries manager credentials).
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

  // PATCH /services → update a service's fields (superadmin-only).
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

  // Everything remaining is the stylist path — everything else is a 404.
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

// DELETE handler — remove one item from a collection.
// Params: request (body {id}) + the [col] URL segment.
// Returns: {ok:true, id} or a 404/403 error.
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ col: string }> }
) {
  // Reject unauthenticated calls first; then read which collection is targeted.
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

  // DELETE /bookings → remove one booking (branch managers: own branch only).
  if (col === 'bookings') {
    if (scope.branch) {
      const target = (await getCollection('bookings')).find((b) => b.id === id);
      if (!target) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      if (target.branch?.toLowerCase() !== scope.branch) return forbiddenForBranch();
    }
    await setCollection('bookings', (await getCollection('bookings')).filter((b) => b.id !== id));
    return NextResponse.json({ ok: true, id });
  }

  // DELETE /branches → remove a branch (superadmin-only).
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

  // DELETE /categories → remove a category (superadmin-only).
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

  // DELETE /services → remove a service (superadmin-only).
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

  // Everything remaining is the stylist path — everything else is a 404.
  if (col !== 'stylists') {
    return NextResponse.json(
      { error: 'DELETE is only supported for bookings, stylists and services' },
      { status: 404 }
    );
  }

  // Delete the stylist; branch managers may only delete their own branch's.
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

// Cache-busting headers for every response — the dashboard must always
// see fresh rows, never a proxy/browser-cached copy.
const NO_STORE = { 'Cache-Control': 'no-store, no-cache, must-revalidate' } as const;

// GET handler — read a collection (or all bookings).
// Params: request + the [col] URL segment.
// Returns: { items: [...] } with no-store headers; 401/404/403 otherwise.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ col: string }> }
) {
  // Reject unauthenticated calls first; then read which collection is targeted.
  const scope = await requestScope();
  if (!scope) return accountMissing();
  const { col } = await params;
  // GET /bookings → newest-first list of bookings, scoped to the caller's
  // branch when the caller is a branch manager.
  if (col === 'bookings') {
    // Sweep overdue bookings (date passed) to cancelled — runs on every load
    // so the dashboard always reflects "yesterday's bookings are cancelled".
    await cancelOverdueBookings();
    const bookings = (await getCollection('bookings'))
      .filter((b) => (scope.branch ? b.branch?.toLowerCase() === scope.branch : true))
      .slice()
      .sort((a: { date?: string; time?: string }, b: { date?: string; time?: string }) =>
        `${b.date || ''} ${b.time || ''}`.localeCompare(`${a.date || ''} ${a.time || ''}`)
      );
    return NextResponse.json({ items: bookings }, { headers: NO_STORE });
  }
  // Unknown collection names are rejected.
  if (!isEditable(col)) {
    return NextResponse.json({ error: 'Unknown collection' }, { status: 404 });
  }
  // Branch rows expose manager credentials — only the superadmin may read them.
  if (col === 'branches' && scope.branch) {
    return forbiddenForBranch();
  }
  // Stylists are branch-scoped: a manager only sees their own branch's crew.
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

// PUT handler — replace an ENTIRE collection wholesale (superadmin-only;
// used by the admin panels when they save a full batch of edits).
// Params: request (body must be { items: [...] }) + the [col] URL segment.
// Returns: {ok:true, items: the saved array}.
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ col: string }> }
) {
  // Reject unauthenticated + non-superadmin calls first.
  const scope = await requestScope();
  if (!scope) return accountMissing();
  if (!scope.admin) return forbiddenForBranch();
  const { col } = await params;
  // Unknown collection names are rejected.
  if (!isEditable(col)) {
    return NextResponse.json({ error: 'Unknown collection' }, { status: 404 });
  }

  let body: { items?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  // Enforce the contract: the body must carry the full new array.
  if (!Array.isArray(body.items)) {
    return NextResponse.json({ error: 'Body must be { items: [...] }' }, { status: 400 });
  }

  await setCollection(col, body.items as ContentCollections[Editable]);
  const updated = await getCollection(col);
  return NextResponse.json({ ok: true, items: updated });
}