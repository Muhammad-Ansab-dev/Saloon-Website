'use client';
// ─────────────────────────────────────────────────────────────
// AboutTimeline — "From One Chair to a House" journey timeline.
// A vertical line fills as the section scrolls (progressHeight),
// and each milestone fades/travels in from alternating sides with
// a scrubbed dot pop + glow.
// ─────────────────────────────────────────────────────────────
import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

const MILESTONES = [
  { year: '2013', title: 'THE FIRST CHAIR', text: 'Paul Delacroix opens a single-chair atelier in the historic Seefeld district of Zurich.' },
  { year: '2017', title: 'EDITORIAL RECOGNITION', text: 'Our sculpted wet-look profile lands on the cover of a European fashion quarterly.' },
  { year: '2020', title: 'PARIS ATELIER', text: 'A second studio opens in the Marais, born from demand from the Paris fashion houses.' },
  { year: '2024', title: 'A HOUSE OF CRAFT', text: 'Paul Hair Studio becomes a full atelier — salon, school, and botanical laboratory under one roof.' },
];

interface Milestone {
  year: string;
  title: string;
  text: string;
}

/* Timeline item — scrubbed by scroll: opacity, x/y travel, and dot pop all track scroll position. */
const MilestoneItem: React.FC<{ milestone: Milestone; index: number }> = ({ milestone, index }) => {
  const itemRef = useRef<HTMLDivElement>(null);
  // 0→1 as the milestone travels up through the lower third of the viewport.
  const { scrollYProgress } = useScroll({
    target: itemRef,
    offset: ['start 0.9', 'start 0.45'],
  });

  // Fade in, rise up, and slide in from the side opposite the current column.
  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [56, 0]);
  const x = useTransform(scrollYProgress, [0, 1], [index % 2 === 0 ? -70 : 70, 0]);
  // The dot grows from a point and glows as it becomes "current".
  const dotScale = useTransform(scrollYProgress, [0, 1], [0.2, 1]);
  const dotGlow = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div
      ref={itemRef}
      className={`relative flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-10 mb-14 sm:mb-20 ${
        index % 2 === 0 ? 'sm:flex-row' : 'sm:flex-row-reverse'
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
          index % 2 === 0
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

export const AboutTimeline: React.FC = () => {
  const milestonesRef = useRef<HTMLDivElement>(null);

  // Whole-section scroll progress drives how much of the vertical line is filled.
  const { scrollYProgress: milestoneProgress } = useScroll({
    target: milestonesRef,
    offset: ['start center', 'end center'],
  });
  const progressHeight = useTransform(milestoneProgress, [0, 1], ['0%', '100%']);

  return (
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

          {MILESTONES.map((milestone, index) => (
            <MilestoneItem key={milestone.year} milestone={milestone} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};
