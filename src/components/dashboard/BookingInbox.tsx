'use client';
// ---------------------------------------------------------------------------
// BookingInbox — the dashboard's real booking list. Reads the same
// /api/admin/bookings store the dashboard "Booking Inbox" uses, renders each
// row with a status pill-<select> (pending / confirmed / completed /
// cancelled) and a delete action, and computes the summary counts shown
// above. Requires the admin session cookie (set by /api/auth/login) — the
// /dashboard route is now gated by middleware, so signed-in staff see real
// bookings here, not dummy charts.
// ---------------------------------------------------------------------------
import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';

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

const STATUS_OPTIONS: { value: BookingRow['status']; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

// Tailwind classes for the status pill-<select>s, matching /admin.
const STATUS_SELECT: Record<BookingRow['status'], string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  completed: 'bg-blue-50 text-blue-700 border-blue-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
};

async function loadBookings(): Promise<BookingRow[]> {
  const res = await fetch('/api/admin/bookings');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return Array.isArray(data.items) ? data.items : [];
}

export function BookingInbox() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setBookings(await loadBookings());
    } catch {
      setError('Sign in required, or the server is unreachable.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (id: string, status: BookingRow['status']) => {
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, patch: { status } }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError((data && data.error) || 'Failed to update status.');
        return;
      }
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
    } catch {
      setError('Network error while updating status.');
    }
  };

  const deleteBooking = async (id: string) => {
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) return;
      setBookings((prev) => prev.filter((b) => b.id !== id));
    } catch {
      setError('Network error while deleting booking.');
    }
  };

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex-1 min-h-0 overflow-hidden bg-white border border-neutral-200">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-neutral-400">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading bookings&hellip;
          </div>
        ) : error && bookings.length === 0 ? (
          <div className="py-12 px-6 text-center text-sm text-neutral-500">{error}</div>
        ) : bookings.length === 0 ? (
          <div className="py-12 px-6 text-center">
            <p className="text-xs text-neutral-400">No bookings yet.</p>
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-500 uppercase text-[10px] tracking-[0.15em]">
                  <th className="px-3 py-3 font-semibold">Client</th>
                  <th className="px-3 py-3 font-semibold">Service</th>
                  <th className="px-3 py-3 font-semibold">Stylist</th>
                  <th className="px-3 py-3 font-semibold">When</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-1 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className="border-b border-neutral-100 align-top">
                    <td className="px-3 py-3">
                      <div className="font-semibold">{b.clientName}</div>
                      <div className="text-neutral-400 mt-0.5">{b.clientEmail}</div>
                    </td>
                    <td className="px-3 py-3">{b.serviceName}</td>
                    <td className="px-3 py-3">{b.stylistName || '\u2014'}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="font-semibold">{b.date}</div>
                      <div className="text-neutral-400">{b.time}</div>
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={b.status}
                        onChange={(e) => updateStatus(b.id, e.target.value as BookingRow['status'])}
                        className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider border rounded-full cursor-pointer ${
                          STATUS_SELECT[b.status]
                        }`}
                      >
                        {STATUS_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button
                        onClick={() => deleteBooking(b.id)}
                        className="p-1.5 text-neutral-400 hover:text-red-600 cursor-pointer"
                        aria-label={`Delete booking ${b.clientName}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
