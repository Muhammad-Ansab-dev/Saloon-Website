'use client';
// ─────────────────────────────────────────────────────────────
// HeroStudio — full-height editorial hero with auto-rotating
// background slides (7s), prev/next arrows, bottom-left tag
// badge, indicator dots, and scroll-linked parallax zoom/fade.
// Legacy component: NOT currently rendered (superseded by
// VfxHero on the homepage). Keep for reference only.
// ─────────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { ScrollReveal, Parallax } from './ScrollReveal';

interface HeroStudioProps {
  onBookNow: () => void;
}

interface Slide {
  id: number;
  tagTitle: string;
  tagSubtitle: string;
  image: string;
  alt: string;
}

const SLIDES: Slide[] = [
  {
    id: 1,
    tagTitle: 'CUTTING MASTER',
    tagSubtitle: '2023',
    image: '/images/hero-1.jpg',
    alt: 'Master cut model with dynamic flying windswept hair',
  },
  {
    id: 2,
    tagTitle: 'EDITORIAL VOLUME',
    tagSubtitle: 'HAUTE COUTURE',
    image: '/images/press-3.jpg',
    alt: 'High fashion editorial hairstyle with dramatic motion',
  },
  {
    id: 3,
    tagTitle: 'SCULPTED SHINE',
    tagSubtitle: 'AUTUMN LOOKBOOK',
    image: '/images/lookbook-3.jpg',
    alt: 'Sculpted wet hair look on editorial fashion model',
  },
];

export const HeroStudio: React.FC<HeroStudioProps> = ({ onBookNow }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const fade = useTransform(scrollYProgress, [0, 1], [1, 0.35]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);

  return (
    <section id="hero" className="relative pt-0 bg-white overflow-hidden">
      <div
        ref={heroRef}
        className="relative w-full h-[80vh] sm:h-[85vh] lg:h-[90vh] max-h-[1100px] bg-neutral-900 overflow-hidden group"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.9, ease: [0.25, 1, 0.5, 1] }}
            className="absolute inset-0 w-full h-full"
          >
            <motion.div style={{ y: bgY, scale: bgScale, opacity: fade }} className="absolute inset-0 w-full h-full">
              <img
                src={SLIDES[currentSlide].image}
                alt={SLIDES[currentSlide].alt}
                className="w-full h-full object-cover object-center filter contrast-110 brightness-95"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Carousel Arrows */}
        <button
          id="hero-prev-slide-btn"
          onClick={prevSlide}
          className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center text-white/90 hover:text-white transition-all transform hover:-translate-x-1 cursor-pointer focus:outline-none"
          aria-label="Previous editorial slide"
        >
          <ChevronLeft className="w-8 h-8 sm:w-12 sm:h-12 stroke-[1.2]" />
        </button>
        <button
          id="hero-next-slide-btn"
          onClick={nextSlide}
          className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center text-white/90 hover:text-white transition-all transform hover:translate-x-1 cursor-pointer focus:outline-none"
          aria-label="Next editorial slide"
        >
          <ChevronRight className="w-8 h-8 sm:w-12 sm:h-12 stroke-[1.2]" />
        </button>

        {/* Bottom Left Badge — spring bounce on slide change */}
        <div className="absolute bottom-6 sm:bottom-10 left-6 sm:left-12 z-20">
          <motion.div
            key={`badge-${currentSlide}`}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, mass: 0.8 }}
            className="flex flex-col"
          >
            <span className="text-white text-xs sm:text-sm font-bold tracking-[0.2em] uppercase">
              {SLIDES[currentSlide].tagTitle}
            </span>
            <span className="text-white/80 text-xs sm:text-sm font-light tracking-[0.2em]">
              {SLIDES[currentSlide].tagSubtitle}
            </span>
          </motion.div>
        </div>

        {/* Slide Indicator Dots */}
        <div className="absolute bottom-6 sm:bottom-10 right-6 sm:right-12 z-20 flex items-center space-x-2.5">
          {SLIDES.map((slide, idx) => (
            <button
              key={slide.id}
              onClick={() => setCurrentSlide(idx)}
              className={`transition-all duration-300 cursor-pointer ${
                currentSlide === idx
                  ? 'w-7 h-[2px] bg-white'
                  : 'w-2 h-[2px] bg-white/40 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};