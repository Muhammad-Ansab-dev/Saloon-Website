import { NextResponse } from 'next/server';
import { Booking, getCollection, updateContent } from '@/lib/store';

// ─────────────────────────────────────────────────────────────
// BOOKING API ("POST /api/booking") — accepts a booking from the public
// booking modal / contact form.
// What it does: validates the form data, rejects double-booked slots, and
// saves the booking into the store.
// What it connects to: src/lib/store.ts (getCollection + updateContent).
// Why it exists: this is the public entrance for new bookings; the admin
// reviews them in the dashboard and changes their status from "pending".
// New bookings are always created as `pending` — the admin confirms them
// (see PATCH /api/admin/bookings, which sends the confirmation e-mail).
// ─────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Pull every field out of the body, trimming text so it has no stray spaces.
  const name = typeof body.clientName === 'string' ? body.clientName.trim() : '';
  const email = typeof body.clientEmail === 'string' ? body.clientEmail.trim() : '';
  const serviceName =
    typeof body.serviceName === 'string' ? body.serviceName.trim() : '';
  const stylistName =
    typeof body.stylistName === 'string' ? body.stylistName.trim() : '';
  const date = typeof body.date === 'string' ? body.date.trim() : '';
  const time = typeof body.time === 'string' ? body.time.trim() : '';
  const phone = typeof body.clientPhone === 'string' ? body.clientPhone.trim() : '';
  const notes = typeof body.notes === 'string' ? body.notes.trim() : '';
  const serviceId = typeof body.serviceId === 'string' ? body.serviceId.trim() : '';
  const branch =
    typeof body.branch === 'string' ? body.branch.trim().toLowerCase() : '';
  const createdAt = typeof body.createdAt === 'string' ? body.createdAt : new Date().toISOString();

  // The essential fields must all be present…
  if (!name || !email || !serviceName || !date || !time) {
    return NextResponse.json(
      { error: 'clientName, clientEmail, serviceName, date and time are required' },
      { status: 400 }
    );
  }
  // …and the e-mail must look like an e-mail.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  // Conflict guard: reject a booking for a stylist+date+time that is already
  // taken by an active (non-cancelled) booking.
  if (stylistName) {
    const existing = await getCollection('bookings');
    const clash = existing.some(
      (b) =>
        b.date === date &&
        b.time === time &&
        b.stylistName === stylistName &&
        b.status !== 'cancelled'
    );
    if (clash) {
      return NextResponse.json(
        { error: 'Sorry, that slot has just been booked. Please pick another time.' },
        { status: 409 }
      );
    }
  }

  // Assemble the new booking — pending until an admin confirms it.
  const booking: Booking = {
    id: `bk-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
    serviceId,
    serviceName,
    stylistName,
    branch,
    date,
    time,
    clientName: name,
    clientEmail: email,
    clientPhone: phone,
    notes,
    status: 'pending',
    createdAt,
  };

  // Prepend it to the bookings list (newest first) and persist.
  await updateContent((current) => ({
    ...current,
    bookings: [booking, ...current.bookings],
  }));

  return NextResponse.json({ ok: true, id: booking.id });
}