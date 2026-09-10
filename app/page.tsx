'use client';
// ─────────────────────────────────────────────────────────────
// Route entry for "/" — pulls booking/cart handlers from the site
// context and renders the homepage section composition in
// views/HomePage.tsx.
// ─────────────────────────────────────────────────────────────
import { useSite } from '@/components/Providers';
import { HomePage } from '@/views/HomePage';

export default function Page() {
  const { onBookNow, onSelectServiceForBooking } = useSite();
  return <HomePage onBookNow={onBookNow} onSelectServiceForBooking={onSelectServiceForBooking} />;
}