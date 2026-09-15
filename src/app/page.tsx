'use client';
// ─────────────────────────────────────────────────────────────
// Route entry for "/" — pulls booking/cart handlers from the site
// context and renders the homepage section composition in
// components/pages/HomePage.tsx.
// ─────────────────────────────────────────────────────────────
import { useSite } from '@/components/layout/Providers';
import { HomePage } from '@/views/HomePage';

export default function Page() {
  const { onBookNow, onSelectServiceForBooking } = useSite();
  return <HomePage onBookNow={onBookNow} onSelectServiceForBooking={onSelectServiceForBooking} />;
}