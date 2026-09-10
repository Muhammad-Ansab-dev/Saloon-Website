'use client';
// AboutPage — full "/about" route composition. Contains: parallax hero
// with scroll-tracked zoom, infinite stats marquee, brand story, founder
// profile, four core values grid, full team gallery, scroll-driven
// milestone timeline with progress line, and a CTA banner. Rendered by
// the About route layout — entirely separate from the homepage.
// Uses motion/react (useScroll, useTransform, useInView) for scroll-
// scrubbed parallax and timeline animations, plus custom ScrollReveal /
// SpringReveal / Parallax wrappers for section entrances.

import React, { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform, useInView } from 'motion/react';
import { STYLISTS, LOCATIONS } from '@/data/salonData';
import { ScrollReveal, SpringReveal, Parallax } from './ScrollReveal';
import { ArrowRight, Scissors, Flower2, Leaf, Gem } from 'lucide-react';

const TEAM_IMAGES = [
  '/images/hair-hero1.webp',
  '/images/hair-hero2.avif',
  '/images/hair-hero3.jpeg',
  '/images/lookbook-3.jpg',
  '/images/instagram-2.jpg',
  '/images/hair-service1.avif',
  '/images/press-1.jpg',
  '/images/lookbook-1.jpg',
];

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

const MILESTONES = [
  { year: '2013', title: 'THE FIRST CHAIR', text: 'Paul Delacroix opens a single-chair atelier in the historic Seefeld district of Zurich.' },
  { year: '2017', title: 'EDITORIAL RECOGNITION', text: 'Our sculpted wet-look profile lands on the cover of a European fashion quarterly.' },
  { year: '2020', title: 'PARIS ATELIER', text: 'A second studio opens in the Marais, born from demand from the Paris fashion houses.' },
  { year: '2024', title: 'A HOUSE OF CRAFT', text: 'Paul Hair Studio becomes a full atelier — salon, school, and botanical laboratory under one roof.' },
];

const STATS = [
  { value: '12+', label: 'YEARS OF CRAFT' },
  { value: '40K+', label: 'HAPPY CLIENTS' },
  { value: '2', label: 'ATELIERS' },
  { value: '4', label: 'MASTER ARTISANS' },
];

interface Milestone {
  year: string;
  title: string;
  text: string;
}

/* Timeline—scrubbed by scroll: opacity, x/y travel, and dot pop all track scroll position. */
const MilestoneItem: React.FC<{ milestone: Milestone; idx: number }> = ({ milestone, idx }) => {
  const itemRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: itemRef,
    offset: ['start 0.9', 'start 0.45'],
  });

  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [56, 0]);
  const x = useTransform(scrollYProgress, [0, 1], [idx % 2 === 0 ? -70 : 70, 0]);
  const dotScale = useTransform(scrollYProgress, [0, 1], [0.2, 1]);
  const dotGlow = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div
      ref={itemRef}
      className={`relative flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-10 mb-14 sm:mb-20 ${
        idx % 2 === 0 ? 'sm:flex-row' : 'sm:flex-row-reverse'
      }`}
    >
      {/* Dot — scrubbed pop + glow */}
      <motion.div
        style={{ scale: dotScale, opacity: dotGlow }}
        className="absolute left-[-5px] sm:left-1/2 sm:-translate-x-1/2 top-1 sm:top-1/2 sm:-translate-y-1/2 w-2.5 h-2.5 rounded-full"
      >
        <span className="block w-2.5 h-2.5 rounded-full bg-[#f3cbd7] shadow-[0_0_14px_rgba(243,203,215,0.9)]" />
      </motion.div>

      {/* Date + copy — scrubbed fade / travel */}
      <motion.div
        style={{ opacity, y, x }}
        className={`flex-1 ${
          idx % 2 === 0
            ? 'sm:pl-[52%] sm:pr-12 pl-8'
            : 'sm:pr-[52%] sm:pl-12 sm:text-right pl-8'
        }`}
      >
        <span className="font-editorial text-2xl sm:text-3xl font-black text-[#f3cbd7]">
          {milestone.year}
        </span>
        <h3 className="mt-2 font-editorial text-sm sm:text-base font-bold uppercase tracking-widest text-white">
          {milestone.title}
        </h3>
        <p className="mt-2 text-xs sm:text-sm text-white/60 leading-relaxed max-w-sm">
          {milestone.text}
        </p>
      </motion.div>
    </div>
  );
};

export const AboutPage: React.FC = () => {
  const router = useRouter();
  const heroRef = useRef<HTMLDivElement>(null);
  const milestonesRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const heroBgY = useTransform(scrollYProgress, [0, 1], ['0%', '35%']);
  const heroBgScale = useTransform(scrollYProgress, [0, 1], [1, 1.2]);
  const heroFade = useTransform(scrollYProgress, [0, 1], [1, 0.2]);

  const { scrollYProgress: milestoneProgress } = useScroll({
    target: milestonesRef,
    offset: ['start center', 'end center'],
  });
  const progressHeight = useTransform(milestoneProgress, [0, 1], ['0%', '100%']);

  return (
    <main>
      {/* ── HERO ── */}
      <div ref={heroRef} className="relative h-[70vh] sm:h-[80vh] min-h-[480px] bg-neutral-900 overflow-hidden">
        <motion.div style={{ y: heroBgY, scale: heroBgScale, opacity: heroFade }} className="absolute inset-0">
          <img
            src="/images/press-3.jpg"
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

      {/* ── STATS BAR ── */}
      <div className="bg-black py-10 sm:py-12 overflow-hidden">
        <motion.div
          className="flex whitespace-nowrap"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 24, ease: 'linear', repeat: Infinity }}
        >
          {[...STATS, ...STATS].map((stat, idx) => (
            <div key={idx} className="flex items-center gap-12 sm:gap-20 px-12 sm:px-20">
              <div className="text-center whitespace-nowrap">
                <p className="font-editorial text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {stat.value}
                </p>
                <p className="mt-1 text-[10px] font-bold tracking-[0.25em] text-white/50 uppercase">
                  {stat.label}
                </p>
              </div>
              <span className="text-white/15 text-3xl font-thin" aria-hidden="true">
                ·
              </span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ── STORY ── */}
      <section className="bg-white py-20 sm:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
            <div className="lg:col-span-5">
              <SpringReveal direction="left" distance={100} easing="spring" className="relative overflow-hidden shadow-2xl">
                <div className="relative h-[420px] sm:h-[520px]">
                  <Parallax amount={30}>
                    <img
                      src="/images/lookbook-2.jpg"
                      alt="Inside Paul Hair Studio"
                      className="w-full h-[520px] object-cover object-center"
                    />
                  </Parallax>
                </div>
                <div className="absolute inset-0 bg-black/10" />
              </SpringReveal>
            </div>

            <div className="lg:col-span-7">
              <ScrollReveal direction="down" distance={20}>
                <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-neutral-400 mb-4 block">
                  Our Story
                </span>
              </ScrollReveal>
              <ScrollReveal scaleY={0.08} distance={0} origin="50% 100%">
                <h2 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-black uppercase text-black tracking-tight leading-[1.05] mb-6 sm:mb-8">
                  CRAFT IS NOT A<br />SERVICE. IT IS A PACT.
                </h2>
              </ScrollReveal>

              <ScrollReveal direction="right" distance={40} className="space-y-4 max-w-xl">
                <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
                  Paul Hair Studio was born in 2013 from a single chair in Zurich's Seefeld district.
                  Founder Paul Delacroix believed that hair was not a commodity but a personal
                  architecture — one that deserved the same precision, patience, and artistry as
                  haute couture.
                </p>
                <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
                  Today the House spans two ateliers — Zurich and Paris — yet every session still
                  opens the same way: a private ritual of consultation, diagnosis, and intention.
                  We are a school, a salon, and a botanical laboratory. Our artisans train for years
                  before they ever touch a client.
                </p>
                <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
                  The result is hair that moves, shines, and lasts — sculpted for real life, not just
                  the runway. This is Swiss precision, French flair, and a quiet obsession with the
                  craft of making people feel unmistakably themselves.
                </p>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOUNDER ── */}
      <section className="bg-neutral-950 py-20 sm:py-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <div className="lg:col-span-5 lg:order-2">
              <SpringReveal direction="right" distance={80} easing="spring" className="relative overflow-hidden shadow-2xl">
                <div className="relative h-[400px] sm:h-[500px]">
                  <Parallax amount={24}>
                    <img
                      src="/images/press-3.jpg"
                      alt="Paul Delacroix, Founder & Creative Director"
                      className="w-full h-[500px] object-cover object-center filter contrast-110 brightness-90"
                    />
                  </Parallax>
                </div>
                <div className="absolute inset-0 bg-black/10" />
              </SpringReveal>
            </div>

            <div className="lg:col-span-7 lg:order-1">
              <ScrollReveal direction="down" distance={20}>
                <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/50 mb-4 block">
                  Founder & Creative Director
                </span>
              </ScrollReveal>
              <ScrollReveal scaleY={0.08} distance={0} origin="50% 100%">
                <h2 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-black uppercase text-white tracking-tight leading-[1.05] mb-6 sm:mb-8">
                  PAUL DELACROIX
                </h2>
              </ScrollReveal>

              <ScrollReveal direction="right" distance={40} className="space-y-4 max-w-xl">
                <p className="text-sm sm:text-base text-white/60 leading-relaxed italic font-serif-luxury">
                  &ldquo;I believe that every person carries an architecture within their hair — a structure waiting to be revealed. My role is simply to uncover it with patience, precision, and an unrelenting respect for the individual.&rdquo;
                </p>
                <p className="text-sm sm:text-base text-white/60 leading-relaxed">
                  Paul trained under master stylists in Paris and Milan before opening his first atelier in Zurich's Seefeld district in 2013. His approach — part sculptor, part botanist — has earned the studio recognition in Vogue, Elle, and Harper's Bazaar.
                </p>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ── VALUES ── */}
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

      {/* ── TEAM ── */}
      <section className="bg-white py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-14 sm:mb-20 gap-6">
            <div>
              <ScrollReveal direction="down" distance={20}>
                <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-neutral-400 mb-4 block">
                  The Artisans
                </span>
              </ScrollReveal>
              <ScrollReveal scaleY={0.1} distance={0} origin="50% 100%">
                <h2 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-black uppercase text-black tracking-tight leading-[1.05]">
                  THE MASTERS BEHIND<br />THE CHAIRS
                </h2>
              </ScrollReveal>
            </div>
            <ScrollReveal direction="up" distance={20} className="max-w-xs text-xs text-neutral-500 leading-relaxed">
              <p>
                Seven specialists. Decades of combined experience. Each chair is helmed by an artisan
                who owns their discipline completely.
              </p>
            </ScrollReveal>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
            {STYLISTS.map((stylist, idx) => (
              <SpringReveal
                key={stylist.id}
                direction={idx % 2 === 0 ? 'left' : 'right'}
                distance={40}
                delay={idx * 0.06}
                easing="spring"
                className="group"
              >
                <div className="relative h-[80vh] sm:h-[85vh] bg-neutral-200 overflow-hidden mb-4">
                  <Parallax amount={16}>
                    <img
                      src={TEAM_IMAGES[idx]}
                      alt={stylist.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    />
                  </Parallax>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                </div>
                <div className="flex items-end justify-between gap-4 border-b border-neutral-200 pb-3">
                  <h3 className="font-editorial text-base sm:text-xl font-bold uppercase tracking-wider text-black mb-0">
                    {stylist.name}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-neutral-500 text-right">{stylist.role}</p>
                </div>
              </SpringReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── MILESTONES / TIMELINE ── */}
      <section ref={milestonesRef} className="bg-neutral-950 py-20 sm:py-32 text-white overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 lg:px-12">
          <div className="text-center mb-16 sm:mb-24">
            <ScrollReveal direction="down" distance={20}>
              <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/50 mb-4 block">
                The Journey
              </span>
            </ScrollReveal>
            <ScrollReveal scaleY={0.1} distance={0} origin="50% 100%">
              <h2 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight leading-[1.05]">
                FROM ONE CHAIR TO A HOUSE
              </h2>
            </ScrollReveal>
          </div>

          <div className="relative">
            {/* Vertical line with progress fill */}
            <div className="absolute left-0 sm:left-1/2 top-0 bottom-0 w-px bg-white/15">
              <motion.div
                style={{ height: progressHeight }}
                className="w-full bg-gradient-to-b from-[#f3cbd7] to-white/40 origin-top"
              />
            </div>

            {MILESTONES.map((m, idx) => (
              <MilestoneItem key={m.year} milestone={m} idx={idx} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
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
    </main>
  );
};