// ─────────────────────────────────────────────────────────────
// Skeleton — pulsing placeholder blocks for the dashboard tabs.
// Each tab shows its real layout shape (KPI cards, charts, tables,
// image groups) as an `animate-pulse` ghost while data loads, so
// content arrival doesn't shift the layout. Pure presentational —
// no hooks, safe to render in any tab regardless of data state.
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { cn } from '@/lib/utils';

/** Generic pulsing block; everything else is built out of these. */
export function SkeletonLine({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} />;
}

/** Ghost of a KPI card: label, value, sparkline area. */
export function SkeletonKpi({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10 animate-pulse', className)}>
      <div className="flex items-center justify-between">
        <SkeletonLine className="h-3 w-20" />
        <SkeletonLine className="h-4 w-4 rounded-full" />
      </div>
      <SkeletonLine className="h-6 w-28" />
      <SkeletonLine className="mt-auto h-10 w-full" />
    </div>
  );
}

/** Ghost of a full-width chart panel (title lines + plot area). */
export function SkeletonPanel({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col gap-4 overflow-hidden rounded-xl bg-card p-5 ring-1 ring-foreground/10 animate-pulse', className)}>
      <div className="space-y-2">
        <SkeletonLine className="h-4 w-40" />
        <SkeletonLine className="h-3 w-64 max-w-full" />
      </div>
      <SkeletonLine className="min-h-32 w-full flex-1" />
    </div>
  );
}

/** Ghost of a donut panel (status share). */
export function SkeletonDonut({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col gap-4 overflow-hidden rounded-xl bg-card p-5 ring-1 ring-foreground/10 animate-pulse', className)}>
      <div className="space-y-2">
        <SkeletonLine className="h-4 w-32" />
        <SkeletonLine className="h-3 w-44 max-w-full" />
      </div>
      <div className="flex flex-1 items-center justify-center py-4">
        <div className="h-36 w-36 rounded-full bg-muted" />
      </div>
    </div>
  );
}

/** Ghost of a roster/inbox table (avatar + rows + status chips). */
export function SkeletonTableCard({ rows = 7, avatar = false }: { rows?: number; avatar?: boolean }) {
  return (
    <div className="animate-pulse">
      <div className="flex gap-6 border-b border-border px-3 py-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonLine key={i} className="h-2.5 w-16" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-border px-3 py-3">
          {avatar && <SkeletonLine className="h-8 w-8 shrink-0 rounded-full" />}
          <div className="min-w-0 flex-1 space-y-1.5">
            <SkeletonLine className="h-3 w-40" />
            <SkeletonLine className="h-2.5 w-24" />
          </div>
          <SkeletonLine className="h-3 w-20" />
          <SkeletonLine className="hidden sm:block h-3 w-16" />
          <SkeletonLine className="ml-auto h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

/** Ghost of the media library: group cards with image-picker slots. */
export function SkeletonMedia({ groups = 3 }: { groups?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: groups }).map((_, gi) => (
        <div key={gi} className="flex flex-col gap-4 rounded-xl bg-card p-5 ring-1 ring-foreground/10 animate-pulse">
          <div className="space-y-2">
            <SkeletonLine className="h-4 w-40" />
            <SkeletonLine className="h-3 w-56 max-w-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <SkeletonLine className="h-16 w-16 shrink-0 rounded-lg" />
                <div className="flex-1 space-y-1.5 pt-1">
                  <SkeletonLine className="h-3 w-24" />
                  <SkeletonLine className="h-8 w-full rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}