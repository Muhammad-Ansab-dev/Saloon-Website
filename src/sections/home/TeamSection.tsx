'use client';
// TeamSection — "The Artisans" horizontal-scroll card strip on the homepage.
// Displays each stylist from salonData in a snap-scroll row with parallax
// images and staggered spring entrances. Rendered by HomePage between
// LookbookTrio and TestimonialGrid.
// Uses custom ScrollReveal / SpringReveal / Parallax for scroll-triggered
// entrances; motion/react is imported but the main animation is CSS snap.

import React from 'react';
import { motion } from 'motion/react';
import { ScrollReveal, SpringReveal, Parallax } from '../../components/ui/ScrollReveal';
import { useSiteContent } from '@/hooks/useSiteContent';
import { STYLIST_IMAGE_BY_ID } from '@/data/salonData';

export const TeamSection: React.FC = () => {
  // Stylist roster from the live store (admin-editable), static STYLISTS as fallback.
  const { stylists } = useSiteContent();

  return (
    <section id="team" className="bg-white py-20 sm:py-28 overflow-hidden">
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
              Seven specialists. Decades of combined experience. Each chair is helmed by an artisan who owns their discipline completely.
            </p>
          </ScrollReveal>
        </div>
      </div>

      {/* Full-width scrollable rail */}
      <div className="w-full overflow-x-auto snap-x snap-mandatory px-5 sm:px-5 lg:px-5 pb-4 scroll-smooth [scrollbar-width:thin] [&::-webkit-scrollbar]:h-[10px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-black/40 [&::-webkit-scrollbar-thumb]:rounded-full">
        <div className="flex gap-[30px] mx-[30px]">
          {stylists.map((stylist, idx) => (
            // Cards alternate entrance direction and stack with a slight delay per row.
            <SpringReveal
              key={stylist.id}
              direction={idx % 2 === 0 ? 'left' : 'right'}
              distance={45}
              delay={idx * 0.06}
              easing="spring"
              className="group shrink-0 snap-start w-[80%] sm:w-[45%] lg:w-[23.5%]"
            >
              <div className="relative h-[60vh] bg-neutral-200 overflow-hidden mb-4">
                <Parallax amount={16}>
                  <img
                    src={stylist.image || STYLIST_IMAGE_BY_ID[stylist.id] || 'https://res.cloudinary.com/dittrfbja/image/upload/v1789651072/hair-salon/hair-hero1.webp'}
                    alt={stylist.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  />
                </Parallax>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
              </div>
              <h3 className="font-editorial text-[10px] sm:text-xs font-bold uppercase tracking-wider text-black mb-1">
                {stylist.name}
              </h3>
              <p className="text-[9px] sm:text-[10px] text-neutral-500 leading-tight">{stylist.role}</p>
            </SpringReveal>
          ))}
        </div>
      </div>
    </section>
  );
};