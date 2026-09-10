'use client';

import { use } from 'react';
import { useSite } from '@/components/Providers';
import { ServiceDetailPage } from '@/components/ServiceDetailPage';
import { ServicesByCategory } from '@/components/ServicesByCategory';
import { ALL_CATEGORIES, categorySlug } from '@/components/ServicesCategories';
import { SERVICES } from '@/data/salonData';

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { onSelectServiceForBooking } = useSite();

  const service = SERVICES.find((s) => s.id === id);
  const category = ALL_CATEGORIES.find((c) => categorySlug(c) === id);

  if (category) {
    return <ServicesByCategory category={category} onSelectService={onSelectServiceForBooking} />;
  }

  if (service) {
    return <ServiceDetailPage serviceId={service.id} onSelectServiceForBooking={onSelectServiceForBooking} />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f7f5ee] px-6 text-center">
      <p className="text-[11px] tracking-[0.3em] uppercase text-neutral-500 mb-4">Paul Hair Studio</p>
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