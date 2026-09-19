// ─────────────────────────────────────────────────────────────
// CONTACT ROUTE ("/contact") — a server component shell for the
// contact page.
// What it does: renders the ContactPage composition.
// What it connects to: <ContactPage> (src/sections/contact/ContactPage.tsx),
// which shows the studio contact info, a map, and an inline booking card —
// that booking card reuses the SAME shared BookingForm as the booking modal
// (they must stay one widget, never forked into two copies).
// Why it exists: a route entry so /contact maps to the contact view.
// ─────────────────────────────────────────────────────────────
import { ContactPage } from '@/sections/contact/ContactPage';

// Route entry for /contact. No params, no data fetching.
export default function Page() {
  return <ContactPage />;
}