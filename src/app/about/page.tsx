// ─────────────────────────────────────────────────────────────
// ABOUT ROUTE ("/about") — the studio's story page (a "server
// component", i.e. it renders on the server before reaching the browser).
// What it does: renders the AboutPage composition.
// What it connects to: <AboutPage> (src/views/AboutPage.tsx), which stacks
// the about sections in order: AboutHero → AboutStats → AboutStory →
// AboutFounder → AboutValues → AboutTeam → AboutTimeline → AboutCta.
// Why it exists: a route entry so /about maps to the AboutPage view.
// ─────────────────────────────────────────────────────────────
import { AboutPage } from '@/views/AboutPage';

// Route entry for /about. No params, no data fetching.
export default function Page() {
  return <AboutPage />;
}
