// ---------------------------------------------------------------------------
// dateWindows.ts — shared period→date-window mapping for the dashboard.
// Keeps the Booking and Overview tabs (and the All Bookings list filter)
// using identical ranges:
//   total   → no bound (all time)
//   daily   → last 30 days (up to today)
//   weekly  → last 8 weeks (Mondays, up to today)
//   monthly → this year to date
//   yearly  → current calendar year
// Keys are UTC "YYYY-MM-DD" strings, matching how booking dates are stored.
// ---------------------------------------------------------------------------

export type Period = 'total' | 'daily' | 'weekly' | 'monthly' | 'yearly';

const dayKey = (t: number) => new Date(t).toISOString().split('T')[0];

export function periodWindow(period: Period, nowMs = Date.now()): { start: string; end: string } | null {
  if (period === 'total') return null;
  const now = new Date(nowMs);
  if (period === 'daily') {
    return { start: dayKey(nowMs - 29 * 86400000), end: dayKey(nowMs) };
  }
  if (period === 'weekly') {
    const thisMonday = nowMs - ((now.getUTCDay() + 6) % 7) * 86400000;
    return { start: dayKey(thisMonday - 7 * 7 * 86400000), end: dayKey(nowMs) };
  }
  if (period === 'monthly') {
    return { start: `${now.getUTCFullYear()}-01-01`, end: dayKey(nowMs) };
  }
  return { start: `${now.getUTCFullYear()}-01-01`, end: `${now.getUTCFullYear()}-12-31` };
}
