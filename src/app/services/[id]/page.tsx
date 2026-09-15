// Route: /services/[id] — Dynamic catch-all for categories and individual services (App Router).
// Server component: fetches live services from Postgres, resolves the URL param
// (category slug or service id), then renders the appropriate client component
// with live initial data so SSR output (including curl) reflects admin edits.
import { getCollection } from '@/lib/store';
import { ServicesIdView } from '@/sections/services/ServicesIdView';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const services = await getCollection('services');
  return <ServicesIdView id={id} initialServices={services} />;
}
