'use client';
// ---------------------------------------------------------------------------
// TimeSlotDropdown — custom <select>-like dropdown for time slots that
// ALWAYS opens downward. Native <select> controls its own popup direction
// based on viewport position; this component removes that uncertainty.
// Used by BookingForm in the date+time row.
// ---------------------------------------------------------------------------
import React, { useState, useEffect } from 'react';
import { Clock, Loader2 } from 'lucide-react';

const inputCls =
  'w-full px-3 py-2.5 bg-neutral-50 border border-neutral-300 text-xs font-medium focus:outline-none focus:border-black';

interface TimeSlotDropdownProps {
  value: string;
  onChange: (slot: string) => void;
  slots: string[];
  loading?: boolean;
}

export const TimeSlotDropdown: React.FC<TimeSlotDropdownProps> = ({
  value,
  onChange,
  slots,
  loading = false,
}) => {
  // Whether the slot list popup is open; wrapRef lets us detect outside clicks.
  const [open, setOpen] = useState(false);
  const wrapRef = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // The trigger is disabled while fetching or when nothing is bookable; its
  // label shows the chosen time, "Loading…", or a placeholder.
  const disabled = loading || slots.length === 0;
  const display = loading ? 'Loading…' : value || 'Select a time';

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`${inputCls} text-left flex items-center justify-between cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        <span className={!value ? 'text-neutral-400' : ''}>{display}</span>
        <span className="flex items-center gap-1">
          {loading && <Loader2 className="w-3 h-3 animate-spin opacity-50" />}
          <Clock className="w-3.5 h-3.5 opacity-50" />
        </span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 z-30 w-full max-h-48 overflow-y-auto bg-white border border-neutral-300 shadow-xl">
          {slots.length === 0 ? (
            <div className="px-3 py-2 text-xs text-neutral-400">No slots available</div>
          ) : (
            slots.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => {
                  onChange(slot);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                  slot === value
                    ? 'bg-black text-white'
                    : 'text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                {slot}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
