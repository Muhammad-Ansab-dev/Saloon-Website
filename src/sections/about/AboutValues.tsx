'use client';
// ─────────────────────────────────────────────────────────────
// AboutValues — "Four Pillars of the House" grid. Each value card
// springs in from alternating sides and inverts to black on hover.
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { motion } from 'motion/react';
import { ScrollReveal, SpringReveal } from '@/components/ui/ScrollReveal';
import { Scissors, Flower2, Leaf, Gem } from 'lucide-react';

const VALUES = [
  {
    icon: Scissors,
    title: 'PRECISION',
    text: 'Every silhouette is engineered with surgical exactness. We treat each cut as sculpture — calibrated to bone structure, movement, and the way light falls.',
  },
  {
    icon: Flower2,
    title: 'MASTERY',
    text: 'Our artisans train for over a decade before the floor. The studio is a school, a salon, and an atelier where technique is never finished evolving.',
  },
  {
    icon: Leaf,
    title: 'CONSCIOUS LUXURY',
    text: 'Botanical, cold-pressed formulas and clean ingredients. Luxury that respects the environment as much as the hair it nourishes.',
  },
  {
    icon: Gem,
    title: 'BESPOKE RITUAL',
    text: 'No two consultations are alike. Every visit begins with a private consultation ritual, mapping your hair journey before a single strand is touched.',
  },
];

export const AboutValues: React.FC = () => {
  return (
    <section className="bg-neutral-50 py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-20">
          <ScrollReveal direction="down" distance={20}>
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-neutral-400 mb-4 block">
              What We Believe
            </span>
          </ScrollReveal>
          <ScrollReveal scaleY={0.1} distance={0} origin="50% 100%">
            <h2 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-black uppercase text-black tracking-tight leading-[1.05]">
              FOUR PILLARS OF THE HOUSE
            </h2>
          </ScrollReveal>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {VALUES.map((value, idx) => (
            <SpringReveal
              key={value.title}
              direction={idx % 2 === 0 ? 'left' : 'right'}
              distance={50}
              delay={idx * 0.1}
              easing="spring"
              className="h-full"
            >
              <motion.div
                className="h-full bg-white p-9 sm:p-12 border border-neutral-100 shadow-sm hover:shadow-2xl hover:scale-[1.04] hover:-translate-y-2 transition-all duration-300 ease-in-out group hover:bg-black hover:border-black flex flex-col cursor-default"
              >
                <value.icon className="w-9 h-9 sm:w-10 sm:h-10 text-black group-hover:text-white mb-5 sm:mb-6 group-hover:scale-110 transition-all duration-300" />
                <h3 className="font-editorial text-lg sm:text-xl font-black uppercase tracking-wider text-black group-hover:text-white mb-3 sm:mb-4 transition-colors duration-300">
                  {value.title}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-500 group-hover:text-white/70 leading-relaxed transition-colors duration-300">
                  {value.text}
                </p>
              </motion.div>
            </SpringReveal>
          ))}
        </div>
      </div>
    </section>
  );
};
