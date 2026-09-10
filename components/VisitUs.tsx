'use client';
// VisitUs — "Visit Us" section listing Zurich and Paris salon locations
// with addresses, contact info, and Google Maps links. A decorative
// parallax salon image sits on the right. Rendered by HomePage between
// TestimonialGrid and NewsletterSubscribe.
// Uses custom ScrollReveal / SpringReveal / Parallax for scroll-triggered
// fade-in and spring entrance animations.

import React from 'react';
import { LOCATIONS } from '@/data/salonData';
import { ExternalLink } from 'lucide-react';
import { ScrollReveal, SpringReveal, Parallax } from './ScrollReveal';

export const VisitUs: React.FC = () => {
  return (
    <section id="visit" className="relative bg-[#f2f0eb] py-20 sm:py-28 overflow-hidden">
      {/* Background Giant Watermark Script Text */}
      <div className="absolute -bottom-10 -left-10 select-none pointer-events-none watermark-script text-[#f3cbd7] text-[18vw] leading-none z-0">
        haircare
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Information & Addresses */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <ScrollReveal scaleY={0.1} distance={0} origin="50% 100%">
              <h2 className="font-editorial text-4xl sm:text-5xl md:text-6xl font-black uppercase text-black tracking-tight mb-3">
                VISIT US OR CALL
              </h2>
            </ScrollReveal>

            <ScrollReveal direction="left" distance={30} className="text-sm sm:text-base text-neutral-700 font-normal mb-10 max-w-md">
              <p>
                Step into Paul Hair Studio and experience the art of hair care in an atmosphere designed for comfort and inspiration.
              </p>
            </ScrollReveal>

            {/* Branches: Zurich & Paris */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-10">
              {LOCATIONS.map((loc, idx) => (
                <SpringReveal
                  key={loc.city}
                  direction={idx === 0 ? 'left' : 'right'}
                  distance={40}
                  delay={idx * 0.12}
                  easing="spring"
                  className="space-y-3"
                >
                  <h3 className="font-editorial text-lg sm:text-xl font-black tracking-[0.15em] text-black uppercase border-b border-black/20 pb-1.5 inline-block">
                    {loc.city}
                  </h3>

                  <div className="text-sm text-neutral-800 space-y-2 leading-relaxed">
                    <p className="flex items-start gap-1.5">
                      <span className="font-semibold text-black">Address:</span>
                      <span>{loc.address}</span>
                    </p>
                    <p className="flex items-start gap-1.5">
                      <span className="font-semibold text-black">Email:</span>
                      <a href={`mailto:${loc.email}`} className="hover:underline hover:text-black transition-colors">
                        {loc.email}
                      </a>
                    </p>
                    <p className="flex items-start gap-1.5">
                      <span className="font-semibold text-black">Telephone:</span>
                      <a href={`tel:${loc.telephone.replace(/\s+/g, '')}`} className="hover:underline hover:text-black transition-colors">
                        {loc.telephone}
                      </a>
                    </p>
                  </div>

                  <div className="pt-2">
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(`${loc.address}, ${loc.city}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold tracking-wider text-black hover:opacity-75 uppercase"
                    >
                      <span>GET DIRECTIONS</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </SpringReveal>
              ))}
            </div>
          </div>

          {/* Right Column: Salon Image — slides in from right with slight rotation */}
          <div className="lg:col-span-6">
            <SpringReveal
              direction="right"
              distance={80}
              rotate={-1.5}
              easing="spring"
              className="relative overflow-hidden shadow-2xl group"
            >
              <Parallax amount={24}>
                <img
                  src="/images/visitus.jpg"
                  alt="Client receiving luxury hair treatment at salon wash basin"
                  className="w-full h-[380px] sm:h-[460px] object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
              </Parallax>
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
            </SpringReveal>
          </div>
        </div>
      </div>
    </section>
  );
};