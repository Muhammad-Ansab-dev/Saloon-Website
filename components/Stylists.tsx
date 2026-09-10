'use client';
// ─────────────────────────────────────────────────────────────
// Stylists — "Our Professionals / MEET THE EXPERTS" grid card rail.
// Legacy component: NOT currently rendered by any page (superseded
// by AboutPage's TEAM section and TeamSection on the homepage).
// Alternating left/right spring reveals with parallax portraits,
// first 4 STYLISTS from data/salonData.ts. Keep for reference only.
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { STYLISTS } from '@/data/salonData';
import { ArrowRight } from 'lucide-react';
import { ScrollReveal, SpringReveal, Parallax } from './ScrollReveal';

const STYLIST_IMAGES = [
  '/images/hair-hero1.webp',
  '/images/hair-hero2.avif',
  '/images/hair-hero3.jpeg',
  '/images/lookbook-3.jpg',
];

const CARD_DIRS = ['left', 'right', 'left', 'right'] as const;

export const Stylists: React.FC = () => {
  return (
    <section id="stylists" className="bg-neutral-50 py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header — scale wipe from bottom */}
        <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-20">
          <ScrollReveal direction="down" distance={20}>
            <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-neutral-400 mb-4 block">
              Our Professionals
            </span>
          </ScrollReveal>
          <ScrollReveal scaleY={0.1} distance={0} origin="50% 100%">
            <h2 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-black uppercase text-black tracking-tight leading-[1.05]">
              MEET THE EXPERTS
            </h2>
          </ScrollReveal>
        </div>

        {/* Stylist Cards — alternating left/right spring with parallax images */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {STYLISTS.slice(0, 4).map((stylist, idx) => (
            <SpringReveal
              key={stylist.id}
              direction={CARD_DIRS[idx]}
              distance={50}
              delay={idx * 0.1}
              easing="spring"
              className="group"
            >
              {/* Portrait with parallax */}
              <div className="relative aspect-[3/4] bg-neutral-200 overflow-hidden mb-4">
                <Parallax amount={18}>
                  <img
                    src={STYLIST_IMAGES[idx]}
                    alt={stylist.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                </Parallax>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
              </div>

              <h3 className="font-editorial text-xs sm:text-sm font-bold uppercase tracking-wider text-black mb-1">
                {stylist.name}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-neutral-500 mb-3 leading-relaxed">
                {stylist.role}
              </p>
              <button
                onClick={() => {
                  document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-1 text-[10px] font-bold tracking-[0.18em] uppercase text-black border-b border-black pb-0.5 group-hover:gap-2 transition-all cursor-pointer"
              >
                <span>Book with {stylist.name.split(' ')[0]}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </SpringReveal>
          ))}
        </div>
      </div>
    </section>
  );
};