// Route: /services/[id] — Dynamic catch-all for categories and individual services (App Router).
// Server component: fetches live services from Postgres, resolves the URL param
// (category slug or service id), then renders the appropriate client component
// with live initial data so SSR output (including curl) reflects admin edits.
import { getCollection } from '@/lib/store';
import { SERVICES } from '@/data/salonData';
import type { ServiceItem } from '@/types';
import { ServicesIdView } from '@/sections/services/ServicesIdView';

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
