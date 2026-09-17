'use client';
// ---------------------------------------------------------------------------
// DateField — single-date calendar dropdown for the dashboard (dark theme).
// Unlike the public DatePickerField it allows past dates and free month
// navigation, and reports an empty string when cleared. Used by the
// All Bookings date filter (Custom). Built on the shared calendar grid.
// ---------------------------------------------------------------------------
import React, { useEffect, useRef, useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { toISODate, formatDisplayDate, todayISO } from '@/lib/bookingTime';
import { monthCells, WEEKDAYS } from '@/lib/calendarGrid';

interface DateFieldProps {
  value: string; // "YYYY-MM-DD" or "" when unset
  onChange: (iso: string) => void;
  placeholder?: string;
}

export const DateField: React.FC<DateFieldProps> = ({ value, onChange, placeholder = 'Pick a date' }) => {
  const [open, setOpen] = useState(false);
  const base = value || todayISO();
  const [viewYear, setViewYear] = useState(() => new Date(base + 'T12:00:00').getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date(base + 'T12:00:00').getMonth());
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  const step = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="h-8 px-3 rounded-md border border-border bg-card text-[11px] font-medium text-foreground flex items-center gap-2 focus:outline-none focus:border-foreground/40 cursor-pointer"
      >
        <span className={value ? '' : 'text-muted-foreground'}>{value ? formatDisplayDate(value) : placeholder}</span>
        {value ? (
          <X
            className="w-3 h-3 opacity-60 hover:opacity-100"
            onClick={(e) => { e.stopPropagation(); onChange(''); }}
          />
        ) : (
          <CalendarIcon className="w-3 h-3 opacity-60" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-30 w-64 rounded-lg border border-border bg-card shadow-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={() => step(-1)} className="p-1 text-muted-foreground hover:text-foreground cursor-pointer" aria-label="Previous month">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold uppercase tracking-wider">
              {new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <button type="button" onClick={() => step(1)} className="p-1 text-muted-foreground hover:text-foreground cursor-pointer" aria-label="Next month">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((d) => (
              <span key={d} className="text-center text-[9px] uppercase tracking-wider text-muted-foreground py-1">{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {monthCells(viewYear, viewMonth).map((d) => {
              const iso = toISODate(d);
              const inMonth = d.getMonth() === viewMonth;
              const selected = iso === value;
              const isToday = iso === todayISO();
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => { onChange(iso); setOpen(false); }}
                  className={`h-8 rounded-md text-center text-[11px] flex items-center justify-center cursor-pointer transition-colors ${
                    selected
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : inMonth
                      ? 'text-foreground hover:bg-muted'
                      : 'text-muted-foreground/40 hover:bg-muted'
                  } ${isToday && !selected ? 'ring-1 ring-inset ring-border' : ''}`}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
