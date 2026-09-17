'use client';
// ---------------------------------------------------------------------------
// useSiteContent — client hook that mirrors admin-managed collections into the
// public site. Fetches /api/content once on mount; while loading (and on any
// failure) it returns the static seed data so the site never blanks. Sections
// like ServiceMenu / TeamSection consume this instead of importing the static
// arrays directly, so admin edits appear live after a refresh. Accepts an
// optional `initial` override (server-rendered collections) to avoid a flash.
// ---------------------------------------------------------------------------
import { useEffect, useState } from 'react';
import type { ServiceItem } from '@/types';
import { SERVICES, STYLISTS, SITE_IMAGES_DEFAULTS } from '@/data/salonData';
import { GALLERY_ITEMS } from '@/data/galleryData';

export interface SiteService extends ServiceItem {
  image?: string;
}
export interface SiteStylist {
  id: string;
  name: string;
  role: string;
  image?: string;
}

export interface SiteContent {
  services: SiteService[];
  stylists: SiteStylist[];
  gallery: typeof GALLERY_ITEMS;
  images: Record<string, string>;
}

const STATIC: SiteContent = {
  services: SERVICES,
  stylists: STYLISTS,
  gallery: GALLERY_ITEMS,
  images: SITE_IMAGES_DEFAULTS,
};

export function useSiteContent(initial?: Partial<SiteContent>): SiteContent {
  const [content, setContent] = useState<SiteContent>({ ...STATIC, ...initial });

  useEffect(() => {
    let cancelled = false;
    fetch('/api/content')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('bad response'))))
      .then((data) => {
        if (cancelled) return;
        setContent({
          services: Array.isArray(data.services) ? data.services : SERVICES,
          stylists: Array.isArray(data.stylists) ? data.stylists : STYLISTS,
          gallery: Array.isArray(data.gallery) ? data.gallery : GALLERY_ITEMS,
          images: data.images && typeof data.images === 'object' ? data.images : SITE_IMAGES_DEFAULTS,
        });
      })
      .catch(() => {
        // keep static defaults
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return content;
}