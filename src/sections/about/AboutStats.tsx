'use client';
// ─────────────────────────────────────────────────────────────
// AboutStats — black stats bar beneath the about hero. Each figure
// animates from 0 to its target once it scrolls into view (see the
// local Counter component).
// ─────────────────────────────────────────────────────────────
import React, { useRef } from 'react';
import { useInView } from 'motion/react';

const STATS = [
  { value: 12, suffix: '+', label: 'YEARS OF CRAFT' },
  { value: 40, suffix: 'K+', label: 'HAPPY CLIENTS' },
  { value: 2, suffix: '', label: 'ATELIERS' },
  { value: 4, suffix: '', label: 'MASTER ARTISANS' },
];

/* Animated counter: counts 0 → value when scrolled into view. */
const Counter: React.FC<{ value: number }> = ({ value }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const start = performance.now();
    const duration = 1800;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(value * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return <span ref={ref}>{count}</span>;
};

export const AboutStats: React.FC = () => {
  return (
    <div className="bg-black py-10 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 lg:grid-cols-4 gap-8 h-full">
        {STATS.map((stat) => (
          <div key={stat.label} className="text-center">
            <p className="font-editorial text-3xl sm:text-4xl font-black text-white tracking-tight">
              <Counter value={stat.value} />
              {stat.suffix}
            </p>
            <p className="mt-1 text-[10px] font-bold tracking-[0.25em] text-white/50 uppercase">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
