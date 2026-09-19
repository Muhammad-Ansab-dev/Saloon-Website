// ─────────────────────────────────────────────────────────────
// SERVICES LANDING ROUTE ("/services") — the menu landing page.
// What it does: fetches the live services list from the database and
// renders the grid of service categories.
// What it connects to: getCollection('services') in src/lib/store.ts
// (the PostgreSQL content store) and <ServicesPage> →
// <ServicesCategories> (src/views/ServicesPage.tsx renders
// src/sections/services/ServicesCategories.tsx).
// Why a server component fetching from Postgres: so the HTML output
// (including curl / search engines) reflects admin edits immediately,
// not the last build.
// This is step 1 of the services workflow: landing → category → detail → booking.
// ─────────────────────────────────────────────────────────────
import { getCollection } from '@/lib/store';
import { SERVICES } from '@/data/salonData';
import type { ServiceItem } from '@/types';
import { ServicesPage } from '@/views/ServicesPage';

// Server component for /services.
// Params: none (URL query only).
// Returns: <ServicesPage> ready to render the category grid.
// Falls back to the static SERVICES copy if the database is unreachable,
// so the menu never goes blank.
export default async function Page() {
  let services: ServiceItem[];
  try {
    services = await getCollection('services');
  } catch (err) {
    console.error('Failed to load services from the content store:', err);
    services = SERVICES;
  }
  return <ServicesPage initialServices={services} />;
}
