'use client';
import React from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft } from 'lucide-react';
import { SERVICES, SERVICE_MEDIA } from '@/data/salonData';
import { ServiceItem } from '@/types';

interface ServicesByCategoryProps {
  category: string;
  onSelectService: (service: ServiceItem) => void;
}

export const ServicesByCategory: React.FC<ServicesByCategoryProps> = ({ category, onSelectService }) => {
  const services = SERVICES.filter((s) => s.category === category);

  return (
    <div className="bg-[#f7f5ee] min-h-screen">
      {/* Header */}
      <div className="pt-32 sm:pt-40 pb-10 sm:pb-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <Link
            href="/services"
            className="inline-flex items-center gap-1.5 text-[11px] tracking-[0.25em] uppercase text-neutral-500 hover:text-black transition-colors mb-6"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            All Categories
          </Link>
          <p className="text-[11px] sm:text-xs tracking-[0.3em] uppercase text-neutral-500 mb-4">
            Paul Hair Studio
          </p>
          <h1 className="font-editorial text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight leading-none text-black">
            {category}
          </h1>
          <p className="mt-5 text-sm sm:text-base text-neutral-600 leading-relaxed max-w-xl mx-auto">
            {services.length} {services.length === 1 ? 'treatment' : 'treatments'} in this discipline.
          </p>
        </div>
      </div>

      {/* Services grid */}
      <div className="px-4 sm:px-6 lg:px-8 pb-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-7">
          {services.map((service) => {
            const media = SERVICE_MEDIA[service.id];
            const image = media?.image ?? '/images/hero-1.jpg';
            return (
              <article
                key={service.id}
                className="group bg-white border border-neutral-200 hover:bg-black hover:border-black transition-colors duration-300 overflow-hidden"
              >
                <Link href={`/services/${service.id}`} className="block">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={image}
                      alt={media?.alt ?? service.name}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <span className="absolute top-3 left-3 text-[10px] font-bold tracking-[0.2em] uppercase bg-white/90 text-black px-3 py-1">
                      {service.category}
                    </span>
                  </div>
                  <div className="p-6 sm:p-8 flex flex-col gap-3">
                    <h3 className="font-editorial text-base sm:text-lg font-black uppercase tracking-wide text-black group-hover:text-white transition-colors">
                      {service.name}
                    </h3>
                    <p className="text-sm text-neutral-600 group-hover:text-white/70 leading-relaxed transition-colors line-clamp-2">
                      {service.description}
                    </p>
                    <div className="flex items-center justify-between mt-2 pt-4 border-t border-neutral-200 group-hover:border-white/20 transition-colors">
                      <span className="text-[11px] uppercase tracking-[0.2em] text-neutral-500 group-hover:text-white/60">
                        {service.durationMinutes} min
                      </span>
                      <span className="font-bold text-black group-hover:text-white text-sm">
                        CHF {service.price}
                      </span>
                    </div>
                  </div>
                </Link>
                <div className="p-6 sm:p-8 pt-0">
                  <button
                    type="button"
                    onClick={() => onSelectService(service)}
                    className="group/btn w-full inline-flex items-center justify-center gap-2 bg-black text-white text-xs font-bold tracking-[0.2em] uppercase px-6 py-3.5 hover:bg-black group-hover:bg-white group-hover:text-black transition-colors cursor-pointer"
                  >
                    Book now
                    <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
};