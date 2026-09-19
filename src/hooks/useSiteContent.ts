'use client';
// ---------------------------------------------------------------------------
// useSiteContent — client hook that mirrors admin-managed collections into the
// public site. Fetches /api/content once on mount; while loading (and on any
// failure) it returns the static seed data so the site never blanks. Sections
// like ServiceMenu / TeamSection consume this instead of importing the static
// arrays directly, so admin edits appear live after a refresh. Accepts an
// optional `initial` override (server-rendered collections) to avoid a flash.
// In plain words: this hook loads the admin-saved content into the public
// pages. If it's still loading — or the fetch fails — the site politely shows
// its built-in starter content instead of going blank.
// ---------------------------------------------------------------------------
import { useEffect, useState } from 'react';
import type { ServiceItem } from '@/types';
import { SERVICES, STYLISTS, SITE_IMAGES_DEFAULTS, SITE_TEXT_DEFAULTS, LOCATIONS } from '@/data/salonData';
import { GALLERY_ITEMS } from '@/data/galleryData';

// A service as seen by the public site: the shared ServiceItem plus an
// optional image that admins may have set in the Media tab.
export interface SiteService extends ServiceItem {
  image?: string;
}
// A stylist (team member) as seen by the public site.
export interface SiteStylist {
  id: string;
  name: string;
  role: string;
  branch?: string;
  image?: string;
}

// The public branch shape — the subset of a DB branch row that is safe to
// show on the public site (no manager credentials). Matches `LocationBranch`
// plus the `slug` the site needs for links / branch selection.
export interface SiteBranch {
  slug: string;
  city: string;
  address: string;
  email: string;
  telephone: string;
  hours: string;
}

// The full bundle of site content every page can read after a load/refresh.
export interface SiteContent {
  services: SiteService[];
  stylists: SiteStylist[];
  gallery: typeof GALLERY_ITEMS;
  images: Record<string, string>;
  texts: Record<string, string>;
  branches: SiteBranch[];
}

// Merge the DB site_texts rows over the static defaults so every text slot
// always has a value (the defaults win for any slot not yet stored).
function mergeTexts(rows: { key: string; value: string }[]): Record<string, string> {
  return { ...SITE_TEXT_DEFAULTS, ...Object.fromEntries(rows.map((r) => [r.key, r.value])) };
}

// The fallback content the hook starts with before the fetch completes: the
// static defaults, so the very first render (and any offline render) is never
// empty.
const STATIC: SiteContent = {
  services: SERVICES,
  stylists: STYLISTS,
  gallery: GALLERY_ITEMS,
  images: SITE_IMAGES_DEFAULTS,
  texts: SITE_TEXT_DEFAULTS,
  branches: staticBranches(),
};

// Static branch list shaped exactly like the live site branches — used as the
// pre-fetch fallback in useSiteContent and by consumers that pair live
// branches with the LOCATIONS fallback.
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

// React hook returning the latest site content. Params: initial — optional
// server-rendered collections, merged over the static defaults to avoid a
// loading flash. Returns the current SiteContent (static by default, live
// once the fetch resolves).
export function useSiteContent(initial?: Partial<SiteContent>): SiteContent {
  // The content shown to visitors: starts as static defaults (+ any
  // server-rendered `initial`) and is swapped for the live admin data below.
  const [content, setContent] = useState<SiteContent>({ ...STATIC, ...initial });

  // On mount, fetch /api/content exactly once. `cancelled` guards against
  // setting state after the component has unmounted.
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
    // Cleanup: mark `cancelled` so a fetch that finishes after unmount can't
    // try to set state on a component that no longer exists.
    return () => {
      cancelled = true;
    };
  }, []);

  return content;
}