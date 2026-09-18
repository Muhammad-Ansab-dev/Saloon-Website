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
import { SERVICES, STYLISTS, SITE_IMAGES_DEFAULTS, SITE_TEXT_DEFAULTS, LOCATIONS } from '@/data/salonData';
import { GALLERY_ITEMS } from '@/data/galleryData';

export interface SiteService extends ServiceItem {
  image?: string;
}
export interface SiteStylist {
  id: string;
  name: string;
  role: string;
  branch?: string;
  image?: string;
}

/** Public branch shape — the subset of a DB branch row that is safe to
 * show on the public site (no manager credentials). Matches `LocationBranch`
 * plus the `slug` the site needs for links / branch selection. */
export interface SiteBranch {
  slug: string;
  city: string;
  address: string;
  email: string;
  telephone: string;
  hours: string;
}

export interface SiteContent {
  services: SiteService[];
  stylists: SiteStylist[];
  gallery: typeof GALLERY_ITEMS;
  images: Record<string, string>;
  texts: Record<string, string>;
  branches: SiteBranch[];
}

/** Merge the DB site_texts rows over the static defaults so every text
 * slot always has a value (defaults win for anything not yet stored). */
function mergeTexts(rows: { key: string; value: string }[]): Record<string, string> {
  return { ...SITE_TEXT_DEFAULTS, ...Object.fromEntries(rows.map((r) => [r.key, r.value])) };
}

const STATIC: SiteContent = {
  services: SERVICES,
  stylists: STYLISTS,
  gallery: GALLERY_ITEMS,
  images: SITE_IMAGES_DEFAULTS,
  texts: SITE_TEXT_DEFAULTS,
  branches: staticBranches(),
};

/** Static branch list shaped like the live site branches — used as the
 * pre-fetch fallback in useSiteContent and by consumers that pair live
 * branches with the LOCATIONS fallback. */
export function staticBranches(): SiteBranch[] {
  return LOCATIONS.map((loc) => ({
    slug: loc.city.toLowerCase(),
    city: loc.city,
    address: loc.address,
    email: loc.email,
    telephone: loc.telephone,
    hours: loc.hours,
  }));
}

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
          texts: Array.isArray(data.siteTexts) ? mergeTexts(data.siteTexts) : SITE_TEXT_DEFAULTS,
          branches: Array.isArray(data.branches) ? data.branches : [],
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