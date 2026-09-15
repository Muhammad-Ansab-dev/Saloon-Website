// Route: /services — Services landing page (App Router).
// Server component: fetches live services from Postgres so SSR output
// (including curl) reflects admin edits immediately.
// Renders ServicesPage → ServicesCategories, showing the grid of all service categories.
// This is step 1 of the services workflow: landing → category → detail → booking.
import { getCollection } from '@/lib/store';
import { ServicesPage } from '@/views/ServicesPage';

export default async function Page() {
  const services = await getCollection('services');
  return <ServicesPage initialServices={services} />;
}
