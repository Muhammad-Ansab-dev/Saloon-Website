'use client';
// ─────────────────────────────────────────────────────────────
// AboutHero — "/about" opening banner. Parallax background image
// with scroll-tracked zoom + fade, animated eyebrow/headline/subcopy,
// and an animated scroll indicator. Self-contained: owns the ref
// that drives its own useScroll parallax.
// ─────────────────────────────────────────────────────────────
import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';

export const AboutHero: React.FC = () => {
  // Ref to this hero so the parallax scroll math can measure it.
  const heroRef = useRef<HTMLDivElement>(null);

  // 0→1 scroll progress as the hero leaves the viewport.
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  // Map that progress to bg drift downward, slight zoom, and a fade-out.
  const heroBgY = useTransform(scrollYProgress, [0, 1], ['0%', '35%']);
  const heroBgScale = useTransform(scrollYProgress, [0, 1], [1, 1.2]);
  const heroFade = useTransform(scrollYProgress, [0, 1], [1, 0.2]);

  return (
    <div ref={heroRef} className="relative h-[70vh] sm:h-[80vh] min-h-[480px] bg-neutral-900 overflow-hidden">
      <motion.div style={{ y: heroBgY, scale: heroBgScale, opacity: heroFade }} className="absolute inset-0">
        <img
          src="https://res.cloudinary.com/dittrfbja/image/upload/v1789650836/hair-salon/press-3.webp"
          alt="Paul Hair Studio editorial craft"
          className="w-full h-full object-cover object-center filter contrast-110 brightness-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />
      </motion.div>

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-4">
        <motion.span
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.1 }}
          className="text-white/70 text-[11px] font-bold tracking-[0.35em] uppercase mb-5"
        >
          Paul Hair Studio · Est. 2013
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 180, damping: 20, delay: 0.2 }}
          className="font-editorial text-3xl sm:text-5xl md:text-6xl font-black uppercase text-white tracking-tight leading-[1.02]"
        >
          THE HOUSE OF<br />HAIR EDUCATION
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 180, damping: 20, delay: 0.4 }}
          className="mt-5 text-white/70 text-sm sm:text-base font-normal max-w-md mx-auto"
        >
          Two ateliers. One obsession — the architecture of hair.
        </motion.p>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
      >
        <span className="text-white/60 text-[10px] font-bold tracking-[0.3em] uppercase">Scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
          className="w-[1px] h-8 bg-white/60"
        />
      </motion.div>
    </div>
  );
};
