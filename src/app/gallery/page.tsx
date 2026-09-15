'use client';
// ─────────────────────────────────────────────────────────────
// Route entry for "/gallery" — renders the filterable image grid
// (heading → pills → grid) via components/pages/GalleryPage.tsx.
// ─────────────────────────────────────────────────────────────
import { GalleryPage } from '@/views/GalleryPage';

export default function Page() {
  return <GalleryPage />;
}