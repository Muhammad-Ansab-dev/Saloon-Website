'use client';
// ---------------------------------------------------------------------------
// DatePickerField — reusable custom calendar dropdown that ALWAYS opens
// downward (native <input type="date"> popups cannot be direction-controlled).
// Past dates are disabled; navigation is bounded to the current→next year.
// Used by BookingModal and the ContactPage booking form. Clicking a day
// calls onChange with the ISO date and closes the panel.
// ---------------------------------------------------------------------------
import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { toISODate, formatDisplayDate, todayISO } from '@/lib/bookingTime';

interface DatePickerFieldProps {
  value: string; // "YYYY-MM-DD"
  onChange: (iso: string) => void;
}

const YEAR = new Date().getFullYear();
const MONTH = new Date().getMonth();
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/** Flat 42-cell (6 weeks × 7) grid of Dates for a given month view. */
function monthCells(viewYear: number, viewMonth: number): Date[] {
  const startPad = new Date(viewYear, viewMonth, 1).getDay();
  const daysInPrev = new Date(viewYear, viewMonth, 0).getDate();
  const cells: Date[] = [];
  for (let i = 0; i < startPad; i++) {
    cells.push(new Date(viewYear, viewMonth - 1, daysInPrev - startPad + 1 + i));
  }
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewYear, viewMonth, d));
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) cells.push(new Date(viewYear, viewMonth + 1, d));
  return cells;
}

export const DatePickerField: React.FC<DatePickerFieldProps> = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => new Date(value + 'T12:00:00').getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date(value + 'T12:00:00').getMonth());

  const wrapRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((isOpen) => !isOpen)}
        className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-300 text-xs font-medium text-left flex items-center justify-between focus:outline-none focus:border-black cursor-pointer"
      >
        <span>{formatDisplayDate(value)}</span>
        <CalendarIcon className="w-3.5 h-3.5 opacity-50" />
      </button>

      {open && (
        <div
          ref={wrapRef}
          className="absolute top-full left-0 mt-2 z-30 w-64 bg-white border border-neutral-300 shadow-xl p-3"
        >
          {/* Month nav */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => {
                if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11); }
                else setViewMonth(viewMonth - 1);
              }}
              disabled={viewYear === YEAR && viewMonth <= MONTH}
              className="p-1 text-neutral-500 hover:text-black disabled:opacity-30 cursor-pointer"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold uppercase tracking-wider">
              {new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <button
              type="button"
              onClick={() => {
                if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0); }
                else setViewMonth(viewMonth + 1);
              }}
              disabled={viewYear === YEAR + 1 && viewMonth >= MONTH}
              className="p-1 text-neutral-500 hover:text-black disabled:opacity-30 cursor-pointer"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday header */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((d) => (
              <span key={d} className="text-center text-[9px] uppercase tracking-wider text-neutral-400 py-1">
                {d}
              </span>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7">
            {monthCells(viewYear, viewMonth).map((d) => {
              const iso = toISODate(d);
              const inMonth = d.getMonth() === viewMonth;
              const past = iso < todayISO;
              const selected = iso === value;
              const isToday = iso === todayISO;
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={past}
                  onClick={() => { onChange(iso); setOpen(false); }}
                  className={`h-8 text-center text-[11px] flex items-center justify-center cursor-pointer transition-colors ${
                    past
                      ? 'text-neutral-300 cursor-not-allowed'
                      : !inMonth
                      ? 'text-neutral-300'
                      : selected
                      ? 'bg-black text-white'
                      : 'text-neutral-700 hover:bg-neutral-100'
                  } ${isToday && !selected ? 'ring-1 ring-inset ring-neutral-300' : ''}`}
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