// ---------------------------------------------------------------------------
// calendarGrid.ts — shared month-grid math for the calendar pickers
// (public DatePickerField + dashboard DateField). Keeps both in sync.
// In plain words: a date picker needs to know which dates go on each cell
// of its month calendar; this file computes that in one place so every
// calendar on the site renders the same way.
// ---------------------------------------------------------------------------

// Short weekday labels for the column headers, Sunday-first (matching JS
// getDay(): 0 = Sunday).
export const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// Build the flat 42-cell grid (6 weeks × 7 days) a calendar shows for one
// month view: the trailing days of the previous month, then all days of the
// shown month, then the leading days of the next month to fill the last row.
// Params: viewYear / viewMonth — the year and month (0-based, January = 0)
// being displayed. Returns an array of 42 Date objects.
export function monthCells(viewYear: number, viewMonth: number): Date[] {
  // "Blank" cells before the 1st: offset by which weekday the 1st lands on,
  // filled from the previous month (e.g. a Wednesday start pads with the last
  // days of the month before).
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
