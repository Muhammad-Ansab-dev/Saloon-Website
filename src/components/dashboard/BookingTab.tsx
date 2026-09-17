'use client';
// ---------------------------------------------------------------------------
// BookingTab — real bookings analytics + inbox for the dashboard.
// Fetches from /api/admin/bookings (DB) and computes KPIs, charts,
// and renders the full inbox table with status edits + delete.
// ---------------------------------------------------------------------------
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarRange, CheckCircle2, CheckCheck, Plus, Trash2, Loader2, Search, XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateField } from '@/components/dashboard/DateField';
import { AddBookingModal } from '@/components/dashboard/AddBookingModal';
import { periodWindow } from '@/lib/dateWindows';
import { todayISO } from '@/lib/bookingTime';
import {
  Area, AreaChart, CartesianGrid, Cell, Line, LineChart,
  Pie, PieChart, XAxis, YAxis, Tooltip,
} from 'recharts';

type BookingRow = {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  serviceName: string;
  stylistName?: string;
  date: string;
  time: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
};

type View = 'analytics' | 'list' | 'today';
type BookingPeriod = 'total' | 'daily' | 'weekly' | 'monthly' | 'yearly';
const PERIOD_LABEL: Record<BookingPeriod, string> = {
  total: 'all time · aggregated',
  daily: 'per day · last 30 days',
  weekly: 'per week · last 8 weeks',
  monthly: 'per month · this year to date',
  yearly: 'per year · this calendar year',
};

type ListFilter = 'all' | 'today' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
const LIST_FILTER_OPTIONS: { value: ListFilter; label: string }[] = [
  { value: 'all', label: 'All dates' },
  { value: 'today', label: 'Today' },
  { value: 'daily', label: 'Daily · last 30 days' },
  { value: 'weekly', label: 'Weekly · last 8 weeks' },
  { value: 'monthly', label: 'Monthly · this year to date' },
  { value: 'yearly', label: 'Yearly · this calendar year' },
  { value: 'custom', label: 'Custom date…' },
];

function trendKey(date: string, p: BookingPeriod): string {
  if (p === 'total' || p === 'monthly') return date.slice(0, 7);
  if (p === 'daily') return date;
  if (p === 'weekly') {
    const d = new Date(date + 'T00:00:00Z');
    const dow = (d.getUTCDay() + 6) % 7;
    return new Date(d.getTime() - dow * 86400000).toISOString().split('T')[0];
  }
  return date.slice(0, 4);
}

function trendLabel(key: string, p: BookingPeriod): string {
  if (p === 'daily' || p === 'weekly') {
    return new Date(key + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  if (p === 'total' || p === 'monthly') return new Date(key + '-01T00:00:00Z').toLocaleDateString('en-US', { month: 'short' });
  return key;
}

const STATUS_OPTIONS: { value: BookingRow['status']; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];
const STATUS_COLORS: Record<BookingRow['status'], string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  completed: 'bg-blue-50 text-blue-700 border-blue-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
};

const chartConfig = {
  bookings: { label: 'Bookings', color: 'oklch(0.704 0.191 22.216)' },
} satisfies ChartConfig;
const statusConfig = {
  confirmed: { label: 'Confirmed', color: 'oklch(0.723 0.219 149.579)' },
  completed: { label: 'Completed', color: 'oklch(0.707 0.165 254.624)' },
  cancelled: { label: 'Cancelled', color: 'oklch(0.637 0.237 25.331)' },
  pending:   { label: 'Pending',   color: 'oklch(0.795 0.184 86.047)' },
} satisfies ChartConfig;
const sparkConfig = {
  total:     { label: 'Total',     color: 'oklch(0.488 0.243 264.376)' },
  confirmed: { label: 'Confirmed', color: 'oklch(0.723 0.219 149.579)' },
  completed: { label: 'Completed', color: 'oklch(0.707 0.165 254.624)' },
  cancelled: { label: 'Cancelled', color: 'oklch(0.637 0.237 25.331)' },
} satisfies ChartConfig;

function fmt(n: number) { return n.toLocaleString('en-US'); }

const PAGE_SIZE = 10;

export function BookingTab() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<View>('analytics');
  const [period, setPeriod] = useState<BookingPeriod>('total');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<ListFilter>('all');
  const [customDate, setCustomDate] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<BookingRow | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [trendStatus, setTrendStatus] = useState<'all' | BookingRow['status']>('all');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/admin/bookings');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setBookings(Array.isArray(data.items) ? data.items : []);
    } catch { setError('Could not load bookings — are you signed in?'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [view, search, dateFilter, customDate]);

  // ── Compute analytics ──────────────────────────────────────────────────
  const stats = useMemo(() => {
    const now = Date.now();

    // Window anchor per period (start/end date keys of the visible range).
    const thisMonday = now - ((new Date(now).getUTCDay() + 6) % 7) * 86400000;
    const win = periodWindow(period, now);
    const inWindow = (date: string) => (!win || (date >= win.start && date <= win.end));

    // Bucket keys for the period.
    const allKeys: string[] = [];
    if (period === 'total') {
      const months = new Set(bookings.map((b) => b.date.slice(0, 7)));
      allKeys.push(...[...months].sort());
    } else if (period === 'daily') {
      for (let i = 29; i >= 0; i--) allKeys.push(new Date(now - i * 86400000).toISOString().split('T')[0]);
    } else if (period === 'weekly') {
      for (let i = 7; i >= 0; i--) allKeys.push(new Date(thisMonday - i * 7 * 86400000).toISOString().split('T')[0]);
    } else if (period === 'monthly') {
      const d = new Date(now);
      for (let m = 0; m <= d.getUTCMonth(); m++) allKeys.push(`${d.getUTCFullYear()}-${String(m + 1).padStart(2, '0')}`);
    } else {
      const years = new Set(bookings.map((b) => b.date.slice(0, 4)));
      allKeys.push(...[...years].sort());
    }

    // Per-bucket counts by status (whole window, before status filter).
    const bucketCounts = new Map<string, { total: number; pending: number; confirmed: number; completed: number; cancelled: number }>();
    for (const b of bookings) {
      if (!inWindow(b.date)) continue;
      const k = trendKey(b.date, period);
      const e = bucketCounts.get(k) ?? { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
      e.total += 1;
      e[b.status] += 1;
      bucketCounts.set(k, e);
    }

    const bucketed = allKeys.map((k) => ({
      label: trendLabel(k, period),
      key: k,
      ...(bucketCounts.get(k) ?? { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 }),
    }));

    // KPIs are the aggregate of the buckets (≈ window totals by status).
    const statusCounts = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
    let total = 0;
    for (const e of bucketed) {
      total += e.total;
      statusCounts.pending += e.pending;
      statusCounts.confirmed += e.confirmed;
      statusCounts.completed += e.completed;
      statusCounts.cancelled += e.cancelled;
    }

    // Status-scoped trend series (drives the area chart).
    const bookingsTrend = bucketed.map((e) => ({
      label: e.label,
      bookings: trendStatus === 'all' ? e.total : e[trendStatus],
      full: e,
    }));

    const statusData = [
      { key: 'confirmed', name: 'Confirmed', value: statusCounts.confirmed },
      { key: 'completed', name: 'Completed', value: statusCounts.completed },
      { key: 'cancelled', name: 'Cancelled', value: statusCounts.cancelled },
      { key: 'pending',   name: 'Pending',   value: statusCounts.pending },
    ];

    return { total, statusCounts, statusData, bucketed, bookingsTrend };
  }, [bookings, period, trendStatus]);

  // ── List filtering (search + date preset, All/Today Bookings views) ─────
  const filteredBookings = useMemo(() => {
    const activeFilter: ListFilter = view === 'today' ? 'today' : dateFilter;
    const win =
      activeFilter === 'daily' || activeFilter === 'weekly' || activeFilter === 'monthly' || activeFilter === 'yearly'
        ? periodWindow(activeFilter)
        : null;
    const q = search.trim().toLowerCase();
    return bookings.filter((b) => {
      if (activeFilter === 'today') {
        if (b.date !== todayISO()) return false;
      } else if (activeFilter === 'custom') {
        if (!customDate || b.date !== customDate) return false;
      } else if (win) {
        if (b.date < win.start || b.date > win.end) return false;
      }
      if (q) {
        const hay = `${b.clientName} ${b.clientEmail} ${b.serviceName} ${b.stylistName || ''} ${b.date} ${b.time}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [bookings, search, dateFilter, customDate, view]);

  // ── Status update / delete ─────────────────────────────────────────────
  const updateStatus = async (id: string, status: BookingRow['status']) => {
    const res = await fetch('/api/admin/bookings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, patch: { status } }) });
    if (res.ok) setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
  };
  const remove = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      const res = await fetch('/api/admin/bookings', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: deleteTarget.id }) });
      if (res.ok) setBookings((prev) => prev.filter((b) => b.id !== deleteTarget.id));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
      <Loader2 className="w-4 h-4 animate-spin" /> Loading bookings…
    </div>
  );
  if (error && bookings.length === 0) return (
    <div className="py-20 px-6 text-center text-sm text-muted-foreground">{error}</div>
  );

  const BOOKING_KPIS: {
    label: string;
    value: string;
    icon: typeof CalendarRange;
    dataKey: 'total' | 'confirmed' | 'completed' | 'cancelled';
  }[] = [
    { label: 'Total Bookings', value: fmt(stats.total), icon: CalendarRange, dataKey: 'total' },
    { label: 'Confirmed',      value: fmt(stats.statusCounts.confirmed || 0), icon: CheckCircle2, dataKey: 'confirmed' },
    { label: 'Completed',      value: fmt(stats.statusCounts.completed || 0), icon: CheckCheck, dataKey: 'completed' },
    { label: 'Cancelled',      value: fmt(stats.statusCounts.cancelled || 0), icon: XCircle, dataKey: 'cancelled' },
  ];

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filteredBookings.slice(pageStart, pageStart + PAGE_SIZE);

  return (
    <div className="h-full flex flex-col gap-4 min-h-0 flex-1">
      {/* Sub-view toggle (left) + period tabs (right — drive all values) */}
      <div className="shrink-0 flex items-center gap-3">
        <Tabs value={view} onValueChange={(v) => setView(v as View)}>
          <TabsList className="h-8">
            <TabsTrigger value="analytics" className="text-[10px] px-2 h-6">Analytics</TabsTrigger>
            <TabsTrigger value="list" className="text-[10px] px-2 h-6">All Bookings</TabsTrigger>
            <TabsTrigger value="today" className="text-[10px] px-2 h-6">Today Bookings</TabsTrigger>
          </TabsList>
        </Tabs>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-full bg-primary px-3 text-[11px] font-bold text-primary-foreground transition-opacity hover:opacity-90 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Add Booking
        </button>
        {view === 'analytics' && (
          <Tabs value={period} onValueChange={(v) => setPeriod(v as BookingPeriod)}>
            <TabsList className="h-8">
              <TabsTrigger value="total" className="text-[10px] px-2 h-6">Total</TabsTrigger>
              <TabsTrigger value="daily" className="text-[10px] px-2 h-6">Daily</TabsTrigger>
              <TabsTrigger value="weekly" className="text-[10px] px-2 h-6">Weekly</TabsTrigger>
              <TabsTrigger value="monthly" className="text-[10px] px-2 h-6">Monthly</TabsTrigger>
              <TabsTrigger value="yearly" className="text-[10px] px-2 h-6">Yearly</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>

      {view === 'analytics' ? (
        /* ── Analytics grid ── */
        <div className="grid grid-cols-4 grid-rows-[repeat(6,minmax(0,1fr))] gap-4 flex-1 min-h-0">
          {/* KPI cards */}
          {BOOKING_KPIS.map((kpi, i) => (
            <Card key={kpi.label} className={`row-span-2 ${i === 0 ? 'col-start-1 row-start-1' : ''} ${i === 1 ? 'col-start-2 row-start-1' : ''} ${i === 2 ? 'col-start-3 row-start-1' : ''} ${i === 3 ? 'col-start-4 row-start-1' : ''}`}>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.label}</CardTitle>
                <CardAction><kpi.icon className="w-4 h-4 text-muted-foreground/70" /></CardAction>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-semibold tabular-nums">{kpi.value}</span>
                </div>
                <div className="mt-2 h-10 -mx-1">
                  <ChartContainer config={sparkConfig} className="h-full w-full">
                    <LineChart data={stats.bucketed}>
                      <XAxis dataKey="key" hide />
                      <YAxis hide domain={['auto', 'auto']} />
                      <Line
                        type="monotone"
                        dataKey={kpi.dataKey}
                        stroke={`var(--color-${kpi.dataKey})`}
                        strokeWidth={1.5}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Bookings trend — period switcher */}
          <Card className="col-span-3 row-span-4 col-start-1 row-start-3 flex flex-col min-h-0 overflow-hidden">
            <CardHeader className="shrink-0 pb-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">Bookings Trend</CardTitle>
                  <CardDescription>Bookings {PERIOD_LABEL[period]}{trendStatus !== 'all' ? ` — ${trendStatus}` : ''}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={trendStatus}
                    onChange={(e) => setTrendStatus(e.target.value as 'all' | BookingRow['status'])}
                    className="h-[26px] px-2 text-[11px] font-medium capitalize rounded-md border border-neutral-200 bg-white text-neutral-700 outline-none cursor-pointer"
                  >
                    <option value="all">All statuses</option>
                    {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 p-0 overflow-hidden">
              <ChartContainer config={chartConfig} className="h-full w-full aspect-auto">
                <AreaChart data={stats.bookingsTrend} margin={{ left: 8, right: 8 }}>
                  <defs>
                    <linearGradient id="fillDailyBookings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-bookings)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--color-bookings)" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} padding={{ left: 12, right: 12 }} />
                  <YAxis hide domain={[0, (dataMax: number) => (dataMax <= 0 ? 5 : Math.ceil(dataMax * 1.25))]} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Area dataKey="bookings" type="monotone" fill="url(#fillDailyBookings)" stroke="var(--color-bookings)" strokeWidth={2} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Status donut */}
          <Card className="col-start-4 row-start-3 row-span-4 flex flex-col min-h-0 overflow-hidden">
            <CardHeader className="shrink-0 pb-2">
              <CardTitle className="text-base">Booking Status</CardTitle>
              <CardDescription>Share of bookings by status</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 p-0 flex flex-col items-center justify-center overflow-hidden">
              <ChartContainer config={statusConfig} className="aspect-square max-h-[200px] w-full">
                <PieChart>
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                  <Pie data={stats.statusData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={84} strokeWidth={5}>
                    {stats.statusData.map((entry) => (
                      <Cell key={entry.key} fill={`var(--color-${entry.key})`} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pt-2 pb-2 px-3">
                {stats.statusData.map((entry) => (
                  <div key={entry.key} className="flex items-center gap-1.5 text-xs">
                    <span className="h-2 w-2 shrink-0 rounded-[2px]" style={{ backgroundColor: statusConfig[entry.key as keyof typeof statusConfig].color }} />
                    <span className="text-muted-foreground">{entry.name}</span>
                    <span className="font-medium tabular-nums">{fmt(entry.value)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* ── Booking list table ── */
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-card border border-border rounded-lg">
          {/* Filter bar — search + date preset */}
          <div className="shrink-0 flex items-center gap-2 border-b border-border p-3">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search bookings…"
                className="h-8 w-full rounded-md border border-border bg-card pl-8 pr-3 text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40"
              />
            </div>
            {view === 'list' ? (
              <>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as ListFilter)}
                  className="h-8 px-2 text-[11px] font-medium rounded-md border border-border bg-card text-foreground outline-none cursor-pointer"
                >
                  {LIST_FILTER_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {dateFilter === 'custom' && (
                  <DateField value={customDate} onChange={setCustomDate} placeholder="Pick a date" />
                )}
              </>
            ) : (
              <span className="h-8 inline-flex items-center rounded-md border border-border bg-muted px-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Today
              </span>
            )}
            {(search || (view === 'list' && dateFilter !== 'all')) && (
              <button
                type="button"
                onClick={() => { setSearch(''); setDateFilter('all'); setCustomDate(''); }}
                className="h-8 px-2 text-[11px] font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground uppercase text-[10px] tracking-[0.15em]">
                  <th className="px-3 py-3 font-semibold">Client</th>
                  <th className="px-3 py-3 font-semibold">Service</th>
                  <th className="px-3 py-3 font-semibold">Stylist</th>
                  <th className="px-3 py-3 font-semibold">When</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-1 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.length === 0 ? (
                  <tr><td colSpan={6} className="px-3 py-12 text-center text-muted-foreground">{bookings.length === 0 ? 'No bookings found.' : 'No bookings match your filters.'}</td></tr>
                ) : pageItems.map((b) => (
                  <tr key={b.id} className="border-b border-border align-top">
                    <td className="px-3 py-3">
                      <div className="font-semibold">{b.clientName}</div>
                      <div className="text-muted-foreground mt-0.5">{b.clientEmail}</div>
                    </td>
                    <td className="px-3 py-3">{b.serviceName}</td>
                    <td className="px-3 py-3 text-muted-foreground">{b.stylistName || '—'}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="font-semibold">{b.date}</div>
                      <div className="text-muted-foreground">{b.time}</div>
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={b.status}
                        onChange={(e) => updateStatus(b.id, e.target.value as BookingRow['status'])}
                        className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider border rounded-full cursor-pointer ${STATUS_COLORS[b.status]}`}
                      >
                        {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button onClick={() => setDeleteTarget(b)} className="p-1.5 text-muted-foreground hover:text-destructive cursor-pointer" aria-label={`Delete ${b.clientName}`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredBookings.length > 0 && (
            <div className="shrink-0 flex items-center justify-between gap-3 border-t border-border px-3 py-2">
              <span className="text-[11px] text-muted-foreground">
                Showing {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filteredBookings.length)} of {filteredBookings.length}
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
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 cursor-pointer"
          role="dialog"
          aria-modal="true"
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-black p-6 text-white shadow-2xl cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-editorial text-xl font-black uppercase tracking-tight">
              Delete booking
            </h2>
            <p className="mt-3 text-xs leading-relaxed text-neutral-400">
              Remove the booking for{' '}
              <span className="font-semibold text-white">{deleteTarget.clientName}</span>
              {' '}— {deleteTarget.serviceName} on{' '}
              <span className="font-semibold text-white">{deleteTarget.date} {deleteTarget.time}</span>?
              This action cannot be undone.
            </p>
            <div className="mt-7 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="h-9 px-4 rounded-full text-xs font-semibold text-neutral-400 transition-colors hover:text-white disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={remove}
                disabled={deleting}
                className="h-9 px-6 rounded-full bg-white text-black text-xs font-bold transition-colors hover:bg-white hover:text-red-500 disabled:opacity-50 cursor-pointer"
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <AddBookingModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={(b) => setBookings((prev) => [b, ...prev])}
      />
    </div>
  );
}
