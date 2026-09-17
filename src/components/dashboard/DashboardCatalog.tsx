'use client';
// ---------------------------------------------------------------------------
// DashboardCatalog — real Services + Stylists data for the dashboard.
// Fetches the same /api/admin/{services|stylists} store the dashboard manages and
// lists each row read-only with its name + role/category + price (services).
// If the store can't be reached it surfaces a clear "Database not found,
// PostgreSQL is not running" error card instead of dummy data.
// ---------------------------------------------------------------------------
import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, Boxes, Database } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type CatRow = { id: string; name: string; title: string | null; price: number | null };

export function DashboardCatalog({ kind }: { kind: 'services' | 'stylists' }) {
  const [rows, setRows] = useState<CatRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState('');

  const isService = kind === 'services';

  const load = useCallback(async () => {
    setLoading(true);
    setDbError('');
    try {
      const res = await fetch(`/api/admin/${kind}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const items = Array.isArray(data.items) ? data.items : [];
      setRows(
        items.map((r: any) => ({
          id: r.id,
          name: r.name,
          title: r.title || r.role || null,
          price: r.price != null ? Number(r.price) : null,
        }))
      );
    } catch {
      setDbError(
        isService
          ? 'Database not found — services store unavailable. Is PostgreSQL running?'
          : 'Database not found — stylists store unavailable. Is PostgreSQL running?'
      );
    } finally {
      setLoading(false);
    }
  }, [kind, isService]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Card className="col-start-2 col-span-4 row-start-2 row-span-6 flex flex-col min-h-0 overflow-hidden">
      <CardHeader className="shrink-0 pb-2 flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">{isService ? 'Services' : 'Stylists'}</CardTitle>
          <CardDescription>
            {isService
              ? 'The full service menu, straight from the store the dashboard manages.'
              : 'The team, straight from the store the dashboard manages.'}
          </CardDescription>
        </div>
        {loading && <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />}
      </CardHeader>
      <CardContent className="flex-1 min-h-0 p-0 overflow-hidden">
        {dbError ? (
          <div className="p-6 flex flex-col items-center text-center">
            <Database className="w-7 h-7 text-red-500 mb-2" />
            <p className="text-sm font-semibold text-red-700">Database not found</p>
            <p className="mt-1 max-w-xs text-[11px] text-neutral-500">{dbError}</p>
            <button
              onClick={load}
              className="mt-3 rounded-md bg-black px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white hover:bg-neutral-800"
            >
              Retry
            </button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center gap-2 py-14 text-xs text-neutral-400">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading {isService ? 'services' : 'stylists'}…
          </div>
        ) : rows.length === 0 ? (
          <div className="py-14 px-6 text-center text-sm text-neutral-400">
            No {isService ? 'services' : 'stylists'} in the database yet.
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b border-neutral-200 text-neutral-500 uppercase text-[10px] tracking-[0.15em]">
                  <th className="px-4 py-3 font-semibold">{isService ? 'Service' : 'Stylist'}</th>
                  <th className="px-4 py-3 font-semibold">{isService ? 'Category' : 'Role'}</th>
                  {isService && <th className="px-4 py-3 font-semibold">Price</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-neutral-100">
                    <td className="px-4 py-3 font-medium">{r.name}</td>
                    <td className="px-4 py-3 text-neutral-500">{r.title || '—'}</td>
                    {isService && (
                      <td className="px-4 py-3 tabular-nums">{r.price != null ? `$${r.price}` : '—'}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
