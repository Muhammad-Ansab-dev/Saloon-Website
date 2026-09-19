'use client';
// ─────────────────────────────────────────────────────────────
// HomePage — top-level composition for the "/" route (homepage).
// Renders all hero-to-footer sections in order: Hero, PartnerBar,
// About, ServiceMenu, LookbookTrio, TeamSection, TestimonialGrid,
// VisitUs, and NewsletterSubscribe. Passes booking callbacks from
// the parent layout down to ServiceMenu. No animation libraries —
// orchestration only.
// ─────────────────────────────────────────────────────────────

import React from 'react';
import { Hero } from '../sections/home/Hero';
import { PartnerBar } from '../sections/home/PartnerBar';
import { About } from '../sections/home/About';
import { ServiceMenu } from '../sections/home/ServiceMenu';
import { LookbookTrio } from '../sections/home/LookbookTrio';
import { TeamSection } from '../sections/home/TeamSection';
import { TestimonialGrid } from '../sections/home/TestimonialGrid';
import { VisitUs } from '../sections/home/VisitUs';
import { NewsletterSubscribe } from '../sections/home/NewsletterSubscribe';
import { ServiceItem } from '../types';

// Props come from the route's parent (Providers): quickly opens the bare booking
// modal, or opens it with a specific service pre-selected.
interface HomePageProps {
  onBookNow: () => void;
  onSelectServiceForBooking: (service: ServiceItem) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onBookNow,
  onSelectServiceForBooking,
}) => {
  return (
    <>
      <Hero />
      <PartnerBar />
      <About />
      <ServiceMenu onSelectService={onSelectServiceForBooking} />
      <LookbookTrio />
      <TeamSection />
      <TestimonialGrid />
      <VisitUs />
      <NewsletterSubscribe />
    </>
  );
};
