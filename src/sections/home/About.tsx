'use client';
// About — homepage "Our Story" section: parallax salon image on the left,
// brand narrative + "As Seen In" press logos (Vogue, Elle, etc.) on the
// right. Rendered by HomePage between PartnerBar and ServiceMenu.
// Uses custom ScrollReveal / SpringReveal / Parallax wrappers for
// scroll-triggered fade-in and spring entrance animations.

import React from 'react';
import { SpringReveal, Parallax } from '../../components/ui/ScrollReveal';
import { useSiteContent } from '@/hooks/useSiteContent';

export const About: React.FC = () => {
  const { images } = useSiteContent();
  return (
    <section id="about" className="relative bg-white py-20 sm:py-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left: Visual — salon atmosphere image (slides in from left with spring) */}
          <div className="lg:col-span-5">
            <SpringReveal
              direction="left"
              distance={100}
              easing="spring"
              className="relative overflow-hidden shadow-2xl group"
            >
              <Parallax amount={26}>
                <img
                  src={images.about ?? 'https://res.cloudinary.com/dittrfbja/image/upload/v1789650831/hair-salon/lookbook-2.webp'}
                  alt="Paul Hair Studio salon atmosphere"
                  className="w-full h-[420px] sm:h-[580px] object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
              </Parallax>
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
            </SpringReveal>
          </div>

          {/* Right: Brand Story */}
          <div className="lg:col-span-7 space-y-8 sm:space-y-10">
            {/* Eyebrow */}
            <SpringReveal direction="up" distance={24} easing="smooth">
              <span className="inline-flex items-center gap-3 text-[10px] font-bold tracking-[0.25em] uppercase text-neutral-400">
                <span className="w-8 h-px bg-neutral-300 inline-block" />
                Our Story
              </span>
            </SpringReveal>

            {/* Heading */}
            <div>
              <SpringReveal direction="up" distance={40} easing="smooth">
                <h2 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-black uppercase text-black tracking-tight leading-[1.05]">
                  WHERE CRAFT
                </h2>
              </SpringReveal>
              <SpringReveal direction="up" distance={40} easing="spring" delay={0.12}>
                <h2 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-black uppercase text-black tracking-tight leading-[1.05]">
                  <span className="text-neutral-300">MEETS</span> PRECISION
                </h2>
              </SpringReveal>
            </div>

            {/* Body — staggered */}
            <div className="space-y-4">
              <SpringReveal direction="right" distance={32} easing="smooth" delay={0.1}>
                <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
                  Paul Hair Studio was founded on a single belief: every client deserves a bespoke
                  experience shaped by mastery, not trend. From our ateliers in Zurich and Paris,
                  Creative Director Paul Delacroix and his team craft editorial-grade colour,
                  precision cutting, and transformative treatments — each one tailored to the
                  individual.
                </p>
              </SpringReveal>
              <SpringReveal direction="right" distance={32} easing="smooth" delay={0.22}>
                <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
                  We work exclusively with botanical formulations and cold-pressed oils, because
                  luxury is in the details. The result is hair that moves, shines, and lasts.
                </p>
              </SpringReveal>
            </div>

            {/* Press Mentions — staggered spring from left */}
            <SpringReveal direction="up" distance={24} easing="smooth">
              <div className="pt-8 border-t border-neutral-200">
                <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-neutral-400 mb-5 block">
                  As Seen In
                </span>
                <div className="flex flex-wrap items-center justify-start gap-6 sm:gap-10">
                  {['VOGUE', 'ELLE', 'BAZAAR', 'W', 'GQ'].map((pub, i) => (
                    <SpringReveal
                      key={pub}
                      direction="left"
                      distance={20}
                      delay={0.2 + i * 0.09}
                      easing="snappy"
                      className="cursor-pointer"
                    >
                      <span className="block text-sm sm:text-base font-editorial font-black uppercase tracking-[0.15em] text-neutral-300 hover:text-black hover:scale-110 transition-all duration-300">
                        {pub}
                      </span>
                    </SpringReveal>
                  ))}
                </div>
              </div>
            </SpringReveal>
          </div>
        </div>
      </div>
    </section>
  );
};