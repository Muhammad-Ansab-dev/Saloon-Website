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
// In plain words: the analytics tabs ask things like "bookings from the last
// 30 days?" and this file turns those human labels into concrete start/end
// dates — so every dashboard tab agrees on the exact same range.
// ---------------------------------------------------------------------------

// Which time window the analytics want: total (all time), daily (last 30
// days), weekly (last 8 weeks), monthly (this year to date), yearly (this
// calendar year).
export type Period = 'total' | 'daily' | 'weekly' | 'monthly' | 'yearly';

// Shortcut: millisecond timestamp → UTC "YYYY-MM-DD" date key (booking dates
// are stored in UTC, so the window bounds are computed in UTC too).
const dayKey = (t: number) => new Date(t).toISOString().split('T')[0];

// Convert a period label into its inclusive start/end date keys.
// Params: period — which window to compute; nowMs — the reference moment
// (defaults to now; injectable for tests). Returns {start, end} as UTC
// "YYYY-MM-DD" strings, or null for "total" (no bounds needed).
export function periodWindow(period: Period, nowMs = Date.now()): { start: string; end: string } | null {
  if (period === 'total') return null;
  const now = new Date(nowMs);
  // Daily = the last 30 days ending today.
  if (period === 'daily') {
    return { start: dayKey(nowMs - 29 * 86400000), end: dayKey(nowMs) };
  }
  if (period === 'weekly') {
    // 8 weeks back to the most recent Monday (measured in UTC).
    const thisMonday = nowMs - ((now.getUTCDay() + 6) % 7) * 86400000;
    return { start: dayKey(thisMonday - 7 * 7 * 86400000), end: dayKey(nowMs) };
  }
  if (period === 'monthly') {
    // This calendar year from Jan 1st up to today.
    return { start: `${now.getUTCFullYear()}-01-01`, end: dayKey(nowMs) };
  }
  // Yearly = the whole current calendar year.
  return { start: `${now.getUTCFullYear()}-01-01`, end: `${now.getUTCFullYear()}-12-31` };
}
