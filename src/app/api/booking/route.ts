import { NextResponse } from 'next/server';
import { Booking, getCollection, updateContent } from '@/lib/store';

// Public booking submission from BookingModal. Validates the payload,
// rejects clashing bookings (same stylist + date + time), and appends to
// the bookings collection (admin sees it in the bookings inbox).
// New bookings are created as `pending` — the admin confirms them from
// the dashboard.
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

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
  const createdAt = typeof body.createdAt === 'string' ? body.createdAt : new Date().toISOString();

  if (!name || !email || !serviceName || !date || !time) {
    return NextResponse.json(
      { error: 'clientName, clientEmail, serviceName, date and time are required' },
      { status: 400 }
    );
  }
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

  const booking: Booking = {
    id: `bk-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
    serviceId,
    serviceName,
    stylistName,
    date,
    time,
    clientName: name,
    clientEmail: email,
    clientPhone: phone,
    notes,
    status: 'pending',
    createdAt,
  };

  await updateContent((current) => ({
    ...current,
    bookings: [booking, ...current.bookings],
  }));

  return NextResponse.json({ ok: true, id: booking.id });
}