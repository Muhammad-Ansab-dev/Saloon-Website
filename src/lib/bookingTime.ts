// ─────────────────────────────────────────────────────────────
// bookingTime.ts — shared salon-hours + date/time helpers used by
// every booking surface (BookingModal, ContactPage booking form).
// Centralising these keeps the two forms identical by construction.
//   HOURS               salon open/close per weekday (0=Sun … 6=Sat)
//   generateTimeSlots   → 30-min slot strings for a given weekday
//   toISODate           Date → "YYYY-MM-DD" (local time)
//   formatDisplayDate   "YYYY-MM-DD" → "September 15, 2026"
//   todayISO            today as "YYYY-MM-DD"
// ─────────────────────────────────────────────────────────────

/** [open, close) hours per weekday in 24h form. */
export const HOURS: Record<number, [number, number]> = {
  0: [12, 18], // Sunday
  1: [9, 20],  // Mon
  2: [9, 20],
  3: [9, 20],
  4: [9, 20],
  5: [9, 20],
  6: [10, 18], // Saturday
};

/** All 30-minute slots between a weekday's open and close hours. */
export function generateTimeSlots(dayOfWeek: number): string[] {
  const [open, close] = HOURS[dayOfWeek] ?? [9, 20];
  const slots: string[] = [];
  for (let h = open; h < close; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  return slots;
}

/** Local-time "YYYY-MM-DD" for a Date (avoids UTC date drift). */
export function toISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Human-friendly display for a "YYYY-MM-DD" string. */
export function formatDisplayDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Today's date as "YYYY-MM-DD". */
export const todayISO = toISODate(new Date());