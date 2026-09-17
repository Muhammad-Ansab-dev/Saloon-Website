// Route: /services — Services landing page (App Router).
// Server component: fetches live services from Postgres so SSR output
// (including curl) reflects admin edits immediately.
// Renders ServicesPage → ServicesCategories, showing the grid of all service categories.
// This is step 1 of the services workflow: landing → category → detail → booking.
import { getCollection } from '@/lib/store';
import { SERVICES } from '@/data/salonData';
import type { ServiceItem } from '@/types';
import { ServicesPage } from '@/views/ServicesPage';

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
