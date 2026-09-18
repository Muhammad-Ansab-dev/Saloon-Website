'use client';
// ---------------------------------------------------------------------------
// AddBookingModal — dashboard form for creating a booking manually.
// Uses the same public booking endpoint and payload as the customer booking
// form. Time slots already taken (per the selected date + stylist) are
// fetched from /api/availability and hidden from the dropdown.
// Styled to match the other dashboard modals (black panel, dark inputs).
// ---------------------------------------------------------------------------
import React, { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { DateField } from '@/components/dashboard/DateField';
import { generateTimeSlots } from '@/lib/bookingTime';
import { useSiteContent, staticBranches } from '@/hooks/useSiteContent';

export type CreatedBooking = {
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

interface AddBookingModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (booking: CreatedBooking) => void;
  /** Branch this modal is opened from (branch console) — pre-selected + locked. */
  branch?: string;
}

const labelCls = 'block text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-1.5';
const fieldCls =
  'w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-white';

export function AddBookingModal({ open, onClose, onCreated, branch }: AddBookingModalProps) {
  const { services, stylists, branches } = useSiteContent();
  // Live branches from the store; static LOCATIONS until the fetch resolves.
  const branchList = branches.length > 0 ? branches : staticBranches();
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [stylistName, setStylistName] = useState('');
  const [branchSel, setBranchSel] = useState<string>(branch ?? '');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [takenSlots, setTakenSlots] = useState<Set<string>>(new Set());
  const [availLoading, setAvailLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setClientName(''); setClientEmail(''); setClientPhone('');
    setServiceId(services[0]?.id || ''); setStylistName(stylists[0]?.name || ''); setDate(''); setTime('');
    setBranchSel(branch ?? ''); setNotes(''); setError(''); setSaving(false); setTakenSlots(new Set());
  }, [open]);

  const slots = useMemo(
    () => (date ? generateTimeSlots(new Date(date + 'T12:00:00').getDay()) : []),
    [date]
  );

  // Hide time slots that are already booked for the chosen date + stylist.
  const availableSlots = useMemo(
    () => slots.filter((slot) => !takenSlots.has(slot)),
    [slots, takenSlots]
  );

  useEffect(() => {
    if (!date || !stylistName) { setTakenSlots(new Set()); return; }
    let cancelled = false;
    setAvailLoading(true);
    fetch(`/api/availability?date=${date}&stylist=${encodeURIComponent(stylistName)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { taken: string[] }) => {
        if (!cancelled) setTakenSlots(new Set(data.taken));
      })
      .catch(() => {
        if (!cancelled) setTakenSlots(new Set());
      })
      .finally(() => {
        if (!cancelled) setAvailLoading(false);
      });
    return () => { cancelled = true; };
  }, [date, stylistName]);

  if (!open) return null;

  const canSave =
    clientName.trim().length > 0 &&
    clientEmail.trim().length > 0 &&
    serviceId.length > 0 &&
    date.length > 0 &&
    time.length > 0;

  const submit = async () => {
    if (saving || !canSave) return;
    setSaving(true);
    setError('');
    try {
      const service = services.find((s) => s.id === serviceId);
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName,
          clientEmail,
          clientPhone,
          serviceId,
          serviceName: service?.name || '',
          stylistName,
          branch: branchSel || undefined,
          date,
          time,
          notes,
          createdAt: new Date().toISOString(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      onCreated({
        id: data.id,
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim(),
        clientPhone: clientPhone.trim(),
        serviceName: service?.name || '',
        stylistName: stylistName.trim(),
        branch: branchSel || undefined,
        date,
        time,
        notes: notes.trim(),
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create booking');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 cursor-pointer"
      role="dialog"
      aria-modal="true"
      onClick={() => !saving && onClose()}
    >
      <div
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-neutral-800 bg-black p-6 text-white shadow-2xl cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-editorial text-xl font-black uppercase tracking-tight">Add booking</h2>

        <div className="mt-5 space-y-4">
          <div>
            <label className={labelCls}>Client name</label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              autoFocus
              placeholder="Jane Doe"
              className={fieldCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Email</label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="jane@example.com"
                className={fieldCls}
              />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input
                type="tel"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="Optional"
                className={fieldCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Branch</label>
            <select
              value={branchSel}
              onChange={(e) => { setBranchSel(e.target.value); setStylistName(''); }}
              disabled={Boolean(branch)}
              className={`${fieldCls} cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <option value="">Global / unspecified</option>
              {branchList.map((l) => (
                <option key={l.slug} value={l.slug}>{l.city}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Service</label>
            <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} className={`${fieldCls} cursor-pointer`}>
              <option value="">Select a service…</option>
              {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <label className={labelCls}>Stylist</label>
            <select value={stylistName} onChange={(e) => { setStylistName(e.target.value); setTime(''); }} className={`${fieldCls} cursor-pointer`}>
              <option value="">Unassigned</option>
              {stylists.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Date</label>
              <DateField value={date} onChange={(iso) => { setDate(iso); setTime(''); }} placeholder="Pick a date" />
            </div>
            <div>
              <label className={`${labelCls} flex items-center gap-1.5`}>
                Time
                {availLoading && <Loader2 className="w-3 h-3 animate-spin" />}
              </label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                disabled={!date || availLoading}
                className={`${fieldCls} cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                <option value="">{!date ? 'Pick a date first' : availLoading ? 'Checking availability…' : availableSlots.length === 0 ? 'No slots available' : 'Select a time…'}</option>
                {availableSlots.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional"
              className={`${fieldCls} resize-none`}
            />
          </div>
        </div>

        {error && <p className="mt-4 text-xs leading-relaxed text-red-400">{error}</p>}

        <div className="mt-7 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-9 px-4 rounded-full text-xs font-semibold text-neutral-400 transition-colors hover:text-white disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving || !canSave}
            className="h-9 px-6 rounded-full bg-white text-black text-xs font-bold transition-colors hover:bg-white hover:text-emerald-600 disabled:opacity-50 cursor-pointer"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Add booking'}
          </button>
        </div>
      </div>
    </div>
  );
}
