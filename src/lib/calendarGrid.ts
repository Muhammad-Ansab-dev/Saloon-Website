// ---------------------------------------------------------------------------
// calendarGrid.ts — shared month-grid math for the calendar pickers
// (public DatePickerField + dashboard DateField). Keeps both in sync.
// ---------------------------------------------------------------------------

export const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/** Flat 42-cell (6 weeks × 7) grid of Dates for a given month view. */
export function monthCells(viewYear: number, viewMonth: number): Date[] {
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
