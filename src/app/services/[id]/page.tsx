// ─────────────────────────────────────────────────────────────
// SERVICES DETAIL / CATEGORY ROUTE ("/services/[id]") — one URL that
// handles BOTH kinds of service pages.
// What it does: fetches the live services list, reads the URL segment
// written instead of [id], and passes it to ServicesIdView which decides
// what to render (see below).
// What it connects to: getCollection('services') in src/lib/store.ts and
// <ServicesIdView> (src/sections/services/ServicesIdView.tsx).
// The resolution logic lives in ServicesIdView: if [id] is a category
// slug → ServicesByCategory (all services in that category); if it is a
// service id like "srv-…" → ServiceDetailPage; otherwise an inline
// "page not found". Both branches fall back to static SERVICES on DB error.
// Why a server component: SSR output (incl. curl) reflects admin edits.
// ─────────────────────────────────────────────────────────────
import { getCollection } from '@/lib/store';
import { SERVICES } from '@/data/salonData';
import type { ServiceItem } from '@/types';
import { ServicesIdView } from '@/sections/services/ServicesIdView';

// Server component for /services/[id].
// Params: { id } — the URL segment (awaited, because App Router passes it
// as a Promise). It may be a category slug OR a service id.
// Returns: <ServicesIdView> which resolves and renders the right page;
// services fall back to the static copy when the database is unreachable.
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let services: ServiceItem[];
  try {
    services = await getCollection('services');
  } catch (err) {
    console.error('Failed to load services from the content store:', err);
    services = SERVICES;
  }
  return <ServicesIdView id={id} initialServices={services} />;
}
