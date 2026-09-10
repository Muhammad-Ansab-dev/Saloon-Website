'use client';
// PartnerBar — infinite horizontal marquee of brand / partner logos.
// Sits directly below VfxHero on the homepage, providing social proof
// via stylised text labels (Bed Head, ArganOil, etc.). Duplicate track
// creates a seamless CSS-free loop. Rendered by HomePage.
// Uses motion/react for the infinite x-translation animation.

import React from 'react';
import { Scissors, Sparkles, Waves } from 'lucide-react';
import { motion } from 'motion/react';

const PARTNER_ITEMS = [
  {
    id: 'bedhead',
    render: () => (
      <div className="flex items-center space-x-1.5 cursor-default group shrink-0">
        <span className="font-editorial text-xl sm:text-2xl font-black tracking-tighter text-black group-hover:scale-105 transition-transform">
          bed head
        </span>
      </div>
    ),
  },
  {
    id: 'haircare',
    render: () => (
      <div className="flex items-center space-x-2 cursor-default group shrink-0">
        <Sparkles className="w-4 h-4 text-black/70 group-hover:rotate-12 transition-transform" />
        <span className="font-script text-2xl sm:text-3xl font-bold tracking-wide text-black group-hover:scale-105 transition-transform">
          HAIRCARE
        </span>
      </div>
    ),
  },
  {
    id: 'curl',
    render: () => (
      <div className="flex items-center cursor-default group shrink-0">
        <span className="font-editorial text-lg sm:text-xl font-black tracking-[0.25em] uppercase text-black group-hover:scale-105 transition-transform">
          CURL
        </span>
      </div>
    ),
  },
  {
    id: 'hairwave',
    render: () => (
      <div className="flex flex-col items-center cursor-default group shrink-0">
        <Waves className="w-5 h-5 text-black mb-0.5 group-hover:-translate-y-0.5 transition-transform" />
        <span className="text-[10px] sm:text-xs font-semibold tracking-[0.3em] uppercase text-black">
          HAIRWAVE
        </span>
      </div>
    ),
  },
  {
    id: 'arganoil',
    render: () => (
      <div className="flex items-center cursor-default group shrink-0">
        <span className="font-serif-luxury text-xl sm:text-2xl italic font-bold tracking-normal text-black group-hover:scale-105 transition-transform">
          ArganOil
        </span>
      </div>
    ),
  },
  {
    id: 'beautysalon',
    render: () => (
      <div className="flex items-center space-x-2 cursor-default group shrink-0">
        <div className="w-8 h-8 rounded-full border border-black/30 flex items-center justify-center group-hover:rotate-45 transition-transform">
          <Scissors className="w-4 h-4 text-black" />
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] sm:text-[10px] font-black tracking-[0.25em] uppercase text-black">
            BEAUTY SALON
          </span>
          <span className="text-[7px] tracking-widest text-black/60 uppercase">
            EXCLUSIVE
          </span>
        </div>
      </div>
    ),
  },
];

export const PartnerBar: React.FC = () => {
  return (
    <section className="relative bg-[#fce7ee] py-6 sm:py-7 border-y border-[#fae1e8] overflow-hidden">
      {/* Soft gradient edge masks for luxury fade-in/fade-out */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-28 bg-gradient-to-r from-[#fce7ee] to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-28 bg-gradient-to-l from-[#fce7ee] to-transparent z-10" />

      <div className="w-full overflow-hidden flex">
        <motion.div
          className="flex items-center whitespace-nowrap will-change-transform opacity-85 hover:opacity-100 transition-opacity"
          animate={{ x: ['0%', '-50%'] }}
          transition={{
            repeat: Infinity,
            ease: 'linear',
            duration: 22,
          }}
        >
          {/* Primary loop track */}
          <div className="flex items-center space-x-12 sm:space-x-16 md:space-x-20 pr-12 sm:pr-16 md:pr-20 shrink-0">
            {PARTNER_ITEMS.map((partner) => (
              <React.Fragment key={`p1-${partner.id}`}>
                {partner.render()}
              </React.Fragment>
            ))}
          </div>

          {/* Duplicate track for seamless infinite loop */}
          <div
            className="flex items-center space-x-12 sm:space-x-16 md:space-x-20 pr-12 sm:pr-16 md:pr-20 shrink-0"
            aria-hidden="true"
          >
            {PARTNER_ITEMS.map((partner) => (
              <React.Fragment key={`p2-${partner.id}`}>
                {partner.render()}
              </React.Fragment>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
