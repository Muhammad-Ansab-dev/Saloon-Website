'use client';
// TestimonialGrid — 3D coverflow-style client testimonial carousel.
// Active card is centred; adjacent cards are rotated and scaled via
// CSS perspective + motion spring transitions. Each card shows a photo,
// star rating, quote, and author. Rendered by HomePage between
// TeamSection and VisitUs.
// Uses motion/react for the coverflow spring animation and arrow buttons.

import React, { useState } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { TESTIMONIALS } from '@/data/salonData';
import { useSiteContent } from '@/hooks/useSiteContent';

const CLIENT_IMAGES = [
  'https://res.cloudinary.com/dittrfbja/image/upload/v1789650832/hair-salon/lookbook-3.webp',
  'https://res.cloudinary.com/dittrfbja/image/upload/v1789650831/hair-salon/lookbook-2.webp',
  'https://res.cloudinary.com/dittrfbja/image/upload/v1789650823/hair-salon/instagram-1.webp',
  'https://res.cloudinary.com/dittrfbja/image/upload/v1789650827/hair-salon/instagram-4.webp',
  'https://res.cloudinary.com/dittrfbja/image/upload/v1789650830/hair-salon/lookbook-1.webp',
  'https://res.cloudinary.com/dittrfbja/image/upload/v1789651072/hair-salon/hair-hero1.webp',
  'https://res.cloudinary.com/dittrfbja/image/upload/v1789650825/hair-salon/instagram-3.webp',
  'https://res.cloudinary.com/dittrfbja/image/upload/v1789651073/hair-salon/hair-hero2.webp',
  'https://res.cloudinary.com/dittrfbja/image/upload/v1789650820/hair-salon/hair-hero3.webp',
];

// One testimonial card: photo on the left (desktop) and quote/author on the right.
const TestimonialCard: React.FC<{ index: number }> = ({ index }) => {
  const { images } = useSiteContent();
  const testimonial = TESTIMONIALS[index];
  // Admin-edited client photos win; otherwise rotate through the preset image list.
  const image =
    images[`testimonial.${(index % CLIENT_IMAGES.length) + 1}`] ?? CLIENT_IMAGES[index % CLIENT_IMAGES.length];
  return (
    <>
      {/* Image — left 40% (desktop) */}
      <div className="hidden lg:block lg:w-[40%] relative overflow-hidden bg-neutral-900">
        <img
          src={image}
          alt={testimonial.author}
          loading="lazy"
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
          "{testimonial.quote}"
        </p>

        <div className="border-t border-neutral-200 pt-5">
          <p className="text-sm font-bold tracking-wider uppercase text-black">{testimonial.author}</p>
          <p className="text-xs text-neutral-500 mt-1">
             {testimonial.role} · {testimonial.location}
          </p>
        </div>
      </div>
    </>
  );
};

export const TestimonialGrid: React.FC = () => {
  // Index of the centered (active) card.
  const [active, setActive] = useState(0);
  const count = TESTIMONIALS.length;

  // How far a card sits from the active one, using the short way around the
  // circular list (so -1/+1 are the two visible neighbours, not 8/9).
  const positionOf = (index: number): number => {
    let distance = (index - active + count) % count;
    if (distance > count / 2) distance -= count;
    return distance;
  };

  // Turn that distance into the 3D coverflow transform: front card full size,
  // neighbours angled and inset on either side, the rest hidden behind.
  const transformFor = (distance: number) => {
    if (distance === 0) return { x: '0%', rotateY: 0, scale: 1, opacity: 1, zIndex: 30 };
    if (distance === 1) return { x: '52%', rotateY: -34, scale: 0.82, opacity: 0.6, zIndex: 20 };
    if (distance === -1) return { x: '-52%', rotateY: 34, scale: 0.82, opacity: 0.6, zIndex: 20 };
    return { x: '0%', rotateY: 0, scale: 0.7, opacity: 0, zIndex: 0 };
  };

  // Cycle forward/backward through the testimonials (wrapping at the ends).
  const prev = () => setActive((value) => (value - 1 + count) % count);
  const next = () => setActive((value) => (value + 1) % count);

  return (
    <section id="testimonials" className="bg-white py-20 sm:py-28 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* 3D Coverflow Stage */}
        <div
          className="relative h-[560px] sm:h-[520px] lg:h-[480px]"
          style={{ perspective: 1400, perspectiveOrigin: '50% 50%' }}
        >
          {TESTIMONIALS.map((_, index) => {
            const distance = positionOf(index);
            const transform = transformFor(distance);
            return (
              <motion.div
                key={index}
                // Spring-animate the coverflow placement whenever `active` changes.
                animate={{
                  x: transform.x,
                  rotateY: transform.rotateY,
                  scale: transform.scale,
                  opacity: transform.opacity,
                  zIndex: transform.zIndex,
                }}
                transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                // Clicking a neighbour pulls it to centre.
                onClick={() => {
                  if (distance === 1) next();
                  else if (distance === -1) prev();
                }}
                className="absolute inset-0 flex flex-col lg:flex-row bg-white border border-neutral-200 shadow-lg overflow-hidden cursor-pointer"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <TestimonialCard index={index} />
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