'use client';
// About — homepage "Our Story" section: parallax salon image on the left,
// brand narrative + "As Seen In" press logos (Vogue, Elle, etc.) on the
// right. Rendered by HomePage between PartnerBar and ServiceMenu.
// Uses custom ScrollReveal / SpringReveal / Parallax wrappers for
// scroll-triggered fade-in and spring entrance animations.

import React from 'react';
import { ScrollReveal, SpringReveal, Parallax } from './ScrollReveal';

export const About: React.FC = () => {
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
                  src="/images/lookbook-2.jpg"
                  alt="Paul Hair Studio salon atmosphere"
                  className="w-full h-[420px] sm:h-[580px] object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
              </Parallax>
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
            </SpringReveal>
          </div>

          {/* Right: Brand Story */}
          <div className="lg:col-span-7">
            <ScrollReveal scaleY={0.08} distance={0} origin="50% 100%">
              <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-neutral-400 mb-4 block">
                Our Story
              </span>
              <h2 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-black uppercase text-black tracking-tight leading-[1.05] mb-6 sm:mb-8">
                WHERE CRAFT<br />
                MEETS PRECISION
              </h2>
            </ScrollReveal>

            <ScrollReveal direction="right" distance={40} className="space-y-4 max-w-lg">
              <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
                Paul Hair Studio was founded on a single belief: every client deserves a bespoke
                experience shaped by mastery, not trend. From our ateliers in Zurich and Paris,
                Creative Director Paul Delacroix and his team craft editorial-grade colour,
                precision cutting, and transformative treatments — each one tailored to the
                individual.
              </p>
              <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
                We work exclusively with botanical formulations and cold-pressed oils, because
                luxury is in the details. The result is hair that moves, shines, and lasts.
              </p>
            </ScrollReveal>

            {/* Press Mentions — staggered spring from left */}
            <div className="mt-10 sm:mt-14 pt-8 border-t border-neutral-200 -ml-4 sm:-ml-6 lg:-ml-8">
              <ScrollReveal direction="left" distance={30}>
                <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-neutral-400 mb-5 block">
                  As Seen In
                </span>
              </ScrollReveal>
              <div className="flex flex-wrap items-center justify-start gap-6 sm:gap-10">
                {['VOGUE', 'ELLE', 'BAZAAR', 'W', 'GQ'].map((pub, i) => (
                  <SpringReveal key={pub} direction="left" distance={20} delay={i * 0.08} easing="snappy">
                    <span className="text-sm sm:text-base font-editorial font-black uppercase tracking-[0.15em] text-neutral-300 hover:text-black transition-colors">
                      {pub}
                    </span>
                  </SpringReveal>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};