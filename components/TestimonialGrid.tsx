'use client';
import React, { useState } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { TESTIMONIALS } from '@/data/salonData';

const CLIENT_IMAGES = [
  '/images/lookbook-3.jpg',
  '/images/lookbook-2.jpg',
  '/images/instagram-1.jpg',
  '/images/instagram-4.jpg',
  '/images/lookbook-1.jpg',
  '/images/hair-hero1.webp',
  '/images/instagram-3.jpg',
  '/images/hair-hero2.avif',
  '/images/hair-hero3.jpeg',
];

const TestimonialCard: React.FC<{ index: number }> = ({ index }) => {
  const t = TESTIMONIALS[index];
  const image = CLIENT_IMAGES[index % CLIENT_IMAGES.length];
  return (
    <>
      {/* Image — left 40% (desktop) */}
      <div className="hidden lg:block lg:w-[40%] relative overflow-hidden bg-neutral-900">
        <img
          src={image}
          alt={t.author}
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
      </div>

      {/* Content — right 60% */}
      <div className="w-full lg:w-[60%] flex flex-col justify-center gap-5 lg:gap-6 px-8 sm:px-12">
        <div className="flex items-center gap-2">
          <span className="w-5 h-px bg-neutral-400" />
          <span className="text-[9px] font-bold tracking-[0.3em] uppercase text-neutral-400">
            Client Word
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="w-4 h-4 text-[#f3cbd7] fill-[#f3cbd7]" />
          ))}
        </div>

        <p className="font-editorial text-lg sm:text-xl md:text-2xl font-black uppercase text-black tracking-tight leading-[1.25] line-clamp-4">
          "{t.quote}"
        </p>

        <div className="border-t border-neutral-200 pt-5">
          <p className="text-sm font-bold tracking-wider uppercase text-black">{t.author}</p>
          <p className="text-xs text-neutral-500 mt-1">
            {t.role} · {t.location}
          </p>
        </div>
      </div>
    </>
  );
};

export const TestimonialGrid: React.FC = () => {
  const [active, setActive] = useState(0);
  const count = TESTIMONIALS.length;

  const positionOf = (i: number): number => {
    let d = (i - active + count) % count;
    if (d > count / 2) d -= count;
    return d;
  };

  const transformFor = (d: number) => {
    if (d === 0) return { x: '0%', rotateY: 0, scale: 1, opacity: 1, zIndex: 30 };
    if (d === 1) return { x: '52%', rotateY: -34, scale: 0.82, opacity: 0.6, zIndex: 20 };
    if (d === -1) return { x: '-52%', rotateY: 34, scale: 0.82, opacity: 0.6, zIndex: 20 };
    return { x: '0%', rotateY: 0, scale: 0.7, opacity: 0, zIndex: 0 };
  };

  const prev = () => setActive((a) => (a - 1 + count) % count);
  const next = () => setActive((a) => (a + 1) % count);

  return (
    <section id="testimonials" className="bg-white py-20 sm:py-28 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* 3D Coverflow Stage */}
        <div
          className="relative h-[560px] sm:h-[520px] lg:h-[480px]"
          style={{ perspective: 1400, perspectiveOrigin: '50% 50%' }}
        >
          {TESTIMONIALS.map((_, i) => {
            const d = positionOf(i);
            const t = transformFor(d);
            return (
              <motion.div
                key={i}
                animate={{
                  x: t.x,
                  rotateY: t.rotateY,
                  scale: t.scale,
                  opacity: t.opacity,
                  zIndex: t.zIndex,
                }}
                transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                onClick={() => {
                  if (d === 1) next();
                  else if (d === -1) prev();
                }}
                className="absolute inset-0 flex flex-col lg:flex-row bg-white border border-neutral-200 shadow-lg overflow-hidden cursor-pointer"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <TestimonialCard index={i} />
              </motion.div>
            );
          })}
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={prev}
          aria-label="Previous testimonial"
          className="absolute left-2 sm:left-6 lg:-left-6 top-1/2 -translate-y-1/2 z-40 w-16 h-16 rounded-full border border-black bg-white/10 backdrop-blur-[10px] text-neutral-900 hover:bg-black hover:text-white hover:border-black flex items-center justify-center transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
        <button
          onClick={next}
          aria-label="Next testimonial"
          className="absolute right-2 sm:right-6 lg:-right-6 top-1/2 -translate-y-1/2 z-40 w-16 h-16 rounded-full border border-black bg-white/10 backdrop-blur-[10px] text-neutral-900 hover:bg-black hover:text-white hover:border-black flex items-center justify-center transition-colors cursor-pointer"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>
    </section>
  );
};