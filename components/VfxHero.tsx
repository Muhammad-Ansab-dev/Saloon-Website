'use client';
// VfxHero — full-viewport image slider shown at the very top of the homepage.
// Auto-advances through 6 editorial slides with a progress bar, keyboard
// navigation (arrows/space), and a directional arrow cursor that follows
// the pointer. Click left/right halves to navigate. Rendered by HomePage.
// Uses motion/react (AnimatePresence) for the cursor arrow transition.

import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import '../experience/heroSlider.css';

const SLIDES = [
  { title: 'Ethereal Glow', media: '/images/lookbook-1.jpg' },
  { title: 'Rose Mirage', media: '/images/instagram-1.jpg' },
  { title: 'Velvet Mystique', media: '/images/instagram-4.jpg' },
  { title: 'Golden Hour', media: '/images/hero-1.jpg' },
  { title: 'Midnight Dreams', media: '/images/hair-hero1.webp' },
  { title: 'Silver Light', media: '/images/instagram-3.jpg' },
];

const AUTO_MS = 5000;
const TICK_MS = 50;

export const VfxHero: React.FC = () => {
  const rootRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isNavHovered, setIsNavHovered] = useState(false);
  const [pointer, setPointer] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false,
  });

  /* Load fade-in + keyboard navigation */
  useEffect(() => {
    rootRef.current?.classList.add('loaded');

    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('input, textarea, select, [contenteditable]')) return;
      if (e.code === 'Space' || e.code === 'ArrowRight') {
        e.preventDefault();
        setProgress(0);
        setActiveIndex((a) => (a + 1) % SLIDES.length);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        setProgress(0);
        setActiveIndex((a) => (a - 1 + SLIDES.length) % SLIDES.length);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  /* Autoplay with progress bar — paused while hovering the nav */
  useEffect(() => {
    if (isNavHovered) return;
    let current = 0;
    const increment = (100 / AUTO_MS) * TICK_MS;
    const id = window.setInterval(() => {
      current += increment;
      if (current >= 100) {
        window.clearInterval(id);
        setProgress(0);
        setActiveIndex((a) => (a + 1) % SLIDES.length);
        return;
      }
      setProgress(current);
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [activeIndex, isNavHovered]);

  const navigateTo = (index: number) => {
    setProgress(0);
    setActiveIndex((index + SLIDES.length) % SLIDES.length);
  };

  const handlePointerMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPointer({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      visible: true,
    });
  };

  const handlePointerLeave = () => {
    setPointer((p) => ({ ...p, visible: false }));
  };

  const handleClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickedHalf = e.clientX - rect.left < rect.width / 2 ? 'left' : 'right';
    if (clickedHalf === 'right') navigateTo(activeIndex + 1);
    else navigateTo(activeIndex - 1);
  };

  const isRightHalf = pointer.x >= (rootRef.current?.getBoundingClientRect().width ?? 0) / 2;

  return (
    <section
      ref={rootRef}
      className="vfx-hero"
      onMouseMove={handlePointerMove}
      onMouseLeave={handlePointerLeave}
      onClick={handleClick}
    >
      <div className="vfx-images">
        {SLIDES.map((slide, index) => (
          <div
            key={slide.title}
            className={`vfx-slide${index === activeIndex ? ' active' : ''}`}
            style={{ backgroundImage: `url(${slide.media})` }}
          />
        ))}
      </div>

      <span className="vfx-number" id="vfxSlideNumber">
        {String(activeIndex + 1).padStart(2, '0')}
      </span>
      <span className="vfx-total" id="vfxSlideTotal">
        {String(SLIDES.length).padStart(2, '0')}
      </span>

      {/* Directional arrow cursor — follows pointer, flips by screen half */}
      <AnimatePresence>
        {pointer.visible && (
          <motion.div
            key="dir-arrow"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="vfx-arrow z-10 pointer-events-none"
            style={{ left: pointer.x, top: pointer.y }}
          >
            {isRightHalf ? (
              <ChevronRight className="w-6 h-6" />
            ) : (
              <ChevronLeft className="w-6 h-6" />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <nav
        className="vfx-nav"
        id="vfxSlidesNav"
        onMouseEnter={() => setIsNavHovered(true)}
        onMouseLeave={() => setIsNavHovered(false)}
        onClick={(e) => e.stopPropagation()}
      >
        {SLIDES.map((slide, index) => (
          <button
            key={slide.title}
            type="button"
            className={`vfx-nav-item${index === activeIndex ? ' active' : ''}`}
            onMouseEnter={() => {
              setIsNavHovered(true);
              navigateTo(index);
            }}
            onFocus={() => {
              setIsNavHovered(true);
              navigateTo(index);
            }}
            onClick={() => navigateTo(index)}
          >
            <div className="vfx-progress-line">
              <div
                className="vfx-progress-fill"
                style={{ width: index === activeIndex ? `${progress}%` : '0%' }}
              />
            </div>
            <div className="vfx-nav-title">{slide.title}</div>
          </button>
        ))}
      </nav>
    </section>
  );
};