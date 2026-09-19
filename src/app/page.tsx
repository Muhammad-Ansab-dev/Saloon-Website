'use client';
// ─────────────────────────────────────────────────────────────
// HOMEPAGE ROUTE ("/") — the landing page everyone sees first.
// What it does: pulls the booking handlers from the site context and
// hands them to the homepage composition.
// What it connects to: useSite() (the global Providers context) and
// <HomePage> (src/views/HomePage.tsx), which arranges all the sections
// in order (Hero → PartnerBar → About → ServiceMenu → LookbookTrio →
// TeamSection → TestimonialGrid → VisitUs → NewsletterSubscribe).
// Why it exists: the context lives in Providers, so this thin page just
// wires the "Book now" actions into the sections that need them.
// ─────────────────────────────────────────────────────────────
import { useSite } from '@/components/layout/Providers';
import { HomePage } from '@/views/HomePage';

// Homepage entry component. No params.
// Pulls the two booking callbacks from context and passes them down so
// any "Book now" button on the page opens the booking modal with a service pre-selected.
export default function Page() {
  const { onBookNow, onSelectServiceForBooking } = useSite();
  return <HomePage onBookNow={onBookNow} onSelectServiceForBooking={onSelectServiceForBooking} />;
}