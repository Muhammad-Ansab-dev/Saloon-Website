'use client';
// ---------------------------------------------------------------------------
// OverviewTab — live KPIs + revenue chart for the dashboard overview.
// Fetches real bookings and services from /api/admin/* and computes
// revenue from non-cancelled bookings × service price.
// ---------------------------------------------------------------------------
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DollarSign, CalendarRange, Users, Receipt } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Area, AreaChart, CartesianGrid, Line, LineChart, XAxis, YAxis, Tooltip } from 'recharts';
import { periodWindow } from '@/lib/dateWindows';
import { todayISO } from '@/lib/bookingTime';
import { DateField } from '@/components/dashboard/DateField';
import { SkeletonKpi, SkeletonPanel } from '@/components/dashboard/Skeleton';

type BookingRow = {
  id: string;
  serviceId?: string;
  serviceName: string;
  clientName: string;
  clientEmail: string;
  branch?: string;
  date: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
};
type ServiceRow = { id: string; name: string; price: number };

type RevenuePeriod = 'total' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
const PERIOD_LABEL: Record<RevenuePeriod, string> = {
  total: 'all time · aggregated',
  daily: 'per day · last 30 days',
  weekly: 'per week · last 8 weeks',
  monthly: 'per month · this year to date',
  yearly: 'per year · this calendar year',
  custom: 'per day · custom date range',
};

const revenueConfig = {
  revenue: { label: 'Revenue', color: 'oklch(0.488 0.243 264.376)' },
} satisfies ChartConfig;

const sparkConfig = {
  revenue:   { label: 'Revenue',   color: 'oklch(0.488 0.243 264.376)' },
  bookings:  { label: 'Bookings',  color: 'oklch(0.623 0.214 259.815)' },
  clients:   { label: 'Clients',   color: 'oklch(0.723 0.219 149.579)' },
  avg:       { label: 'Avg Value', color: 'oklch(0.637 0.237 25.331)' },
} satisfies ChartConfig;

const gbp = (n: number) => '£' + n.toLocaleString('en-GB');

function bucketKey(date: string, period: RevenuePeriod): string {
  if (period === 'custom') return date.slice(0, 10);
  if (period === 'total' || period === 'monthly') return date.slice(0, 7);
  const d = new Date(date + 'T00:00:00Z');
  if (period === 'daily') return d.toISOString().split('T')[0];
  if (period === 'weekly') {
    const day = (d.getUTCDay() + 6) % 7;
    return new Date(d.getTime() - day * 86400000).toISOString().split('T')[0];
  }
  return String(d.getUTCFullYear());
}

function bucketLabel(key: string, period: RevenuePeriod): string {
  if (period === 'custom' || period === 'daily') return new Date(key + 'T00:00:00Z').toLocaleDateString('en-US', { weekday: 'short' });
  if (period === 'weekly') return new Date(key + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  if (period === 'total' || period === 'monthly') return new Date(key + '-01T00:00:00Z').toLocaleDateString('en-US', { month: 'short' });
  return key;
}

export function OverviewTab({ branch }: { branch?: string }) {
  const [period, setPeriod] = useState<RevenuePeriod>('total');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [customOpen, setCustomOpen] = useState(false);
  const customWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!customOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      if (customWrapRef.current && !customWrapRef.current.contains(e.target as Node)) setCustomOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [customOpen]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [bRes, sRes] = await Promise.all([
        fetch('/api/admin/bookings'),
        fetch('/api/admin/services'),
      ]);
      if (!bRes.ok || !sRes.ok) throw new Error(`HTTP ${bRes.status}/${sRes.status}`);
      const bData = await bRes.json();
      const sData = await sRes.json();
      setBookings(Array.isArray(bData.items) ? bData.items : []);
      setServices(Array.isArray(sData.items) ? sData.items : []);
    } catch {
      setError('Could not load overview data — are you signed in?');
      setBookings([]); setServices([]);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  // When opened from a branch console, restrict to that branch's bookings.
  const scopedBookings = useMemo(
    () => (branch ? bookings.filter((b) => b.branch?.toLowerCase() === branch.toLowerCase()) : bookings),
    [bookings, branch]
  );

  const priceMap = useMemo(
    () => Object.fromEntries(services.map((s) => [s.id, s.price])),
    [services]
  );

  // Everything (KPIs, sparklines, revenue chart) is scoped to the selected period.
  const stats = useMemo(() => {
    const now = Date.now();
    const thisMonday = now - ((new Date(now).getUTCDay() + 6) % 7) * 86400000;

    const win = period === 'custom'
      ? (customFrom || customTo ? { start: customFrom || '0000-01-01', end: customTo || '9999-12-31' } : null)
      : periodWindow(period, now);
    const inWindow = (date: string) => {
      if (period === 'custom' && !win) return false;
      return (!win || (date >= win.start && date <= win.end));
    };

    // Calendar-aligned bucket keys (chronological).
    const allKeys: string[] = [];
    if (period === 'total') {
      allKeys.push(...[...new Set(scopedBookings.map((b) => b.date.slice(0, 7)))].sort());
    } else if (period === 'custom') {
      if (customFrom || customTo) {
        const from = customFrom || scopedBookings.map((b) => b.date).sort()[0] || todayISO();
        const to = customTo || todayISO();
        const d = new Date(from + 'T00:00:00Z');
        while (d.toISOString().split('T')[0] <= to) {
          allKeys.push(d.toISOString().split('T')[0]);
          d.setUTCDate(d.getUTCDate() + 1);
        }
      }
    } else if (period === 'daily') {
      for (let i = 29; i >= 0; i--) allKeys.push(new Date(now - i * 86400000).toISOString().split('T')[0]);
    } else if (period === 'weekly') {
      for (let i = 7; i >= 0; i--) allKeys.push(new Date(thisMonday - i * 7 * 86400000).toISOString().split('T')[0]);
    } else if (period === 'monthly') {
      const d = new Date(now);
      for (let m = 0; m <= d.getUTCMonth(); m++) allKeys.push(`${d.getUTCFullYear()}-${String(m + 1).padStart(2, '0')}`);
    } else {
      allKeys.push(...[...new Set(scopedBookings.map((b) => b.date.slice(0, 4)))].sort());
    }

    const revOf = new Map<string, number>();
    const cntOf = new Map<string, number>();
    const paidOf = new Map<string, number>();
    for (const b of scopedBookings) {
      if (!inWindow(b.date)) continue;
      const k = bucketKey(b.date, period);
      cntOf.set(k, (cntOf.get(k) || 0) + 1);
      if (b.status === 'cancelled') continue;
      revOf.set(k, (revOf.get(k) || 0) + (priceMap[b.serviceId || ''] ?? 50));
      paidOf.set(k, (paidOf.get(k) || 0) + 1);
    }

    const seen = new Set<string>();
    let prevAvg = 0;
    const bucketed = allKeys.map((k) => {
      const revenue = revOf.get(k) || 0;
      const paid = paidOf.get(k) || 0;
      const avg = paid > 0 ? Math.round(revenue / paid) : prevAvg;
      prevAvg = avg;
      for (const b of scopedBookings) {
        if (b.status !== 'cancelled' && inWindow(b.date) && bucketKey(b.date, period) === k) seen.add(b.clientEmail);
      }
      return { key: k, label: bucketLabel(k, period), revenue, bookings: cntOf.get(k) || 0, clients: seen.size, avg };
    });

    const paidTotal = [...paidOf.values()].reduce((s, v) => s + v, 0);
    return {
      bucketed,
      revenue: bucketed.reduce((s, e) => s + e.revenue, 0),
      appointments: scopedBookings.filter((b) => inWindow(b.date)).length,
      activeClients: seen.size,
      avg: paidTotal > 0 ? Math.round(bucketed.reduce((s, e) => s + e.revenue, 0) / paidTotal) : 0,
    };
  }, [scopedBookings, priceMap, period, customFrom, customTo]);

  if (loading) return (
    <div className="grid grid-cols-4 grid-rows-[repeat(6,minmax(0,1fr))] gap-4 flex-1 min-h-0">
      <SkeletonKpi className="col-start-1 row-start-1 row-span-2" />
      <SkeletonKpi className="col-start-2 row-start-1 row-span-2" />
      <SkeletonKpi className="col-start-3 row-start-1 row-span-2" />
      <SkeletonKpi className="col-start-4 row-start-1 row-span-2" />
      <SkeletonPanel className="col-span-4 col-start-1 row-start-3 row-span-4" />
    </div>
  );
  if (error) return (
    <div className="py-20 px-6 text-center text-sm text-muted-foreground">{error}</div>
  );

  const selectedTrend = stats.bucketed && stats.bucketed.length
    ? stats.bucketed
    : [{ key: '', label: 'No data', revenue: 0, bookings: 0, clients: 0, avg: 0 }];
const KPI_ITEMS: {
  label: string;
  value: string;
  icon: typeof DollarSign;
  dataKey: 'revenue' | 'bookings' | 'clients' | 'avg';
}[] = [
  { label: 'Total Revenue', value: gbp(stats.revenue), icon: DollarSign, dataKey: 'revenue' },
  { label: 'Appointments', value: stats.appointments.toLocaleString('en-US'), icon: CalendarRange, dataKey: 'bookings' },
  { label: 'Active Clients', value: stats.activeClients.toLocaleString('en-US'), icon: Users, dataKey: 'clients' },
  { label: 'Avg. Booking Value', value: gbp(stats.avg), icon: Receipt, dataKey: 'avg' },
];

  return (
    <div className="h-full flex flex-col gap-4 min-h-0 flex-1">
      {/* Period tabs — drive all values */}
      <div className="shrink-0 relative flex justify-end" ref={customWrapRef}>
        <Tabs value={period} onValueChange={(v) => { const next = v as RevenuePeriod; setPeriod(next); if (next !== 'custom') setCustomOpen(false); }}>
          <TabsList className="h-8">
            <TabsTrigger value="total" className="text-[10px] px-2 h-6">Total</TabsTrigger>
            <TabsTrigger value="daily" className="text-[10px] px-2 h-6">Daily</TabsTrigger>
            <TabsTrigger value="weekly" className="text-[10px] px-2 h-6">Weekly</TabsTrigger>
            <TabsTrigger value="monthly" className="text-[10px] px-2 h-6">Monthly</TabsTrigger>
            <TabsTrigger value="yearly" className="text-[10px] px-2 h-6">Yearly</TabsTrigger>
            <TabsTrigger value="custom" className="text-[10px] px-2 h-6" onClick={() => setCustomOpen((o) => (period === 'custom' ? !o : true))}>Custom</TabsTrigger>
          </TabsList>
        </Tabs>

        {period === 'custom' && customOpen && (
          <div className="absolute right-0 top-full mt-1 flex items-start gap-3 z-[60]">
            <DateField inline value={customFrom} onChange={(iso) => setCustomFrom(iso)} label="From" />
            <DateField inline value={customTo} onChange={(iso) => setCustomTo(iso)} label="To" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 grid-rows-[repeat(6,minmax(0,1fr))] gap-4 flex-1 min-h-0">
        {KPI_ITEMS.map((kpi, i) => (
          <Card
            key={kpi.label}
            className={`row-span-2 ${i === 0 ? 'col-start-1 row-start-1' : ''} ${i === 1 ? 'col-start-2 row-start-1' : ''} ${i === 2 ? 'col-start-3 row-start-1' : ''} ${i === 3 ? 'col-start-4 row-start-1' : ''}`}
          >
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.label}</CardTitle>
              <CardAction><kpi.icon className="w-4 h-4 text-muted-foreground/70" /></CardAction>
            </CardHeader>
            <CardContent>
                <span className="text-2xl font-semibold tabular-nums">{kpi.value}</span>
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

        {/* Revenue chart — full width, period switcher */}
        <Card className="col-span-4 row-span-4 col-start-1 row-start-3 flex flex-col min-h-0 overflow-hidden">
          <CardHeader className="shrink-0 pb-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="text-base">Revenue</CardTitle>
                <CardDescription>Bookings-generated revenue {PERIOD_LABEL[period]}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 p-0 overflow-hidden">
            <ChartContainer config={revenueConfig} className="h-full w-full aspect-auto">
              <AreaChart data={selectedTrend} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <defs>
                  <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="key" tickLine={false} axisLine={false} tickMargin={8} minTickGap={10}
                  tickFormatter={(k: string) => bucketLabel(k, period)} />
                <YAxis tickLine={false} axisLine={false} width={52} tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.6 }}
                  domain={[0, (dataMax: number) => (dataMax <= 0 ? 5 : Math.ceil(dataMax * 1.25))]}
                  tickFormatter={(v: number) => (v >= 1_000_000 ? '£' + (v / 1_000_000).toFixed(1) + 'M' : '£' + Math.round(v).toLocaleString('en-GB'))} />
                <Tooltip content={<ChartTooltipContent />} />
                <Area dataKey="revenue" type="monotone" fill="url(#fillRevenue)" stroke="var(--color-revenue)" strokeWidth={2} isAnimationActive={false} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}