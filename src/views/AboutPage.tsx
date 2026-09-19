'use client';
// ─────────────────────────────────────────────────────────────
// AboutPage — top-level composition for the "/about" route. Gathers
// every about section in order: hero → stats → story → founder →
// values → team → journey timeline → CTA. Each section is a
// self-contained component under sections/about/.
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { AboutHero } from '@/sections/about/AboutHero';
import { AboutStats } from '@/sections/about/AboutStats';
import { AboutStory } from '@/sections/about/AboutStory';
import { AboutFounder } from '@/sections/about/AboutFounder';
import { AboutValues } from '@/sections/about/AboutValues';
import { AboutTeam } from '@/sections/about/AboutTeam';
import { AboutTimeline } from '@/sections/about/AboutTimeline';
import { AboutCta } from '@/sections/about/AboutCta';

export const AboutPage: React.FC = () => {
  // Pure composition view: renders the eight about sections in fixed order.
  return (
    <main>
      <AboutHero />
      <AboutStats />
      <AboutStory />
      <AboutFounder />
      <AboutValues />
      <AboutTeam />
      <AboutTimeline />
      <AboutCta />
    </main>
  );
};
