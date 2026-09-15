'use client';
// ---------------------------------------------------------------------------
// AdminDashboard — the /admin route: a single-screen owner console with three
// tabs (Services, Stylists, Bookings). It loads each collection from
// /api/admin/[col], lets the owner edit rows in local state, then PUTs the
// whole array back on "Save" (the public site reads the same store). Bookings
// arrive via POST /api/booking (the customer form) and are managed here with
// status updates and deletion.
// ---------------------------------------------------------------------------
import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Save, LogOut, Scissors, Boxes, X } from 'lucide-react';

type TabKey = 'services' | 'stylists' | 'bookings';

type ServiceRow = {
  id: string;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  category: string;
};
type StylistRow = { id: string; name: string; role: string };
type BookingRow = {
  id: string;
  serviceId?: string;
  serviceName: string;
  stylistName: string;
  date: string;
  time: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  notes?: string;
  createdAt: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
};

const TABS: { key: TabKey; label: string }[] = [
  { key: 'services', label: 'Services' },
  { key: 'stylists', label: 'Stylists' },
  { key: 'bookings', label: 'Bookings' },
];

const STATUS_PILLS: Record<BookingRow['status'], string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  completed: 'bg-blue-50 text-blue-700 border-blue-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
};

function uid(): string {
  return `id-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>('services');

  const [services, setServices] = useState<ServiceRow[]>([]);
  const [stylists, setStylists] = useState<StylistRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);

  // Add-modal state: `adding` picks which collection form is open.
  const [adding, setAdding] = useState<Exclude<TabKey, 'bookings'> | null>(null);
  const [draft, setDraft] = useState<{
    name: string;
    description: string;
    price: string;
    duration: string;
    category: string;
    role: string;
  }>({
    name: '',
    description: '',
    price: '',
    duration: '45',
    category: 'Cut & Style',
    role: 'Stylist',
  });
  const resetDraft = () =>
    setDraft({
      name: '',
      description: '',
      price: '',
      duration: '45',
      category: 'Cut & Style',
      role: 'Stylist',
    });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notify, setNotify] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [servicesData, stylistsData, bookingsData] = await Promise.all([
        fetch('/api/admin/services').then((res) => res.json()),
        fetch('/api/admin/stylists').then((res) => res.json()),
        fetch('/api/admin/bookings').then((res) => res.json()),
      ]);
      setServices(servicesData.items ?? []);
      setStylists(stylistsData.items ?? []);
      setBookings(bookingsData.items ?? []);
    } catch {
      setError('Failed to load content from the store.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const flash = (msg: string) => {
    setNotify(msg);
    setTimeout(() => setNotify(''), 2500);
  };

  const saveCollection = useCallback(
    async (key: TabKey, items: unknown[], opts: { silent?: boolean } = {}) => {
      setSaving(true);
      setError('');
      try {
        const res = await fetch(`/api/admin/${key}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items }),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? 'Save failed');
          return;
        }
        if (!opts.silent) flash(`${key} saved`);
      } catch {
        setError('Network error while saving.');
      } finally {
        setSaving(false);
      }
    },
    []
  );

  // Debounced auto-save: any local edit to services/stylists is pushed to
  // the store ~700ms after the last change, without needing the Save button.
  const timersRef = React.useRef<Partial<Record<TabKey, ReturnType<typeof setTimeout>>>>({});

  const persist = React.useCallback(
    (key: TabKey, items: unknown[]) => {
      clearTimeout(timersRef.current[key]);
      timersRef.current[key] = setTimeout(() => {
        saveCollection(key, items, { silent: true });
      }, 700);
    },
    [saveCollection]
  );

  // Per-key hydration guard so the first load (which merely reads the store)
  // never schedules an auto-save, and so an edit to one tab never re-saves
  // the other collections every render.
  const hydratedRef = React.useRef<Partial<Record<TabKey, boolean>>>({});

  const useHydratedPersist = (key: TabKey, items: unknown[]) => {
    React.useEffect(() => {
      if (!hydratedRef.current[key]) {
        hydratedRef.current[key] = true;
        return;
      }
      persist(key, items);
    }, [items, persist, key]);
  };

  useHydratedPersist('services', services);
  useHydratedPersist('stylists', stylists);

  React.useEffect(() => {
    const timers = timersRef.current;
    return () => Object.values(timers).forEach(clearTimeout);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/login', { method: 'DELETE' });
    router.replace('/admin/login');
  };

  /* ----- Services handlers ----- */
  const updateService = (idx: number, patch: Partial<ServiceRow>) =>
    setServices((prev) => prev.map((row, i) => (i === idx ? { ...row, ...patch } : row)));

  const openAdd = (kind: Exclude<TabKey, 'bookings'>) => {
    resetDraft();
    setAdding(kind);
  };

  const submitAdd = () => {
    if (!adding) return;
    if (adding === 'services') {
      if (!draft.name.trim()) return;
      setServices((prev) => [
        ...prev,
        {
          id: uid(),
          name: draft.name.trim(),
          description: draft.description.trim(),
          price: Number(draft.price) || 0,
          durationMinutes: Number(draft.duration) || 45,
          category: draft.category.trim() || 'Cut & Style',
        },
      ]);
    } else if (adding === 'stylists') {
      if (!draft.name.trim()) return;
      setStylists((prev) => [...prev, { id: uid(), name: draft.name.trim(), role: draft.role.trim() || 'Stylist' }]);
    }
    setAdding(null);
  };

  /* ----- Stylists handlers ----- */
  const updateStylist = (idx: number, patch: Partial<StylistRow>) =>
    setStylists((prev) => prev.map((row, i) => (i === idx ? { ...row, ...patch } : row)));

  /* ----- Bookings handlers ----- */
  const updateBookingStatus = async (id: string, status: BookingRow['status']) => {
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, patch: { status } }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Failed to update booking status.');
        return;
      }
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
      flash(`Booking ${status}`);
    } catch {
      setError('Network error while updating booking.');
    }
  };

  const deleteBooking = async (id: string) => {
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Failed to delete booking.');
        return;
      }
      setBookings((prevBookings) => prevBookings.filter((booking) => booking.id !== id));
      flash('Booking deleted');
    } catch {
      setError('Network error while deleting booking.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f5ee] text-black">
      {/* Top bar */}
      <header className="bg-black text-white px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Scissors className="w-4 h-4" />
          <div>
            <h1 className="font-editorial text-xs font-black tracking-[0.25em] uppercase leading-none">
              PAUL HAIR STUDIO
            </h1>
            <p className="text-[10px] text-white/50 tracking-[0.2em] uppercase mt-0.5">
              Content manager
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.15em] text-white/70 hover:text-white cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" /> Logout
        </button>
      </header>

      {/* Tabs */}
      <nav className="bg-white border-b border-neutral-200 px-6 flex items-center gap-1 overflow-x-auto sticky top-[57px] z-10">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-3.5 text-[11px] font-bold uppercase tracking-[0.15em] border-b-2 -mb-px whitespace-nowrap cursor-pointer transition-colors ${
              tab === t.key
                ? 'border-black text-black'
                : 'border-transparent text-neutral-400 hover:text-neutral-600'
            }`}
          >
            {t.label}
            {t.key === 'bookings' && bookings.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-black text-white text-[10px]">
                {bookings.length}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Notify / error bar */}
      {(notify || error) && (
        <div
          className={`px-6 py-2.5 text-xs font-medium ${
            error ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          {error || notify}
        </div>
      )}

      <main className="px-6 py-8 max-w-6xl mx-auto">
        {loading ? (
          <p className="text-sm text-neutral-500">Loading content&hellip;</p>
        ) : (
          <>
            {/* ================= SERVICES ================= */}
            {tab === 'services' && (
              <div>
                <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                  <div>
                    <h2 className="font-editorial text-lg font-black uppercase tracking-tight">
                      Services &amp; Prices
                    </h2>
                    <p className="text-xs text-neutral-500 mt-1">
                      The menu behind the home ServiceMenu and the /services route.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openAdd('services')}
                      className="flex items-center gap-1.5 px-3 py-2 bg-neutral-900 text-white text-[11px] font-bold uppercase tracking-wider hover:bg-neutral-700 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add service
                    </button>
                    <button
                      onClick={() => saveCollection('services', services)}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-2 bg-black text-white text-[11px] font-bold uppercase tracking-wider hover:bg-neutral-800 disabled:opacity-50 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" /> Save changes
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-neutral-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-neutral-200 text-neutral-500 uppercase text-[10px] tracking-[0.15em]">
                          <th className="px-3 py-3 font-semibold">Name</th>
                          <th className="px-3 py-3 font-semibold w-[26%]">Description</th>
                          <th className="px-3 py-3 font-semibold w-24">Category</th>
                          <th className="px-3 py-3 font-semibold w-20">Price ($)</th>
                          <th className="px-3 py-3 font-semibold w-24">Minutes</th>
                          <th className="px-1 py-3 w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {services.map((s, i) => (
                          <tr key={s.id} className="border-b border-neutral-100 align-top">
                            <td className="px-3 py-2">
                              <input
                                value={s.name}
                                onChange={(e) => updateService(i, { name: e.target.value })}
                                className="w-full px-2 py-1.5 bg-neutral-50 border border-neutral-200 focus:outline-none focus:border-black font-semibold"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <textarea
                                value={s.description}
                                onChange={(e) => updateService(i, { description: e.target.value })}
                                rows={2}
                                className="w-full px-2 py-1.5 bg-neutral-50 border border-neutral-200 focus:outline-none focus:border-black resize-y"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                value={s.category}
                                onChange={(e) => updateService(i, { category: e.target.value })}
                                className="w-full px-2 py-1.5 bg-neutral-50 border border-neutral-200 focus:outline-none focus:border-black"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min={0}
                                step={1}
                                value={s.price}
                                onChange={(e) =>
                                  updateService(i, { price: Number(e.target.value) || 0 })
                                }
                                className="w-full px-2 py-1.5 bg-neutral-50 border border-neutral-200 focus:outline-none focus:border-black"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min={5}
                                step={5}
                                value={s.durationMinutes}
                                onChange={(e) =>
                                  updateService(i, {
                                    durationMinutes: Number(e.target.value) || 0,
                                  })
                                }
                                className="w-full px-2 py-1.5 bg-neutral-50 border border-neutral-200 focus:outline-none focus:border-black"
                              />
                            </td>
                            <td className="px-1 py-2">
                              <button
                                onClick={() =>
                                  setServices((prev) => prev.filter((_, idx) => idx !== i))
                                }
                                className="p-1.5 text-neutral-400 hover:text-red-600 cursor-pointer"
                                aria-label="Delete service"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ================= STYLISTS ================= */}
            {tab === 'stylists' && (
              <div>
                <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                  <div>
                    <h2 className="font-editorial text-lg font-black uppercase tracking-tight">
                      Stylists / Artisans
                    </h2>
                    <p className="text-xs text-neutral-500 mt-1">
                      The team behind the homepage &ldquo;The Artisans&rdquo; rail and booking
                      dropdown.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openAdd('stylists')}
                      className="flex items-center gap-1.5 px-3 py-2 bg-neutral-900 text-white text-[11px] font-bold uppercase tracking-wider hover:bg-neutral-700 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add stylist
                    </button>
                    <button
                      onClick={() => saveCollection('stylists', stylists)}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-2 bg-black text-white text-[11px] font-bold uppercase tracking-wider hover:bg-neutral-800 disabled:opacity-50 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" /> Save changes
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-neutral-200 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-neutral-200 text-neutral-500 uppercase text-[10px] tracking-[0.15em]">
                        <th className="px-3 py-3 font-semibold">Name</th>
                        <th className="px-3 py-3 font-semibold">Role / Title</th>
                        <th className="px-1 py-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {stylists.map((st, i) => (
                        <tr key={st.id} className="border-b border-neutral-100">
                          <td className="px-3 py-2">
                            <input
                              value={st.name}
                              onChange={(e) => updateStylist(i, { name: e.target.value })}
                              className="w-full px-2 py-1.5 bg-neutral-50 border border-neutral-200 focus:outline-none focus:border-black font-semibold"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              value={st.role}
                              onChange={(e) => updateStylist(i, { role: e.target.value })}
                              className="w-full px-2 py-1.5 bg-neutral-50 border border-neutral-200 focus:outline-none focus:border-black"
                            />
                          </td>
                          <td className="px-1 py-2">
                            <button
                              onClick={() =>
                                setStylists((prev) => prev.filter((_, idx) => idx !== i))
                              }
                              className="p-1.5 text-neutral-400 hover:text-red-600 cursor-pointer"
                              aria-label="Delete stylist"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ================= BOOKINGS ================= */}
            {tab === 'bookings' && (
              <div>
                <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                  <div>
                    <h2 className="font-editorial text-lg font-black uppercase tracking-tight">
                      Booking Inbox
                    </h2>
                    <p className="text-xs text-neutral-500 mt-1">
                      Appointments submitted via the site&rsquo;s booking modal.
                      Update status or remove bookings below.
                    </p>
                  </div>
                  <button
                    onClick={load}
                    className="flex items-center gap-1.5 px-4 py-2 bg-black text-white text-[11px] font-bold uppercase tracking-wider hover:bg-neutral-800 cursor-pointer"
                  >
                    <Boxes className="w-3.5 h-3.5" /> Refresh
                  </button>
                </div>

                {bookings.length === 0 ? (
                  <div className="bg-white border border-dashed border-neutral-300 p-10 text-center">
                    <p className="text-sm text-neutral-400">
                      No bookings yet. Bookings submitted through the site appear here.
                    </p>
                  </div>
                ) : (
                  <div className="bg-white border border-neutral-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-neutral-200 text-neutral-500 uppercase text-[10px] tracking-[0.15em]">
                            <th className="px-3 py-3 font-semibold">Client</th>
                            <th className="px-3 py-3 font-semibold">Contact</th>
                            <th className="px-3 py-3 font-semibold">Service</th>
                            <th className="px-3 py-3 font-semibold">Stylist</th>
                            <th className="px-3 py-3 font-semibold">When</th>
                            <th className="px-3 py-3 font-semibold">Status</th>
                            <th className="px-3 py-3 font-semibold">Notes</th>
                            <th className="px-3 py-3 font-semibold">Received</th>
                            <th className="px-3 py-3 font-semibold"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {bookings.map((b) => (
                            <tr key={b.id} className="border-b border-neutral-100 align-top">
                              <td className="px-3 py-3 font-semibold">{b.clientName}</td>
                              <td className="px-3 py-3">
                                <div>{b.clientEmail}</div>
                                {b.clientPhone && (
                                  <div className="text-neutral-400 mt-0.5">{b.clientPhone}</div>
                                )}
                              </td>
                              <td className="px-3 py-3">{b.serviceName}</td>
                              <td className="px-3 py-3">{b.stylistName || '\u2014'}</td>
                              <td className="px-3 py-3 whitespace-nowrap">
                                <div className="font-semibold">{b.date}</div>
                                <div className="text-neutral-400">{b.time}</div>
                              </td>
                              <td className="px-3 py-3">
                                <select
                                  value={b.status ?? 'pending'}
                                  onChange={(e) =>
                                    updateBookingStatus(b.id, e.target.value as BookingRow['status'])
                                  }
                                  className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider border rounded-full cursor-pointer ${
                                    STATUS_PILLS[b.status ?? 'pending']
                                  }`}
                                >
                                  <option value="pending">Pending</option>
                                  <option value="confirmed">Confirmed</option>
                                  <option value="completed">Completed</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                              </td>
                              <td className="px-3 py-3 text-neutral-500 max-w-[180px]">
                                {b.notes || '\u2014'}
                              </td>
                              <td className="px-3 py-3 text-neutral-400 whitespace-nowrap">
                                {new Date(b.createdAt).toLocaleString()}
                              </td>
                              <td className="px-3 py-3 text-right">
                                <button
                                  onClick={() => deleteBooking(b.id)}
                                  className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400 hover:text-red-600 cursor-pointer"
                                  aria-label={`Delete booking ${b.clientName}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer hint */}
      <footer className="px-6 py-6 border-t border-neutral-200 text-center">
        <p className="text-[10px] uppercase tracking-[0.25em] text-neutral-400">
          Saved edits are served live to the public site via /api/content
        </p>
      </footer>

      {/* ================= ADD-ITEM MODAL ================= */}
      {adding && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setAdding(null)}
        >
          <div
            className="bg-white w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 sticky top-0 bg-white z-10">
              <h3 className="font-editorial text-sm font-black uppercase tracking-[0.2em]">
                {adding === 'services' ? 'Add service' : 'Add stylist'}
              </h3>
              <button
                onClick={() => setAdding(null)}
                className="p-1 text-neutral-400 hover:text-black cursor-pointer"
                aria-label="Close add dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              className="px-6 py-5 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                submitAdd();
              }}
            >
              {(adding === 'services' || adding === 'stylists') && (
                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500">
                    Name *
                  </span>
                  <input
                    autoFocus
                    value={draft.name}
                    onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                    placeholder={adding === 'services' ? 'e.g. Signature Cut' : 'e.g. Jordan'}
                    className="mt-1.5 w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 focus:outline-none focus:border-black"
                  />
                </label>
              )}

              {adding === 'services' && (
                <>
                  <label className="block">
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500">
                      Description
                    </span>
                    <textarea
                      value={draft.description}
                      onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                      rows={3}
                      placeholder="Short service description"
                      className="mt-1.5 w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 focus:outline-none focus:border-black resize-y"
                    />
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <label className="block">
                      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500">
                        Price ($)
                      </span>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={draft.price}
                        onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))}
                        placeholder="0"
                        className="mt-1.5 w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 focus:outline-none focus:border-black"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500">
                        Minutes
                      </span>
                      <input
                        type="number"
                        min={5}
                        step={5}
                        value={draft.duration}
                        onChange={(e) => setDraft((d) => ({ ...d, duration: e.target.value }))}
                        placeholder="45"
                        className="mt-1.5 w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 focus:outline-none focus:border-black"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500">
                        Category
                      </span>
                      <input
                        value={draft.category}
                        onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
                        placeholder="Cut & Style"
                        className="mt-1.5 w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 focus:outline-none focus:border-black"
                      />
                    </label>
                  </div>
                </>
              )}

              {adding === 'stylists' && (
                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500">
                    Role / Title
                  </span>
                  <input
                    value={draft.role}
                    onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value }))}
                    placeholder="Senior Stylist"
                    className="mt-1.5 w-full px-3 py-2.5 bg-neutral-50 border border-neutral-200 focus:outline-none focus:border-black"
                  />
                </label>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdding(null)}
                  className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-neutral-500 hover:text-black cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!draft.name.trim()}
                  className="px-5 py-2.5 bg-black text-white text-[11px] font-bold uppercase tracking-wider hover:bg-neutral-800 disabled:opacity-40 cursor-pointer"
                >
                  Add {adding === 'services' ? 'service' : 'stylist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}