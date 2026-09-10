'use client';
// ─────────────────────────────────────────────────────────────
// TestimonialQuote — centered single-quote carousel with quote
// mark, prev/next chevrons and dot indicators.
// Legacy component: NOT currently rendered (superseded by
// TestimonialGrid's 3D coverflow used on the homepage). Keep for
// reference only. Reads TESTIMONIALS from data/salonData.ts.
// ─────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { TESTIMONIALS } from '@/data/salonData';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ScrollReveal, SpringReveal } from './ScrollReveal';

export const TestimonialQuote: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % TESTIMONIALS.length);
  };

  const current = TESTIMONIALS[currentIndex];

  return (
    <section id="testimonials" className="bg-white py-20 sm:py-28 border-t border-neutral-100">
      <div className="max-w-5xl mx-auto px-6 sm:px-8 relative">
        {/* Central Quote Mark — spring scale from 0 */}
        <SpringReveal
          direction="up"
          distance={0}
          scale={0.3}
          easing="spring"
          origin="50% 50%"
        >
          <div className="flex justify-center mb-6">
            <Quote className="w-8 h-8 sm:w-10 sm:h-10 text-black fill-black" />
          </div>
        </SpringReveal>

        {/* Quote Content with Slide Transition */}
        <div className="relative min-h-[160px] sm:min-h-[180px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -14, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="text-center px-12 sm:px-16"
            >
              <h3 className="font-editorial text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black uppercase text-black tracking-tight leading-[1.3] max-w-3xl mx-auto mb-6">
                &ldquo;{current.quote}&rdquo;
              </h3>
              <p className="text-xs sm:text-sm font-semibold tracking-wider text-black">
                {current.author}, <span className="font-normal text-neutral-500">{current.role}</span>
              </p>
            </motion.div>
          </AnimatePresence>

          <button
            onClick={prevTestimonial}
            className="absolute left-0 top-1/2 -translate-y-1/2 p-2 text-black hover:text-neutral-500 transition-colors cursor-pointer focus:outline-none"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8 stroke-[1.5]" />
          </button>
          <button
            onClick={nextTestimonial}
            className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-black hover:text-neutral-500 transition-colors cursor-pointer focus:outline-none"
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8 stroke-[1.5]" />
          </button>
        </div>

        {/* Carousel Dot Indicators */}
        <div className="flex justify-center items-center gap-2 mt-8">
          {TESTIMONIALS.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => setCurrentIndex(idx)}
              className={`w-2 h-2 transition-all cursor-pointer ${
                currentIndex === idx ? 'bg-black w-2.5 h-2.5' : 'bg-neutral-300 hover:bg-neutral-400'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};