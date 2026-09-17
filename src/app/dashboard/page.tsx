'use client';
// ─────────────────────────────────────────────────────────────
// Route: /dashboard — the admin console. Protected by middleware
// (unauthenticated visitors are redirected to /dashboard/login).
// A fixed left rail switches between five tabs: Overview, Bookings,
// Services, Stylists and Media — each rendered by its own component
// in components/dashboard/. Site chrome (Header/Footer/FloatingWidget)
// is intentionally suppressed by Providers on this route.
// ─────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Settings,
  User,
  LogOut,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs } from '@/components/ui/tabs';

import { MediaPanel } from '@/components/dashboard/MediaPanel';
import { StylistsPanel } from '@/components/dashboard/StylistsPanel';
import { ServicesPanel } from '@/components/dashboard/ServicesPanel';
import { BookingTab } from '@/components/dashboard/BookingTab';
import { OverviewTab } from '@/components/dashboard/OverviewTab';

// ── Dashboard state (real data lives in OverviewTab / BookingTab) ─────────
type DashboardTab = 'overview' | 'bookings' | 'services' | 'stylists' | 'media';

const NAV: { id: DashboardTab; label: string; enabled: boolean }[] = [
  { id: 'overview', label: 'Overview', enabled: true },
  { id: 'bookings', label: 'Bookings', enabled: true },
  { id: 'services', label: 'Services', enabled: true },
  { id: 'stylists', label: 'Stylists', enabled: true },
  { id: 'media', label: 'Media', enabled: true },
];

const TAB_LABEL: Record<DashboardTab, string> = {
  overview: 'Overview',
  bookings: 'Booking Analysis',
  services: 'Services',
  stylists: 'Stylists',
  media: 'Media Library',
};

export default function DashboardPage() {
  const [tab, setTab] = useState<DashboardTab>('overview');
  return (
    <div className="dark h-screen overflow-hidden bg-background text-foreground">
      {/* Fixed left rail — always visible */}
      <aside className="fixed top-0 left-0 bottom-0 w-64 z-50 flex flex-col border-r border-border bg-card">
        <div className="px-4 pt-5 pb-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex items-center justify-center w-7 h-7 rounded-md bg-primary text-primary-foreground text-[11px] font-black tracking-tight">
              PH
            </span>
            <span className="font-semibold text-sm">Paul Hair Studio</span>
          </Link>
        </div>
        <nav className="px-3 flex flex-col gap-1">
          {NAV.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                disabled={!item.enabled}
                onClick={() => item.enabled && setTab(item.id)}
                className={`px-3 py-2 text-sm rounded-md text-left transition-colors cursor-pointer ${
                  active
                    ? 'bg-muted font-medium'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                } ${item.enabled ? '' : 'opacity-40 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground'}`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="mt-auto p-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input placeholder="Search…" className="pl-8 h-9 text-sm" />
          </div>
          <Separator className="my-3" />
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full cursor-pointer rounded-md outline-none">
              <div className="flex items-center gap-2.5 px-1 py-1 hover:bg-muted/60 rounded-md transition-colors">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="text-[11px]">PD</AvatarFallback>
                </Avatar>
                <div className="leading-tight flex-1 text-left">
                  <p className="text-sm font-medium">Paul Delacroix</p>
                  <p className="text-xs text-muted-foreground truncate">admin@paulhair.studio</p>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              <DropdownMenuLabel>Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem><User className="w-3.5 h-3.5" /> Profile</DropdownMenuItem>
              <DropdownMenuItem><Settings className="w-3.5 h-3.5" /> Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive"><LogOut className="w-3.5 h-3.5" /> Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      <main className="ml-64 h-screen flex flex-col px-4 sm:px-6 lg:px-8 py-4">
        <div className="mx-auto w-full h-full max-w-[1500px] flex flex-col gap-4 min-h-0">

          {/* Box 2 — page header strip */}
          <div className="shrink-0 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">
                Dashboard / {TAB_LABEL[tab]}
              </p>
              <h1 className="text-2xl font-semibold tracking-tight mt-0.5">
                {TAB_LABEL[tab]}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">Export</Button>
            </div>
          </div>

          {tab === 'bookings' ? (
            <div className="flex-1 min-h-0 flex flex-col">
              <BookingTab />
            </div>
          ) : tab === 'services' ? (
            <div className="flex-1 min-h-0">
              <ServicesPanel />
            </div>
          ) : tab === 'stylists' ? (
            <div className="flex-1 min-h-0">
              <StylistsPanel />
            </div>
          ) : tab === 'media' ? (
            <div className="flex-1 min-h-0 overflow-y-auto">
              <MediaPanel />
            </div>
          ) : (
            <div className="flex-1 min-h-0 flex flex-col">
              <OverviewTab />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}