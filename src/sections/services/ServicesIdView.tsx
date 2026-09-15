'use client';
// ServicesIdView — Client component for /services/[id] (services workflow step 2 & 3).
// Receives live server-fetched services as `initialServices` (for correct SSR output)
// and keeps them fresh via useSiteContent's client-side refetch.
// Resolves the URL param against category slugs first, then service IDs.
import { useSite } from '@/components/layout/Providers';
import { useSiteContent } from '@/hooks/useSiteContent';
import { ServiceDetailPage } from '@/sections/services/ServiceDetailPage';
import { ServicesByCategory } from '@/sections/services/ServicesByCategory';
import { categorySlug } from '@/sections/services/ServicesCategories';
import { ServiceItem } from '@/types';

interface ServicesIdViewProps {
  id: string;
  initialServices: ServiceItem[];
}

export function ServicesIdView({ id, initialServices }: ServicesIdViewProps) {
  const { onSelectServiceForBooking } = useSite();
  const { services } = useSiteContent({ services: initialServices });

  const service = services.find((service: ServiceItem) => service.id === id);
  const category = services.find(
    (s: ServiceItem) => categorySlug(s.category) === id
  )?.category;

  if (category) {
    return (
      <ServicesByCategory
        category={category}
        onSelectService={onSelectServiceForBooking}
        initialServices={initialServices}
      />
    );
  }

  if (service) {
    return (
      <ServiceDetailPage
        serviceId={service.id}
        onSelectServiceForBooking={onSelectServiceForBooking}
        initialServices={initialServices}
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f7f5ee] px-6 text-center">
      <p className="text-[11px] tracking-[0.3em] uppercase text-neutral-500 mb-4">
        Paul Hair Studio
      </p>
      <h1 className="font-editorial text-3xl sm:text-4xl font-black uppercase text-black">
        Page not found
      </h1>
      <a
        href="/services"
        className="mt-6 text-xs font-bold tracking-[0.2em] uppercase bg-black text-white px-6 py-3.5"
      >
        Back to Services
      </a>
    </div>
  );
}
