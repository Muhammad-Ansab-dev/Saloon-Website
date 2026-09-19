'use client';
// ─────────────────────────────────────────────────────────────
// GALLERY ROUTE ("/gallery") — the portfolio / press image gallery.
// What it does: renders the filterable image grid view.
// What it connects to: <GalleryPage> (src/views/GalleryPage.tsx), which
// composes the heading, the category "pills", and the photo grid.
// Why a client component: the category filters switch which images show
// and need React state + animations in the browser.
// ─────────────────────────────────────────────────────────────
import { GalleryPage } from '@/views/GalleryPage';

// Gallery page entry. No params.
export default function Page() {
  return <GalleryPage />;
}