'use client';
// ─────────────────────────────────────────────────────────────
// NotificationsPanel — dashboard "Notifications" tab. A focused
// inbox of PENDING bookings only, scoped to the present day and
// all later dates. Supports day-of-week filters (Today, Monday…
// Sunday), a single custom date, free-text search across client/
// service/stylist/branch, and 10-row pagination.
// ─────────────────────────────────────────────────────────────
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CalendarClock, MailCheck, RefreshCw, Search } from 'lucide-react';
import { DateField } from '@/components/dashboard/DateField';
import { SkeletonLine, SkeletonTableCard } from '@/components/dashboard/Skeleton';
import { todayISO } from '@/lib/bookingTime';

type BookingRow = {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  serviceName: string;
  stylistName?: string;
  branch?: string;
  date: string;
  time: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
};

type DayFilter = 'all' | 'today' | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 'custom';

const DAY_OPTIONS: { value: DayFilter; label: string }[] = [
  { value: 'all', label: 'All upcoming days' },
  { value: 'today', label: 'Today' },
  { value: 1, label: 'Mondays' },
  { value: 2, label: 'Tuesdays' },
  { value: 3, label: 'Wednesdays' },
  { value: 4, label: 'Thursdays' },
  { value: 5, label: 'Fridays' },
  { value: 6, label: 'Saturdays' },
  { value: 0, label: 'Sundays' },
  { value: 'custom', label: 'Custom date…' },
];

const PAGE_SIZE = 10;

const NOTIF_STATUS_OPTIONS: { value: 'pending' | 'confirmed' | 'cancelled'; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'cancelled', label: 'Cancelled' },
];
const NOTIF_STATUS_COLORS: Record<'pending' | 'confirmed' | 'cancelled', string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
};

export function NotificationsPanel({ branch }: { branch?: string }) {
  // All bookings fetched from the API, plus load/refresh/error flags. When the
  // panel is opened inside a branch console, only that branch's rows are kept.
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  // Filters: free-text search, day-of-week preset, custom single date, and the
  // current page of the table.
  const [search, setSearch] = useState('');
  const [dayFilter, setDayFilter] = useState<DayFilter>('all');
  const [customDate, setCustomDate] = useState('');
  const [page, setPage] = useState(1);
  // The status-change toast message; auto-clears itself after 4 seconds.
  const [toast, setToast] = useState('');
  const toastTimer = useRef<number | null>(null);

  // Show a transient toast and reset its 4-second auto-hide timer.
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 4000);
  }, []);

  // Fetch all bookings; the optional `silent` flag skips the full spinner, which
  // the Refresh button relies on. Branch consoles filter the rows locally.
  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else { setLoading(true); setError(''); }
    try {
      const res = await fetch('/api/admin/bookings', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const items = Array.isArray(data.items) ? data.items : [];
      setBookings(
        branch
          ? items.filter((booking: BookingRow) => booking.branch?.toLowerCase() === branch.toLowerCase())
          : items
      );
    } catch {
      if (!silent) setError('Could not load bookings — are you signed in?');
    } finally {
      if (silent) setRefreshing(false);
      else setLoading(false);
    }
  }, [branch]);
  // Load once on mount, and jump back to page 1 whenever a filter changes.
  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, dayFilter, customDate]);

  // This inbox only ever looks at PENDING bookings dated today or later,
  // sorted by due date then time.
  const pendingUpcoming = useMemo(() => {
    const today = todayISO();
    return bookings
      .filter((b) => b.status === 'pending' && b.date >= today)
      .sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)));
  }, [bookings]);

  // Apply the day-of-week, custom-date and search filters on top of the pending set.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return pendingUpcoming.filter((b) => {
      if (dayFilter === 'today') {
        if (b.date !== todayISO()) return false;
      } else if (dayFilter === 'custom') {
        if (!customDate || b.date !== customDate) return false;
      } else if (dayFilter !== 'all') {
        if (new Date(b.date + 'T00:00:00Z').getUTCDay() !== dayFilter) return false;
      }
      if (q) {
        const hay = `${b.clientName} ${b.clientEmail} ${b.serviceName} ${b.stylistName || ''} ${b.branch || ''} ${b.date} ${b.time} ${b.notes || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [pendingUpcoming, search, dayFilter, customDate]);

  // Pagination math for the 10-row pages.
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  // Human-readable date like "Monday, Sep 20" for the table's "When" column.
  const fmtDay = (date: string) =>
    new Date(date + 'T00:00:00Z').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  // PATCH the new status. Confirming triggers the API to send the confirmation
  // email; the response's confirmationEmail field tells us whether that worked,
  // and we surface the result in a toast.
  const updateStatus = async (id: string, status: 'pending' | 'confirmed' | 'cancelled') => {
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, patch: { status } }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        // A handled booking leaves the pending inbox (this tab shows pending only).
        setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
        if (status === 'confirmed') {
          if (data.confirmationEmail === 'sent') showToast('Booking confirmed — confirmation email sent to the client.');
          else if (data.confirmationEmail === 'error') showToast('Booking confirmed — but the confirmation email failed to send.');
          else showToast('Booking confirmed.');
        } else {
          showToast(status === 'cancelled' ? 'Booking cancelled.' : 'Booking status updated.');
        }
      } else {
        showToast(data.error || 'Could not update the booking status.');
      }
    } catch {
      showToast('Could not update the booking status.');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden rounded-lg bg-card border border-border">
        <div className="flex items-center gap-2 border-b border-border p-3">
          <SkeletonLine className="h-8 flex-1 rounded-md" />
          <SkeletonLine className="h-8 w-40 max-w-[40%] rounded-md" />
          <SkeletonLine className="h-8 w-24 rounded-md" />
        </div>
        <SkeletonTableCard rows={7} />
      </div>
    );
  }
  if (error && bookings.length === 0) return (
    <div className="py-20 px-6 text-center text-sm text-muted-foreground">{error}</div>
  );

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-3">
      {/* Summary strip */}
      <div className="shrink-0 flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3">
        <CalendarClock className="w-4 h-4 text-primary" />
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground tabular-nums">{pendingUpcoming.length}</span>
          {' '}pending bookings from today onward
        </p>
      </div>

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden rounded-lg bg-card border border-border">
        {/* Filter bar — search + day filter */}
        <div className="shrink-0 flex items-center gap-2 border-b border-border p-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search pending bookings…"
              className="h-8 w-full rounded-md border border-border bg-card pl-8 pr-3 text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40"
            />
          </div>
          <select
            value={String(dayFilter)}
            onChange={(e) => {
              const v = e.target.value;
              setDayFilter(v === 'all' || v === 'today' || v === 'custom' ? v : Number(v) as DayFilter);
            }}
            className="h-8 px-2 text-[11px] font-medium rounded-md border border-border bg-card text-foreground outline-none cursor-pointer"
          >
            {DAY_OPTIONS.map((o) => <option key={String(o.value)} value={String(o.value)}>{o.label}</option>)}
          </select>
          {dayFilter === 'custom' && (
            <DateField value={customDate} onChange={setCustomDate} placeholder="Pick a date" minDate={todayISO()} />
          )}
          {(search || dayFilter !== 'all') && (
            <button
              type="button"
              onClick={() => { setSearch(''); setDayFilter('all'); setCustomDate(''); }}
              className="h-8 px-2 text-[11px] font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={() => load(true)}
            title="Reload bookings from the database"
            className="h-8 inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {/* Pending bookings table */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground uppercase text-[10px] tracking-[0.15em]">
                <th className="px-3 py-3 font-semibold">Client</th>
                <th className="px-3 py-3 font-semibold">Service</th>
                <th className="px-3 py-3 font-semibold">Stylist</th>
                <th className="px-3 py-3 font-semibold">Branch</th>
                <th className="px-3 py-3 font-semibold">When</th>
                <th className="px-3 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-3 py-12 text-center text-muted-foreground">
                  {pendingUpcoming.length === 0 ? 'No pending bookings from today onward.' : 'No pending bookings match your filters.'}
                </td></tr>
              ) : pageItems.map((b) => (
                <tr key={b.id} className="border-b border-border align-top">
                  <td className="px-3 py-3">
                    <div className="font-semibold">{b.clientName}</div>
                    <div className="text-muted-foreground mt-0.5">{b.clientEmail}</div>
                  </td>
                  <td className="px-3 py-3">{b.serviceName}</td>
                  <td className="px-3 py-3 text-muted-foreground">{b.stylistName || '—'}</td>
                  <td className="px-3 py-3 text-xs uppercase text-muted-foreground">
                    {b.branch ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                        {b.branch}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="font-semibold">{fmtDay(b.date)}</div>
                    <div className="text-muted-foreground">{b.time}</div>
                  </td>
                  <td className="px-3 py-3">
                    <select
                      value={b.status}
                      onChange={(e) => updateStatus(b.id, e.target.value as 'pending' | 'confirmed' | 'cancelled')}
                      className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider border rounded-full cursor-pointer ${NOTIF_STATUS_COLORS[b.status as 'pending' | 'confirmed' | 'cancelled']}`}
                    >
                      {NOTIF_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination — 10 per page */}
        {filtered.length > 0 && (
          <div className="shrink-0 flex items-center justify-between gap-3 border-t border-border px-3 py-2">
            <span className="text-[11px] text-muted-foreground">
              Showing {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filtered.length)} of {filtered.length} pending
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="h-7 px-3 rounded-full border border-border text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40 cursor-pointer"
              >
                Prev
              </button>
              <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="h-7 px-3 rounded-full border border-border text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Status-change toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-[70] flex items-center gap-2 rounded-lg border border-emerald-300/40 bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-800 shadow-lg">
          <MailCheck className="w-4 h-4" />
          {toast}
        </div>
      )}
    </div>
  );
}