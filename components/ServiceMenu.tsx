'use client';
// ServiceMenu — Interactive price-list menu with category filter pills and a hover-synced image panel.
// Appears on the homepage/experience section (not part of the /services route workflow).
// Renders all services inline; clicking a row or image triggers the booking modal via onSelectService.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SERVICES, SERVICE_MEDIA } from '@/data/salonData';
import { ServiceItem } from '@/types';
import { Plus, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { ScrollReveal, SpringReveal, Parallax } from './ScrollReveal';
import '../experience/serviceMenu.css';

interface ServiceMenuProps {
  onSelectService: (service: ServiceItem) => void;
}

const CATEGORY_OPTIONS = ['All', ...Array.from(new Set(SERVICES.map((s) => s.category)))];

export const ServiceMenu: React.FC<ServiceMenuProps> = ({ onSelectService }) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [activeServiceId, setActiveServiceId] = useState<string>(SERVICES[0].id);
  const listRef = useRef<HTMLDivElement>(null);

  const visibleServices = useMemo(
    () =>
      activeCategory === 'All'
        ? SERVICES
        : SERVICES.filter((s) => s.category === activeCategory),
    [activeCategory]
  );

  useEffect(() => {
    if (!visibleServices.some((s) => s.id === activeServiceId)) {
      setActiveServiceId(visibleServices[0]?.id ?? SERVICES[0].id);
    }
  }, [visibleServices, activeServiceId]);

  /* Constant viewport of exactly 4 rows — height never changes, so pills stay put. */
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const measure = () => {
      const items = list.children;
      if (items.length === 0) return;
      const first = items[0] as HTMLElement;
      const gap = items.length > 1
        ? (items[1] as HTMLElement).offsetTop - first.offsetTop - first.offsetHeight
        : 0;
      const rowHeight = first.offsetHeight;
      list.style.maxHeight = `${rowHeight * 4 + gap * 3}px`;
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const activeService = visibleServices.find((s) => s.id === activeServiceId) ?? visibleServices[0];
  const activeMedia = activeService ? SERVICE_MEDIA[activeService.id] : undefined;

  return (
    <section id="services" className="bg-white py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Title & Price List */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            {/* Title — scaleY wipe from bottom */}
            <ScrollReveal scaleY={0.08} distance={0} origin="50% 100%" className="mb-10 sm:mb-12">
              <h2 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-black uppercase text-black tracking-tight leading-[1.05]">
                <span className="block">CRAFT</span>
                <span className="block">HEALING</span>
              </h2>
            </ScrollReveal>

            {/* Category Pills */}
            <div className="z-10 bg-white/95 backdrop-blur-sm py-3 mb-8 sm:mb-10">
              <div className="flex flex-wrap gap-2">
                {CATEGORY_OPTIONS.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors ${
                      activeCategory === cat
                        ? 'bg-black text-white border border-black'
                        : 'border border-neutral-300 text-neutral-600 hover:border-black hover:text-black'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* View all link */}
            <div className="mb-8 sm:mb-10">
              <Link
                href="/services"
                className="inline-flex items-center gap-1.5 text-xs font-bold tracking-[0.15em] uppercase text-black hover:text-neutral-500 transition-colors border-b border-black hover:border-neutral-500 pb-0.5"
              >
                View all services <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Price List Items — filtered in real time by active pill */}
            <div ref={listRef} className="svcm-list space-y-6 sm:space-y-7">
              {visibleServices.map((service, idx) => (
                <SpringReveal
                  key={service.id}
                  direction="right"
                  distance={30}
                  delay={idx * 0.07}
                  easing="snappy"
                >
                  <div
                    onMouseEnter={() => setActiveServiceId(service.id)}
                    onClick={() => onSelectService(service)}
                    className="group cursor-pointer border-b border-neutral-200 pb-4 hover:bg-neutral-50 hover:pl-4 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  >
                    <div className="flex items-baseline justify-between mb-1">
                      <h3 className="font-editorial text-sm sm:text-base font-medium uppercase tracking-wider text-black group-hover:font-black underline decoration-transparent group-hover:decoration-black underline-offset-4 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] flex items-center gap-2">
                        <span>{service.name}</span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" />
                      </h3>
                      <span className="font-editorial text-sm sm:text-base font-bold text-black tracking-wider ml-4 transition-all duration-300 group-hover:font-black">
                        ${service.price}
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-neutral-500 font-normal group-hover:text-neutral-700 transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]">
                      {service.description}
                    </p>
                  </div>
                </SpringReveal>
              ))}
            </div>
          </div>

          {/* Right Column: Image — slides in from right with rotation + spring */}
          <div className="lg:col-span-6">
            <SpringReveal
              direction="right"
              distance={80}
              rotate={2}
              easing="spring"
              className="relative overflow-hidden shadow-2xl group bg-neutral-100"
            >
              <Parallax amount={18}>
                <div className="relative w-full h-[450px] sm:h-[550px]">
                  <AnimatePresence mode="popLayout">
                    <motion.img
                      key={activeService?.id}
                      src={activeMedia?.image ?? '/images/hero-1.jpg'}
                      alt={activeMedia?.alt ?? activeService?.name ?? 'Service'}
                      initial={{ opacity: 0, scale: 1.04 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.45, ease: 'easeOut' }}
                      className="absolute inset-0 w-full h-full object-cover object-center"
                    />
                  </AnimatePresence>
                </div>
              </Parallax>
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
            </SpringReveal>
          </div>
        </div>
      </div>
    </section>
  );
};