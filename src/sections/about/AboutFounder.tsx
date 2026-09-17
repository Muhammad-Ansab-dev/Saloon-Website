'use client';
// ─────────────────────────────────────────────────────────────
// AboutFounder — dark founder profile. Portrait on the right (with
// parallax), founder name, pull-quote and biography on the left,
// all scroll-revealed.
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { ScrollReveal, SpringReveal, Parallax } from '@/components/ui/ScrollReveal';

export const AboutFounder: React.FC = () => {
  return (
    <section className="bg-neutral-950 py-20 sm:py-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-5 lg:order-2">
            <SpringReveal direction="right" distance={80} easing="spring" className="relative overflow-hidden shadow-2xl">
              <div className="relative h-[400px] sm:h-[500px]">
                <Parallax amount={24}>
                  <img
                    src="https://res.cloudinary.com/dittrfbja/image/upload/v1789650836/hair-salon/press-3.webp"
                    alt="Paul Delacroix, Founder & Creative Director"
                    className="w-full h-[500px] object-cover object-center filter contrast-110 brightness-90"
                  />
                </Parallax>
              </div>
              <div className="absolute inset-0 bg-black/10" />
            </SpringReveal>
          </div>

          <div className="lg:col-span-7 lg:order-1">
            <ScrollReveal direction="down" distance={20}>
              <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/50 mb-4 block">
                Founder & Creative Director
              </span>
            </ScrollReveal>
            <ScrollReveal scaleY={0.08} distance={0} origin="50% 100%">
              <h2 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-black uppercase text-white tracking-tight leading-[1.05] mb-6 sm:mb-8">
                PAUL DELACROIX
              </h2>
            </ScrollReveal>

            <ScrollReveal direction="right" distance={40} className="space-y-4 max-w-xl">
              <p className="text-sm sm:text-base text-white/60 leading-relaxed italic font-serif-luxury">
                &ldquo;I believe that every person carries an architecture within their hair — a structure waiting to be revealed. My role is simply to uncover it with patience, precision, and an unrelenting respect for the individual.&rdquo;
              </p>
              <p className="text-sm sm:text-base text-white/60 leading-relaxed">
                Paul trained under master stylists in Paris and Milan before opening his first atelier in Zurich's Seefeld district in 2013. His approach — part sculptor, part botanist — has earned the studio recognition in Vogue, Elle, and Harper's Bazaar.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
};
