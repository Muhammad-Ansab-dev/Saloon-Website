'use client';
// ─────────────────────────────────────────────────────────────
// AboutTeam — "The Masters Behind the Chairs" two-column artisan
// gallery. Stylists come from the live content store via
// useSiteContent, falling back to the static STYLISTS list.
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { ScrollReveal, SpringReveal, Parallax } from '@/components/ui/ScrollReveal';
import { STYLISTS, STYLIST_IMAGE_BY_ID } from '@/data/salonData';
import { useSiteContent } from '@/hooks/useSiteContent';

export const AboutTeam: React.FC = () => {
  const { stylists } = useSiteContent({ stylists: STYLISTS });

  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-14 sm:mb-20 gap-6">
          <div>
            <ScrollReveal direction="down" distance={20}>
              <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-neutral-400 mb-4 block">
                The Artisans
              </span>
            </ScrollReveal>
            <ScrollReveal scaleY={0.1} distance={0} origin="50% 100%">
              <h2 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-black uppercase text-black tracking-tight leading-[1.05]">
                THE MASTERS BEHIND<br />THE CHAIRS
              </h2>
            </ScrollReveal>
          </div>
          <ScrollReveal direction="up" distance={20} className="max-w-xs text-xs text-neutral-500 leading-relaxed">
            <p>
              Seven specialists. Decades of combined experience. Each chair is helmed by an artisan
              who owns their discipline completely.
            </p>
          </ScrollReveal>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
          {stylists.map((stylist, idx) => (
            // Two-column gallery; cards alternate entrance direction with a small stagger.
            <SpringReveal
              key={stylist.id}
              direction={idx % 2 === 0 ? 'left' : 'right'}
              distance={40}
              delay={idx * 0.06}
              easing="spring"
              className="group"
            >
              <div className="relative h-[80vh] sm:h-[85vh] bg-neutral-200 overflow-hidden mb-4">
                <Parallax amount={16}>
                  <img
                    src={stylist.image || STYLIST_IMAGE_BY_ID[stylist.id] || 'https://res.cloudinary.com/dittrfbja/image/upload/v1789651072/hair-salon/hair-hero1.webp'}
                    alt={stylist.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  />
                </Parallax>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
              </div>
              <div className="flex items-end justify-between gap-4 border-b border-neutral-200 pb-3">
                <h3 className="font-editorial text-base sm:text-xl font-bold uppercase tracking-wider text-black mb-0">
                  {stylist.name}
                </h3>
                <p className="text-[10px] sm:text-xs text-neutral-500 text-right">{stylist.role}</p>
              </div>
            </SpringReveal>
          ))}
        </div>
      </div>
    </section>
  );
};
