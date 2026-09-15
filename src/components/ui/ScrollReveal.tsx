'use client';

// ─────────────────────────────────────────────────────────────
// ScrollReveal.tsx — shared animation primitives built on
// motion/react (framer-motion), used across nearly every section:
//
//   • ScrollReveal  — scrub-driven reveal tied to scroll progress
//     (opacity/x/y/scaleY/rotate travel as the element scrolls).
//   • SpringReveal  — one-shot `whileInView` bounce-in with a
//     spring curve, fired once per entry.
//   • Parallax      — scroll-speed depth: child drifts vertically
//     (and optionally horizontally) as it crosses the viewport.
//
// Directions map to transform origins so reveals feel directional.
// Rendered by: HomePage sections, AboutPage, ServicesCat, etc.
// ─────────────────────────────────────────────────────────────
import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';

/* ─── Direction presets ─── */
type Direction = 'up' | 'down' | 'left' | 'right';
type EasingPreset = 'spring' | 'smooth' | 'snappy';

function resolveXY(dir: Direction, dist: number): { x0: number; y0: number } {
  switch (dir) {
    case 'left':  return { x0: -dist, y0: 0 };
    case 'right': return { x0:  dist, y0: 0 };
    case 'down':  return { x0: 0, y0:  dist };
    case 'up':
    default:      return { x0: 0, y0: -dist };
  }
}

/* ─── Spring curve approximation (maps 0→1 via motion spring config) ─── */
const SPRING_CFG = { type: 'spring' as const, stiffness: 260, damping: 24, mass: 1 };
const SMOOTH_CFG = { type: 'spring' as const, stiffness: 180, damping: 22, mass: 1 };
const SNAPPY_CFG = { type: 'spring' as const, stiffness: 340, damping: 28, mass: 0.8 };

function springConfig(preset: EasingPreset) {
  switch (preset) {
    case 'spring': return SPRING_CFG;
    case 'smooth': return SMOOTH_CFG;
    case 'snappy': return SNAPPY_CFG;
  }
}

/* ═══════════════════════════════════════════
   ScrollReveal  —  scrub-driven directional
   ═══════════════════════════════════════════ */

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  /** Direction of travel. Default 'up'. */
  direction?: Direction;
  /** Travel distance in px. Default 50. */
  distance?: number;
  /** Starting opacity. Default 0. */
  fromOpacity?: number;
  /** Spring / easing preset. Default 'spring'. */
  easing?: EasingPreset;
  /** Optional scaleY reveal (e.g. text line wipe). Overrides direction for y. */
  scaleY?: number;
  /** Optional rotation start (deg). Combined with direction. */
  rotate?: number;
  /** Optional scale start. Combined with direction. */
  scale?: number;
  /** Transform-origin hint. Auto from direction unless overridden. */
  origin?: string;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  onMouseEnter?: React.MouseEventHandler<HTMLDivElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLDivElement>;
}

function originForDirection(dir: Direction): string {
  switch (dir) {
    case 'left':  return '0% 50%';
    case 'right': return '100% 50%';
    case 'down':  return '50% 0%';
    case 'up':
    default:      return '50% 100%';
  }
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className,
  direction = 'up',
  distance = 50,
  fromOpacity = 0,
  easing = 'spring',
  scaleY,
  rotate,
  scale,
  origin,
  style,
  onClick,
  onMouseEnter,
  onMouseLeave,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.88', 'start 0.2'],
  });

  const { x0, y0 } = resolveXY(direction, distance);

  const opacity = useTransform(scrollYProgress, [0, 1], [fromOpacity, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [y0, 0]);
  const x = useTransform(scrollYProgress, [0, 1], [x0, 0]);
  const scaleYv = useTransform(scrollYProgress, [0, 1], [scaleY ?? 1, 1]);
  const rotatev = useTransform(scrollYProgress, [0, 1], [rotate ?? 0, 0]);
  const scalev = useTransform(scrollYProgress, [0, 1], [scale ?? 1, 1]);

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{
        opacity,
        y,
        x,
        scaleY: scaleYv,
        rotate: rotatev,
        scale: scalev,
        transformOrigin: origin ?? originForDirection(direction),
        ...style,
      }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </motion.div>
  );
};

/* ═══════════════════════════════════════════
   SpringReveal  —  triggered once with spring
   (for elements that should bounce on enter)
   ═══════════════════════════════════════════ */

interface SpringRevealProps {
  children: React.ReactNode;
  className?: string;
  direction?: Direction;
  distance?: number;
  fromOpacity?: number;
  easing?: EasingPreset;
  rotate?: number;
  scale?: number;
  origin?: string;
  delay?: number;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

export const SpringReveal: React.FC<SpringRevealProps> = ({
  children,
  className,
  direction = 'up',
  distance = 60,
  fromOpacity = 0,
  easing = 'spring',
  rotate,
  scale,
  origin,
  delay = 0,
  style,
  onClick,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const { x0, y0 } = resolveXY(direction, distance);
  const cfg = springConfig(easing);

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: fromOpacity, y: y0, x: x0, rotate: rotate ?? 0, scale: scale ?? 1 }}
      whileInView={{ opacity: 1, y: 0, x: 0, rotate: 0, scale: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ ...cfg, delay }}
      style={{ transformOrigin: origin ?? originForDirection(direction), ...style }}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
};

/* ═══════════════════════════════════════════
   Parallax  —  scroll-speed depth
   ═══════════════════════════════════════════ */

interface ParallaxProps {
  children: React.ReactNode;
  className?: string;
  /** Vertical drift range in px. Default 60. */
  amount?: number;
  /** Horizontal drift (px). Default 0. */
  horizontal?: number;
  style?: React.CSSProperties;
}

export const Parallax: React.FC<ParallaxProps> = ({
  children,
  className,
  amount = 60,
  horizontal = 0,
  style,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [amount, -amount]);
  const x = horizontal !== 0
    ? useTransform(scrollYProgress, [0, 1], [horizontal, -horizontal])
    : undefined;

  return (
    <div ref={ref} className={className} style={style}>
      <motion.div style={{ y, ...(x ? { x } : {}) }}>{children}</motion.div>
    </div>
  );
};