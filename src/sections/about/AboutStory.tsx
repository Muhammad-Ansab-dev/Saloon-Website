'use client';
// ─────────────────────────────────────────────────────────────
// AboutStory — "Our Story" split section: parallax studio image on
// the left, scroll-revealed eyebrow, headline, and brand copy on
// the right.
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { ScrollReveal, SpringReveal, Parallax } from '@/components/ui/ScrollReveal';

export const AboutStory: React.FC = () => {
  return (
    <section className="bg-white py-20 sm:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
          <div className="lg:col-span-5">
            <SpringReveal direction="left" distance={100} easing="spring" className="relative overflow-hidden shadow-2xl">
              <div className="relative h-[420px] sm:h-[520px]">
                <Parallax amount={30}>
                  <img
                    src="https://res.cloudinary.com/dittrfbja/image/upload/v1789650831/hair-salon/lookbook-2.webp"
                    alt="Inside Paul Hair Studio"
                    className="w-full h-[520px] object-cover object-center"
                  />
                </Parallax>
              </div>
              <div className="absolute inset-0 bg-black/10" />
            </SpringReveal>
          </div>

          <div className="lg:col-span-7">
            <ScrollReveal direction="down" distance={20}>
              <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-neutral-400 mb-4 block">
                Our Story
              </span>
            </ScrollReveal>
            <ScrollReveal scaleY={0.08} distance={0} origin="50% 100%">
              <h2 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-black uppercase text-black tracking-tight leading-[1.05] mb-6 sm:mb-8">
                CRAFT IS NOT A<br />SERVICE. IT IS A PACT.
              </h2>
            </ScrollReveal>

            <ScrollReveal direction="right" distance={40} className="space-y-4 max-w-xl">
              <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
                Paul Hair Studio was born in 2013 from a single chair in Zurich's Seefeld district.
                Founder Paul Delacroix believed that hair was not a commodity but a personal
                architecture — one that deserved the same precision, patience, and artistry as
                haute couture.
              </p>
              <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
                Today the House spans two ateliers — Zurich and Paris — yet every session still
                opens the same way: a private ritual of consultation, diagnosis, and intention.
                We are a school, a salon, and a botanical laboratory. Our artisans train for years
                before they ever touch a client.
              </p>
              <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
                The result is hair that moves, shines, and lasts — sculpted for real life, not just
                the runway. This is Swiss precision, French flair, and a quiet obsession with the
                craft of making people feel unmistakably themselves.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
};
