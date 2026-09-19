'use client';
// ─────────────────────────────────────────────────────────────
// BranchDashboardShell — per-branch admin console at
// /dashboard/branch/[id]. Mirrors the main /dashboard layout with a
// fixed left rail, but scoped to just three tabs: Overview, Bookings,
// Stylists — reusing the same panels as the global dashboard
// (OverviewTab, BookingTab, StylistsPanel).
// ─────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LogOut } from 'lucide-react';
import { OverviewTab } from './OverviewTab';
import { BookingTab } from './BookingTab';
import { StylistsPanel } from './StylistsPanel';
import { NotificationsPanel } from './NotificationsPanel';

type BranchView = 'overview' | 'bookings' | 'stylists' | 'notifications';

const NAV: { id: BranchView; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'stylists', label: 'Stylists' },
  { id: 'notifications', label: 'Notifications' },
];

const TAB_LABEL: Record<BranchView, string> = {
  overview: 'Overview',
  bookings: 'Booking Analysis',
  stylists: 'Stylists',
  notifications: 'Notifications',
};

export function BranchDashboardShell({
  branchId,
  branchName,
}: {
  branchId: string;
  branchName: string;
}) {
  // Which of the branch console's screens is currently shown.
  const [view, setView] = useState<BranchView>('overview');
  const router = useRouter();

  // Call the auth logout endpoint, then send the user back to the login page.
  const signOut = async () => {
    await fetch('/api/auth/login', { method: 'DELETE' });
    router.replace('/dashboard/login');
  };

  return (
    <div className="dark h-screen overflow-hidden bg-background text-foreground">
      {/* Fixed left rail */}
      <aside className="fixed top-0 left-0 bottom-0 w-56 z-50 flex flex-col border-r border-border bg-card">
        <div className="px-4 pt-5 pb-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
          </Link>
        </div>
        <div className="px-4 pb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Branch</p>
          <p className="text-sm font-semibold mt-0.5">{branchName}</p>
        </div>
        <nav className="px-3 flex flex-col gap-1">
          {NAV.map((item) => {
            const active = view === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setView(item.id)}
                className={`px-3 py-2 text-sm rounded-md text-left transition-colors cursor-pointer ${
                  active
                    ? 'bg-muted font-medium'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="mt-auto p-3">
          <button
            type="button"
            onClick={signOut}
            className="w-full inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
      </aside>

      <main className="ml-56 h-screen flex flex-col px-4 sm:px-6 lg:px-8 py-4">
        <div className="mx-auto w-full h-full max-w-[1500px] flex flex-col gap-4 min-h-0">
          {/* Page header strip */}
          <div className="shrink-0">
            <p className="text-xs text-muted-foreground">
              Branches / {branchId} / {TAB_LABEL[view]}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight mt-0.5">
              {TAB_LABEL[view]}
            </h1>
          </div>

          {view === 'bookings' ? (
            <div className="flex-1 min-h-0 flex flex-col">
              <BookingTab branch={branchId} />
            </div>
          ) : view === 'notifications' ? (
            <div className="flex-1 min-h-0 flex flex-col">
              <NotificationsPanel branch={branchId} />
            </div>
          ) : view === 'stylists' ? (
            <div className="flex-1 min-h-0">
              <StylistsPanel branch={branchId} />
            </div>
          ) : (
            <div className="flex-1 min-h-0 flex flex-col">
              <OverviewTab branch={branchId} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}