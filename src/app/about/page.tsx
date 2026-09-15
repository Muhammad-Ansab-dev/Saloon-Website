'use client';
// ─────────────────────────────────────────────────────────────
// Route entry for "/about" — wraps the AboutPage presentation
// (stats marquee, story, team grid, journey timeline, locations).
// ─────────────────────────────────────────────────────────────
import { AboutPage } from '@/sections/about/AboutPage';

export default function Page() {
  return <AboutPage />;
}