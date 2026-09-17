'use client';
// ---------------------------------------------------------------------------
// StylistsPanel — the Dashboard's "Stylists" tab, styled with the same recipe
// as BookingInbox so it reads as native dashboard content: white summary
// cards, uppercase title row with a black action button, and a white bordered
// roster table that scrolls internally (flex-1 min-h-0 + h-full overflow).
// FULL CRUD against the PostgreSQL store:
//   - Create: "Add stylist" opens a modal → POST /api/admin/stylists
//   - Read:   loads live rows from /api/content (DB only — no static fallback)
//   - Update: pencil row action edits in a modal → PATCH /api/admin/stylists
//   - Delete: trash row action confirms in a modal → DELETE /api/admin/stylists
// All mutations are protected by the /api/admin/* middleware; errors (DB down
// / not signed in) surface in a banner instead of failing silently.
// ---------------------------------------------------------------------------
import React, { useCallback, useEffect, useState } from 'react';
import { Boxes, Database, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import Image from 'next/image';
import type { SiteStylist } from '@/hooks/useSiteContent';
import { ImagePicker } from './ImagePicker';

type LoadState = 'loading' | 'ready' | 'error';

async function api(path: string, init: RequestInit): Promise<Record<string, unknown>> {
  const res = await fetch(path, init);
  if (!res.ok) {
    let msg = `Request failed (HTTP ${res.status})`;
    if (res.status === 401) {
      msg = 'Sign in required — log in at /dashboard/login to make changes.';
    } else {
      try {
        const d = await res.json();
        if (d && typeof d.error === 'string') msg = d.error;
      } catch {
        // keep default message
      }
    }
    throw new Error(msg);
  }
  return res.json();
}

const HEADERS = { 'Content-Type': 'application/json' };

export function StylistsPanel() {
  const [stylists, setStylists] = useState<SiteStylist[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [mutError, setMutError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<SiteStylist | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [editTarget, setEditTarget] = useState<SiteStylist | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editImage, setEditImage] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState('');
  const [addRole, setAddRole] = useState('');
  const [addImage, setAddImage] = useState('');
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoadState('loading');
    try {
      const res = await fetch('/api/content');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setStylists(Array.isArray(data?.stylists) ? data.stylists : []);
      setLoadState('ready');
    } catch {
      setLoadState('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    if (!addName.trim() || adding) return;
    setAdding(true);
    setMutError('');
    try {
      await api('/api/admin/stylists', {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify({ name: addName.trim(), role: addRole.trim(), image: addImage.trim() }),
      });
      setAddOpen(false);
      setAddName('');
      setAddRole('');
      setAddImage('');
      await load();
    } catch (e) {
      setMutError((e as Error).message);
    } finally {
      setAdding(false);
    }
  };

  const saveEdit = async () => {
    if (!editTarget || !editName.trim() || savingEdit) return;
    setSavingEdit(true);
    setMutError('');
    setBusyId(editTarget.id);
    try {
      await api('/api/admin/stylists', {
        method: 'PATCH',
        headers: HEADERS,
        body: JSON.stringify({
          id: editTarget.id,
          patch: {
            name: editName.trim(),
            role: editRole.trim(),
            ...(editImage.trim() !== editTarget.image ? { image: editImage.trim() } : {}),
          },
        }),
      });
      setEditTarget(null);
      await load();
    } catch (e) {
      setMutError((e as Error).message);
    } finally {
      setSavingEdit(false);
      setBusyId(null);
    }
  };

  const remove = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    setMutError('');
    setBusyId(deleteTarget.id);
    try {
      await api('/api/admin/stylists', {
        method: 'DELETE',
        headers: HEADERS,
        body: JSON.stringify({ id: deleteTarget.id }),
      });
      setDeleteTarget(null);
      await load();
    } catch (e) {
      setMutError((e as Error).message);
    } finally {
      setDeleting(false);
      setBusyId(null);
    }
  };

  const counts = {
    total: stylists.length,
    withRole: stylists.filter((s) => s.role).length,
  };

  const modals = (
    <>
      {/* Add modal */}
      {addOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 cursor-pointer"
          role="dialog"
          aria-modal="true"
          onClick={() => setAddOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-black p-6 text-white shadow-2xl cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-editorial text-xl font-black uppercase tracking-tight">
              Add stylist
            </h2>
            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-1.5">
                  Name
                </label>
                <input
                  type="text"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  autoFocus
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-1.5">
                  Role
                </label>
                <input
                  type="text"
                  value={addRole}
                  onChange={(e) => setAddRole(e.target.value)}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-1.5">
                  Image
                </label>
                <ImagePicker value={addImage} onValue={setAddImage} label="Stylist photo" />
              </div>
            </div>
            <div className="mt-7 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setAddOpen(false)}
                className="h-9 px-4 rounded-full text-xs font-semibold text-neutral-400 transition-colors hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={create}
                disabled={adding || !addName.trim()}
                className="h-9 px-6 rounded-full bg-white text-black text-xs font-bold transition-colors hover:bg-white hover:text-emerald-600 disabled:opacity-50 cursor-pointer"
              >
                {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 cursor-pointer"
          role="dialog"
          aria-modal="true"
          onClick={() => setEditTarget(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-black p-6 text-white shadow-2xl cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-editorial text-xl font-black uppercase tracking-tight">
              Edit stylist
            </h2>
            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-1.5">
                  Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  autoFocus
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-1.5">
                  Role
                </label>
                <input
                  type="text"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-1.5">
                  Image
                </label>
                <ImagePicker value={editImage} onValue={setEditImage} label="Stylist photo" />
              </div>
            </div>
            <div className="mt-7 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="h-9 px-4 rounded-full text-xs font-semibold text-neutral-400 transition-colors hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEdit}
                disabled={savingEdit || !editName.trim()}
                className="h-9 px-6 rounded-full bg-white text-black text-xs font-bold transition-colors hover:bg-white hover:text-emerald-600 disabled:opacity-50 cursor-pointer"
              >
                {savingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
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
              Delete stylist
            </h2>
            <p className="mt-3 text-xs leading-relaxed text-neutral-400">
              Remove <span className="font-semibold text-white">{deleteTarget.name}</span> from the
              team? This action cannot be undone.
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
    </>
  );

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Summary counts */}
      <div className="grid grid-cols-2 gap-3 mb-3 shrink-0">
        {[
          { label: 'Total Stylists', value: loadState === 'ready' ? String(counts.total) : '—' },
          { label: 'With a Role', value: loadState === 'ready' ? String(counts.withRole) : '—' },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-lg border border-border bg-card px-3 py-3"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              {kpi.label}
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Title row + primary action */}
      <div className="flex items-center justify-between mb-2 shrink-0">
        <h3 className="text-sm font-bold uppercase tracking-wide">Stylist Inbox</h3>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Add stylist
        </button>
      </div>

      {mutError && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-xs text-destructive mb-2 shrink-0">
          <span>{mutError}</span>
          <button type="button" aria-label="Dismiss" onClick={() => setMutError('')} className="text-destructive hover:opacity-70 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {loadState === 'error' && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card p-10 text-center shrink-0">
          <Database className="w-6 h-6 text-destructive" />
          <p className="text-sm font-semibold">Database unavailable</p>
          <p className="max-w-[44ch] text-[11px] leading-relaxed text-muted-foreground">
            The PostgreSQL store is down. No fallback data is shown. Retry once it&apos;s back.
          </p>
          <button
            onClick={() => load()}
            className="flex items-center gap-1.5 px-4 py-1.5 mt-1 text-[11px] font-bold uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
          >
            <Boxes className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {/* Roster table */}
      {loadState !== 'error' && (
        <div className="flex-1 min-h-0 overflow-hidden bg-card border border-border">
          {loadState === 'loading' ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading stylists&hellip;
            </div>
          ) : stylists.length === 0 ? (
            <div className="py-12 px-6 text-center">
              <p className="text-xs text-muted-foreground">No stylists yet — add the first one.</p>
            </div>
          ) : (
            <div className="h-full overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground uppercase text-[10px] tracking-[0.15em]">
                    <th className="px-3 py-3 font-semibold">Name</th>
                    <th className="px-3 py-3 font-semibold">Role</th>
                    <th className="px-1 py-3 w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {stylists.map((s) => (
                    <tr key={s.id} className="border-b border-border align-middle">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <span className="relative w-8 h-8 rounded-full overflow-hidden border border-border shrink-0 bg-muted">
                            {s.image ? <Image src={s.image} alt={s.name} fill sizes="32px" className="object-cover" /> : null}
                          </span>
                          <div className="font-medium">{s.name}</div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">{s.role || '\u2014'}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button type="button" aria-label={`Edit ${s.name}`} disabled={busyId === s.id} onClick={() => { setEditTarget(s); setEditName(s.name); setEditRole(s.role || ''); setEditImage(s.image || ''); setMutError(''); }} className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-50 cursor-pointer">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button type="button" aria-label={`Delete ${s.name}`} disabled={busyId === s.id} onClick={() => { setDeleteTarget(s); setMutError(''); }} className="p-1.5 text-muted-foreground hover:text-destructive disabled:opacity-50 cursor-pointer">
                            {busyId === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      {modals}
    </div>
  );
}