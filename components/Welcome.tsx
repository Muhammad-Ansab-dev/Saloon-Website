'use client';
// ─────────────────────────────────────────────────────────────
// Welcome — small pink statement band with a brand intro and an
// "EXPLORE SERVICES" CTA that scrolls to the #services section.
// Legacy component: NOT currently rendered on any page. Keep for
// reference only.
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { motion } from 'motion/react';

export const Welcome: React.FC = () => {
  return (
    <section id="welcome" className="bg-[#fce7ee] py-16 sm:py-20 text-center">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="font-editorial text-xl sm:text-2xl md:text-3xl font-black uppercase text-black tracking-tight leading-snug"
        >
          Editorial luxury hair care rooted in Swiss precision.{' '}
          <span className="text-neutral-500">Every cut, colour, and treatment is tailored to you.</span>
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-8"
        >
          <button
            onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-8 py-3.5 bg-black text-white text-xs font-bold tracking-[0.2em] uppercase hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            EXPLORE SERVICES
          </button>
        </motion.div>
      </div>
    </section>
  );
};
