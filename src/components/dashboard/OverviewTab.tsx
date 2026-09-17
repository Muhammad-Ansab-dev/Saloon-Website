'use client';
// ---------------------------------------------------------------------------
// OverviewTab — live KPIs + revenue chart for the dashboard overview.
// Fetches real bookings and services from /api/admin/* and computes
// revenue from non-cancelled bookings × service price.
// ---------------------------------------------------------------------------
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Euro, CalendarRange, Users, Receipt, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Area, AreaChart, CartesianGrid, Line, LineChart, XAxis, YAxis, Tooltip } from 'recharts';
import { periodWindow } from '@/lib/dateWindows';

type BookingRow = {
  id: string;
  serviceId?: string;
  serviceName: string;
  clientName: string;
  clientEmail: string;
  date: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
};
type ServiceRow = { id: string; name: string; price: number };

type RevenuePeriod = 'total' | 'daily' | 'weekly' | 'monthly' | 'yearly';
const PERIOD_LABEL: Record<RevenuePeriod, string> = {
  total: 'all time · aggregated',
  daily: 'per day · last 30 days',
  weekly: 'per week · last 8 weeks',
  monthly: 'per month · this year to date',
  yearly: 'per year · this calendar year',
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

const usd = (n: number) => 'USD ' + n.toLocaleString('en-US');

function bucketKey(date: string, period: RevenuePeriod): string {
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
  if (period === 'daily') return new Date(key + 'T00:00:00Z').toLocaleDateString('en-US', { weekday: 'short' });
  if (period === 'weekly') return new Date(key + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  if (period === 'total' || period === 'monthly') return new Date(key + '-01T00:00:00Z').toLocaleDateString('en-US', { month: 'short' });
  return key;
}

export function OverviewTab() {
  const [period, setPeriod] = useState<RevenuePeriod>('total');
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, sRes] = await Promise.all([
        fetch('/api/admin/bookings'),
        fetch('/api/admin/services'),
      ]);
      const bData = await bRes.json();
      const sData = await sRes.json();
      setBookings(Array.isArray(bData.items) ? bData.items : []);
      setServices(Array.isArray(sData.items) ? sData.items : []);
    } catch {
      setBookings([]); setServices([]);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const priceMap = useMemo(
    () => Object.fromEntries(services.map((s) => [s.id, s.price])),
    [services]
  );

  // Everything (KPIs, sparklines, revenue chart) is scoped to the selected period.
  const stats = useMemo(() => {
    const now = Date.now();
    const thisMonday = now - ((new Date(now).getUTCDay() + 6) % 7) * 86400000;

    const win = periodWindow(period, now);
    const inWindow = (date: string) => (!win || (date >= win.start && date <= win.end));

    // Calendar-aligned bucket keys (chronological).
    const allKeys: string[] = [];
    if (period === 'total') {
      allKeys.push(...[...new Set(bookings.map((b) => b.date.slice(0, 7)))].sort());
    } else if (period === 'daily') {
      for (let i = 29; i >= 0; i--) allKeys.push(new Date(now - i * 86400000).toISOString().split('T')[0]);
    } else if (period === 'weekly') {
      for (let i = 7; i >= 0; i--) allKeys.push(new Date(thisMonday - i * 7 * 86400000).toISOString().split('T')[0]);
    } else if (period === 'monthly') {
      const d = new Date(now);
      for (let m = 0; m <= d.getUTCMonth(); m++) allKeys.push(`${d.getUTCFullYear()}-${String(m + 1).padStart(2, '0')}`);
    } else {
      allKeys.push(...[...new Set(bookings.map((b) => b.date.slice(0, 4)))].sort());
    }

    const revOf = new Map<string, number>();
    const cntOf = new Map<string, number>();
    const paidOf = new Map<string, number>();
    for (const b of bookings) {
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
      for (const b of bookings) {
        if (b.status !== 'cancelled' && inWindow(b.date) && bucketKey(b.date, period) === k) seen.add(b.clientEmail);
      }
      return { key: k, label: bucketLabel(k, period), revenue, bookings: cntOf.get(k) || 0, clients: seen.size, avg };
    });

    const paidTotal = [...paidOf.values()].reduce((s, v) => s + v, 0);
    return {
      bucketed,
      revenue: bucketed.reduce((s, e) => s + e.revenue, 0),
      appointments: bookings.filter((b) => inWindow(b.date)).length,
      activeClients: seen.size,
      avg: paidTotal > 0 ? Math.round(bucketed.reduce((s, e) => s + e.revenue, 0) / paidTotal) : 0,
    };
  }, [bookings, priceMap, period]);

  if (loading) return (
    <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
      <Loader2 className="w-4 h-4 animate-spin" /> Loading overview…
    </div>
  );

  const selectedTrend = stats.bucketed && stats.bucketed.length
    ? stats.bucketed
    : [{ key: '', label: 'No data', revenue: 0, bookings: 0, clients: 0, avg: 0 }];
const KPI_ITEMS: {
  label: string;
  value: string;
  icon: typeof Euro;
  dataKey: 'revenue' | 'bookings' | 'clients' | 'avg';
}[] = [
  { label: 'Total Revenue', value: usd(stats.revenue), icon: Euro, dataKey: 'revenue' },
  { label: 'Appointments', value: stats.appointments.toLocaleString('en-US'), icon: CalendarRange, dataKey: 'bookings' },
  { label: 'Active Clients', value: stats.activeClients.toLocaleString('en-US'), icon: Users, dataKey: 'clients' },
  { label: 'Avg. Booking Value', value: usd(stats.avg), icon: Receipt, dataKey: 'avg' },
];

  return (
    <div className="h-full flex flex-col gap-4 min-h-0 flex-1">
      {/* Period tabs — drive all values */}
      <div className="shrink-0 flex items-center">
        <Tabs value={period} onValueChange={(v) => setPeriod(v as RevenuePeriod)} className="ml-auto">
          <TabsList className="h-8">
            <TabsTrigger value="total" className="text-[10px] px-2 h-6">Total</TabsTrigger>
            <TabsTrigger value="daily" className="text-[10px] px-2 h-6">Daily</TabsTrigger>
            <TabsTrigger value="weekly" className="text-[10px] px-2 h-6">Weekly</TabsTrigger>
            <TabsTrigger value="monthly" className="text-[10px] px-2 h-6">Monthly</TabsTrigger>
            <TabsTrigger value="yearly" className="text-[10px] px-2 h-6">Yearly</TabsTrigger>
          </TabsList>
        </Tabs>
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
              <AreaChart data={selectedTrend} margin={{ left: 8, right: 8 }}>
                <defs>
                  <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={16} padding={{ left: 12, right: 12 }} />
                <YAxis hide domain={[0, (dataMax: number) => (dataMax <= 0 ? 5 : Math.ceil(dataMax * 1.25))]} />
                <Tooltip content={<ChartTooltipContent />} />
                <Area dataKey="revenue" type="monotone" fill="url(#fillRevenue)" stroke="var(--color-revenue)" strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}