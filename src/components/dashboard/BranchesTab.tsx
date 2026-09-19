'use client';
// ─────────────────────────────────────────────────────────────
// BranchesTab — Dashboard "Branches" tab. Superadmin panel with two
// layers:
//   1. Branch management — create/edit/delete salon branches, each
//      with its own branch-manager login (username + password). New
//      branches immediately get a working /dashboard/branch/<slug>
//      console and appear across the public site (contact, booking
//      form, stylists). Edit can change the details and manager login
//      but never the slug (slugs are permanent — bookings and the
//      login token are keyed to them). Delete is allowed; anything
//      already attached to the branch is left behind as "Unassigned".
//   2. Branch overview — per-branch stats: booking volume, status
//      breakdown, revenue and team size, loaded live from
//      /api/admin/{bookings,stylists,services} alongside the branch
//      rows themselves (this tab only exists in the global dashboard —
//      branch consoles render OverviewTab instead).
// ─────────────────────────────────────────────────────────────
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarRange, Loader2, MapPin, Pencil, Plus, Trash2, Users, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { stylistBranch, LOCATIONS } from '@/data/salonData';
import { SkeletonPanel } from '@/components/dashboard/Skeleton';

type BookingRow = {
  id: string;
  serviceId?: string;
  branch?: string;
  clientEmail: string;
  date: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
};
type ServiceRow = { id: string; price: number };
type StylistRow = { id?: string; branch?: string };

type BranchRow = {
  slug: string;
  city: string;
  address: string;
  email: string;
  telephone: string;
  hours: string;
  managerUsername: string;
  managerPassword: string;
  createdAt: string;
};

type BranchStat = {
  key: string;
  label: string;
  bookings: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  revenue: number;
  clients: number;
  stylists: number;
};

type StatusKey = 'pending' | 'confirmed' | 'completed' | 'cancelled';

const STATUS_ROWS: { status: StatusKey; label: string; variant: 'outline' | 'secondary' | 'default' | 'destructive' }[] = [
  { status: 'pending', label: 'Pending', variant: 'outline' },
  { status: 'confirmed', label: 'Confirmed', variant: 'secondary' },
  { status: 'completed', label: 'Completed', variant: 'default' },
  { status: 'cancelled', label: 'Cancelled', variant: 'destructive' },
];

// Formats a number as British pounds for the revenue stats.
const gbp = (n: number) => '£' + n.toLocaleString('en-GB');

// The create/edit/delete modal uses these shared dark-theme field styles.
const labelCls = 'block text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-1.5';
const fieldCls =
  'w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-white disabled:opacity-40 disabled:cursor-not-allowed';
const btnPrimary =
  'inline-flex items-center gap-1.5 bg-white text-black text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer';
const btnGhost =
  'inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer';

// A small labelled number box used inside each branch card's stats grid.
function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums leading-none">{value}</p>
    </div>
  );
}

// One branch overview card: contact details (when a real branch row exists),
// four mini-stats and a status-breakdown badge row. Edit/Delete appear only
// for managed branches.
function BranchCard({
  stat,
  branch,
  onEdit,
  onDelete,
}: {
  stat: BranchStat;
  branch?: BranchRow;
  onEdit?: (b: BranchRow) => void;
  onDelete?: (b: BranchRow) => void;
}) {
  const managed = !!branch;
  return (
    <div className="bg-card border border-border">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <MapPin className="w-4 h-4 text-muted-foreground" />
        <h4 className="text-sm font-bold uppercase tracking-wide">{stat.label}</h4>
        {stat.key && <span className="text-[10px] uppercase tracking-wider text-muted-foreground">/{stat.key}</span>}
        <div className="ml-auto flex items-center gap-1.5">
          {managed && onEdit && (
            <button
              type="button"
              onClick={() => onEdit(branch)}
              className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Pencil className="w-3 h-3" /> Edit
            </button>
          )}
          {managed && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(branch)}
              className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-red-400 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          )}
          <Badge variant="secondary">{stat.stylists} {stat.stylists === 1 ? 'stylist' : 'stylists'}</Badge>
        </div>
      </div>
      <div className="p-4">
        {branch && (
          <div className="mb-4 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground leading-relaxed">
            <p className="font-semibold text-foreground">{branch.city}</p>
            <p>{branch.address}</p>
            <p>{branch.email} · {branch.telephone}</p>
            {branch.hours && <p>{branch.hours}</p>}
            <p className="mt-1 text-[10px] uppercase tracking-wider">
              Manager login: <span className="text-foreground font-semibold">{branch.managerUsername || '—'}</span>
            </p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <MiniStat label="Appointments" value={String(stat.bookings)} />
          <MiniStat label="Revenue" value={gbp(stat.revenue)} />
          <MiniStat label="Active clients" value={String(stat.clients)} />
          <MiniStat label="Team size" value={String(stat.stylists)} />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <CalendarRange className="w-3.5 h-3.5 text-muted-foreground" />
          {STATUS_ROWS.map((s) => (
            <Badge key={s.status} variant={s.variant}>{s.label} · {stat[s.status]}</Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

// Blank starting form used by the "New branch" modal.
const EMPTY_FORM = {
  city: '',
  address: '',
  email: '',
  telephone: '',
  hours: '',
  managerUsername: '',
  managerPassword: '',
};

export function BranchesTab() {
  // Source data for the whole tab, fetched together from the admin API.
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [stylists, setStylists] = useState<StylistRow[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [branches, setBranches] = useState<BranchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ── create / edit / delete modals ──────────────────────────
  // formOpen = is the create/edit modal open; editing = the row being edited
  // (null = "create new"); form holds the current field values.
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BranchRow | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [addBranchesButton, setAddBranchesButton] = useState(false); // Set to true to show the "Add Branch" button, false to hide it
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [mutError, setMutError] = useState('');
  // deleteTarget = the branch awaiting delete confirmation; deleting = in flight.
  const [deleteTarget, setDeleteTarget] = useState<BranchRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch bookings, services, stylists and branch rows in parallel.
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [bRes, sRes, tRes, brRes] = await Promise.all([
        fetch('/api/admin/bookings'),
        fetch('/api/admin/services'),
        fetch('/api/admin/stylists'),
        fetch('/api/admin/branches'),
      ]);
      if (!bRes.ok || !sRes.ok || !tRes.ok || !brRes.ok) throw new Error(`HTTP ${bRes.status}/${sRes.status}/${tRes.status}/${brRes.status}`);
      const bData = await bRes.json();
      const sData = await sRes.json();
      const tData = await tRes.json();
      const brData = await brRes.json();
      setBookings(Array.isArray(bData.items) ? bData.items : []);
      setServices(Array.isArray(sData.items) ? sData.items : []);
      setStylists(Array.isArray(tData.items) ? tData.items : []);
      setBranches(Array.isArray(brData.items) ? brData.items : []);
    } catch {
      setError('Could not load branch data — are you signed in?');
      setBookings([]); setServices([]); setStylists([]); setBranches([]);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  // Fast lookup from service id → price, used when valuing each branch's revenue.
  const priceMap = useMemo(
    () => Object.fromEntries(services.map((s) => [s.id, s.price])),
    [services]
  );

  // Open the modal opened ready for a NEW branch (blank form, no edit target).
  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setFormError('');
    setFormOpen(true);
  };

  // Same modal, but pre-filled from the branch being edited (fields only —
  // the id/slug itself is never changed by this form, so PATCH by slug works).
  const openEdit = (b: BranchRow) => {
    setEditing(b);
    setForm({
      city: b.city,
      address: b.address,
      email: b.email,
      telephone: b.telephone,
      hours: b.hours,
      managerUsername: b.managerUsername,
      managerPassword: b.managerPassword,
    });
    setFormError('');
    setFormOpen(true);
  };

  // Create (POST) or update (PATCH) the branch via the admin API, then reload.
  const saveForm = async () => {
    if (saving) return;
    setSaving(true);
    setFormError('');
    setMutError('');
    try {
      if (editing) {
        const res = await fetch('/api/admin/branches', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editing.slug, patch: form }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      } else {
        const res = await fetch('/api/admin/branches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      }
      setFormOpen(false);
      setEditing(null);
      await load();
    } catch (e) {
      setFormError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  // DELETE the confirmed target branch, then reload so its card disappears.
  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setMutError('');
    try {
      const res = await fetch('/api/admin/branches', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteTarget.slug }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setDeleteTarget(null);
      await load();
    } catch (e) {
      setMutError((e as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  // Roll up every booking and stylist into one stat row per branch: counts by
  // status, revenue (from the service price, £50 fallback), and unique clients.
  const cards = useMemo<BranchStat[]>(() => {
    const acc = new Map<string, { bookings: number; pending: number; confirmed: number; completed: number; cancelled: number; revenue: number; clients: Set<string> }>();
    for (const b of bookings) {
      const key = (b.branch || '').toLowerCase();
      const cur = acc.get(key) ?? { bookings: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0, revenue: 0, clients: new Set<string>() };
      cur.bookings += 1;
      cur[b.status] += 1;
      if (b.status !== 'cancelled') {
        cur.revenue += priceMap[b.serviceId || ''] ?? 50;
        cur.clients.add(b.clientEmail);
      }
      acc.set(key, cur);
    }
    const team = new Map<string, number>();
    for (const s of stylists) {
      const key = stylistBranch(s);
      team.set(key, (team.get(key) ?? 0) + 1);
    }
    const ordered: BranchStat[] = [];
    const used = new Set<string>();
    // Real branch rows first (so a newly created branch shows a card even
    // before it has any bookings or stylists), in store order.
    const orderedBranchRows = branches.length > 0 ? branches : LOCATIONS.map((l) => ({
      slug: l.city.toLowerCase(), city: l.city, address: l.address, email: l.email,
      telephone: l.telephone, hours: l.hours, managerUsername: '', managerPassword: '', createdAt: '',
    }));
    for (const row of orderedBranchRows) {
      const key = row.slug.toLowerCase();
      const a = acc.get(key);
      used.add(key);
      ordered.push({
        key,
        label: row.city.charAt(0).toUpperCase() + row.city.slice(1).toLowerCase(),
        bookings: a?.bookings ?? 0,
        pending: a?.pending ?? 0,
        confirmed: a?.confirmed ?? 0,
        completed: a?.completed ?? 0,
        cancelled: a?.cancelled ?? 0,
        revenue: a?.revenue ?? 0,
        clients: a?.clients.size ?? 0,
        stylists: team.get(key) ?? 0,
      });
    }
    // Leftover bookings/stylists whose branch no longer exists are
    // intentionally NOT rendered as cards — only real branches show.
    return ordered;
  }, [bookings, stylists, priceMap, branches]);

  // Lookup from lowercased slug → the full branch row (so cards know whether a
  // real managed branch exists and should show Edit/Delete).
  const branchBySlug = useMemo(() => new Map(branches.map((b) => [b.slug.toLowerCase(), b])), [branches]);
  const totalStylists = cards.reduce((s, c) => s + c.stylists, 0);

  if (loading) {
    return <SkeletonPanel className="w-full" />;
  }
  if (error) {
    return <div className="py-20 px-6 text-center text-sm text-muted-foreground">{error}</div>;
  }

  return (
    <div className="h-full flex flex-col min-h-0 gap-3">
      <div className="flex items-center justify-between shrink-0">
        <h3 className="text-sm font-bold uppercase tracking-wide">Branch Overview</h3>
        <Badge variant="secondary"><Users className="w-3 h-3" /> {totalStylists} total stylists</Badge>
      </div>

      {/* Management bar — create / edit / delete branches */}
      <div className="flex items-center justify-between gap-3 shrink-0">
        <p className="text-xs text-muted-foreground">
          Create, edit or remove branches. Each branch gets its own manager login.
        </p>
        {addBranchesButton && (
          <button type="button" onClick={openCreate} className={btnPrimary}>
            <Plus className="w-3.5 h-3.5" /> New branch
          </button>
        )}
      </div>

      {mutError && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {mutError}
        </div>
      )}

      {cards.length === 0 ? (
        <div className="py-12 px-6 text-center bg-card border border-border">
          <p className="text-xs text-muted-foreground">No branches or bookings yet — add the first branch.</p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pb-2">
            {cards.map((c) => {
              const row = branchBySlug.get(c.key) ?? undefined;
              return (
                <BranchCard
                  key={c.key || 'unassigned'}
                  stat={c}
                  branch={row}
                  onEdit={row ? openEdit : undefined}
                  onDelete={row ? setDeleteTarget : undefined}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* ── Create / Edit modal ─────────────────────────────── */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-xl bg-neutral-950 border border-neutral-800 shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
              <h4 className="text-sm font-bold uppercase tracking-wide">
                {editing ? `Edit branch — /${editing.slug}` : 'New branch'}
              </h4>
              <button type="button" onClick={() => setFormOpen(false)} className="text-neutral-400 hover:text-white transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className={labelCls}>City *</span>
                  <input
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="e.g. London"
                    className={fieldCls}
                  />
                </label>
                <label className="block">
                  <span className={labelCls}>Telephone</span>
                  <input
                    value={form.telephone}
                    onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                    placeholder="+41 44 000 00 00"
                    className={fieldCls}
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className={labelCls}>Address</span>
                  <input
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="Street and number"
                    className={fieldCls}
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className={labelCls}>Email</span>
                  <input
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="hello@branch.com"
                    className={fieldCls}
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className={labelCls}>Opening hours</span>
                  <input
                    value={form.hours}
                    onChange={(e) => setForm({ ...form, hours: e.target.value })}
                    placeholder="Mon–Sat 9:00 – 19:00"
                    className={fieldCls}
                  />
                </label>
              </div>

              <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2.5 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">
                  Branch manager login {editing ? '(used online; leave blank to keep the current password)' : ''}
                </p>
                <label className="block">
                  <span className={labelCls}>Username</span>
                  <input
                    value={form.managerUsername}
                    onChange={(e) => setForm({ ...form, managerUsername: e.target.value })}
                    placeholder="manager username"
                    className={fieldCls}
                  />
                </label>
                <label className="block">
                  <span className={labelCls}>Password</span>
                  <input
                    type="password"
                    value={form.managerPassword}
                    onChange={(e) => setForm({ ...form, managerPassword: e.target.value })}
                    placeholder={editing ? 'Leave blank to keep current' : 'password'}
                    className={fieldCls}
                  />
                </label>
              </div>

              {formError && (
                <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  {formError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button type="button" onClick={() => setFormOpen(false)} className={btnGhost}>
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveForm}
                  disabled={saving || !form.city.trim() || (!editing && (!form.managerUsername.trim() || !form.managerPassword.trim()))}
                  className="inline-flex items-center gap-1.5 bg-white text-black text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg hover:bg-neutral-200 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editing ? 'Save changes' : 'Create branch'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirmation ─────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-xl bg-neutral-950 border border-neutral-800 shadow-2xl">
            <div className="px-5 py-4 border-b border-neutral-800">
              <h4 className="text-sm font-bold uppercase tracking-wide">Delete branch?</h4>
            </div>
            <div className="p-5 text-xs text-neutral-400 space-y-3">
              <p>
                “{deleteTarget.city}” (
                <span className="text-neutral-300">/{deleteTarget.slug}</span>) will be removed.
                Its bookings and stylists are left behind as “Unassigned”, and the branch
                manager login for it will stop working.
              </p>
              {mutError && (
                <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-red-300">
                  {mutError}
                </div>
              )}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setDeleteTarget(null)} className={btnGhost}>
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="inline-flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg hover:bg-red-600 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Delete branch
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}