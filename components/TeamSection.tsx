'use client';
import React from 'react';
import { motion } from 'motion/react';
import { STYLISTS } from '@/data/salonData';
import { ScrollReveal, SpringReveal, Parallax } from './ScrollReveal';

const TEAM_IMAGES = [
  '/images/hair-hero1.webp',
  '/images/hair-hero2.avif',
  '/images/hair-hero3.jpeg',
  '/images/lookbook-3.jpg',
  '/images/instagram-2.jpg',
  '/images/hair-service1.avif',
  '/images/press-1.jpg',
  '/images/lookbook-1.jpg',
];

export const TeamSection: React.FC = () => {
  return (
    <section id="team" className="bg-white py-20 sm:py-28">
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

        <div className="overflow-x-auto snap-x snap-mandatory -mx-4 px-4 pb-4 scroll-smooth">
          <div className="flex gap-4 sm:gap-6">
            {STYLISTS.map((stylist, idx) => (
              <SpringReveal
                key={stylist.id}
                direction={idx % 2 === 0 ? 'left' : 'right'}
                distance={45}
                delay={idx * 0.06}
                easing="spring"
                className="group shrink-0 snap-start w-[85%] sm:w-[45%] lg:w-[23.5%]"
              >
                <div className="relative aspect-[3/4] bg-neutral-200 overflow-hidden mb-4">
                  <Parallax amount={16}>
                    <img
                      src={TEAM_IMAGES[idx]}
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
      </div>
    </section>
  );
};