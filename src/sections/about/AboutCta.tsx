'use client';
// ─────────────────────────────────────────────────────────────
// AboutCta — blush closing banner. "Book your ritual" routes back
// to the homepage booking section via /?scrollTo=booking.
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { useRouter } from 'next/navigation';
import { SpringReveal } from '@/components/ui/ScrollReveal';
import { ArrowRight } from 'lucide-react';

export const AboutCta: React.FC = () => {
  const router = useRouter();

  return (
    <section className="bg-[#fce7ee] min-h-[200px] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 h-full min-h-[200px] flex flex-col sm:flex-row items-center justify-between gap-6 py-12 sm:py-0">
        <SpringReveal scale={0.95} distance={0} easing="spring">
          <h2 className="font-editorial text-2xl sm:text-3xl md:text-4xl font-black uppercase text-black tracking-tight leading-snug">
            EXPERIENCE THE CRAFT YOURSELF
          </h2>
        </SpringReveal>
        <SpringReveal direction="up" distance={20} easing="spring" delay={0.15}>
          <button
            onClick={() => router.push('/?scrollTo=booking')}
            className="inline-flex items-center gap-2 bg-black text-white px-8 py-4 text-xs font-bold tracking-[0.2em] uppercase hover:bg-neutral-800 transition-colors cursor-pointer shadow-sm shrink-0"
          >
            BOOK YOUR RITUAL <ArrowRight className="w-4 h-4" />
          </button>
        </SpringReveal>
      </div>
    </section>
  );
};
