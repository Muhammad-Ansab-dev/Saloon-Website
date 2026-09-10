'use client';
import React from 'react';
import { VfxHero } from '../components/VfxHero';
import { PartnerBar } from '../components/PartnerBar';
import { About } from '../components/About';
import { ServiceMenu } from '../components/ServiceMenu';
import { LookbookTrio } from '../components/LookbookTrio';
import { TeamSection } from '../components/TeamSection';
import { TestimonialGrid } from '../components/TestimonialGrid';
import { VisitUs } from '../components/VisitUs';
import { NewsletterSubscribe } from '../components/NewsletterSubscribe';
import { ServiceItem } from '../types';

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
      <VfxHero />
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
