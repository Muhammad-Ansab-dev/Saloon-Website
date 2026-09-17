// ─────────────────────────────────────────────────────────────
// galleryData.ts — static content for the /gallery page.
// GALLERY_CATEGORIES drives the filter pills
// (ALL + 4 disciplines); GALLERY_ITEMS is the image pool with a
// caption and a category tag used by GalleryGrid for filtering.
// GALLERY_VIDEO_IDS is the set of YouTube Shorts embedded on the
// gallery page (6 vertical films). Consumed by:
// views/GalleryPage.tsx.
// ─────────────────────────────────────────────────────────────
export interface GalleryItem {
  image: string;
  alt: string;
  caption: string;
  category: string;
}

export const GALLERY_CATEGORIES = ['ALL', 'CUTTING', 'COLOUR', 'STYLING', 'SALON'];

/** YouTube Shorts video IDs shown on the /gallery page. */
export const GALLERY_VIDEO_IDS = [
  'rr7ACX0M_0c',
  'IUC_K7ZT0I0',
  'RHr0md2bB74',
  'hSwbZapaYrg',
  'GID7VSX2ddk',
  'IUC_K7ZT0I0',
];

/** Cloudinary URLs for the short-film posters (uploaded via scripts/migrate-cloudinary.mjs). */
export const VIDEO_POSTERS: Record<string, string> = {
  'rr7ACX0M_0c': 'https://res.cloudinary.com/dittrfbja/image/upload/v1789651056/hair-salon/rr7ACX0M_0c.webp',
  'j3L5MsVY3oE': 'https://res.cloudinary.com/dittrfbja/image/upload/v1789651401/hair-salon/j3L5MsVY3oE.webp',
  'RHr0md2bB74': 'https://res.cloudinary.com/dittrfbja/image/upload/v1789651038/hair-salon/RHr0md2bB74.webp',
  'hSwbZapaYrg': 'https://res.cloudinary.com/dittrfbja/image/upload/v1789651042/hair-salon/hSwbZapaYrg.webp',
  'GID7VSX2ddk': 'https://res.cloudinary.com/dittrfbja/image/upload/v1789651029/hair-salon/GID7VSX2ddk.webp',
  'IUC_K7ZT0I0': 'https://res.cloudinary.com/dittrfbja/image/upload/v1789651034/hair-salon/IUC_K7ZT0I0.webp',
};

export interface GalleryVideo {
  id: string;
  title: string;
  style: string;
  category: string;
}

export const GALLERY_VIDEOS: GalleryVideo[] = [
  { id: 'rr7ACX0M_0c', title: 'EDITORIAL FILM 01', style: 'Precision cutting', category: 'CUTTING' },
  { id: 'IUC_K7ZT0I0', title: 'EDITORIAL FILM 06', style: 'Salon ritual', category: 'SALON' },
  { id: 'RHr0md2bB74', title: 'EDITORIAL FILM 03', style: 'Editorial styling', category: 'STYLING' },
  { id: 'hSwbZapaYrg', title: 'EDITORIAL FILM 04', style: 'Texture in motion', category: 'CUTTING' },
  { id: 'GID7VSX2ddk', title: 'EDITORIAL FILM 05', style: 'Honey gloss shine', category: 'COLOUR' },
  { id: 'IUC_K7ZT0I0', title: 'EDITORIAL FILM 06', style: 'Salon ritual', category: 'SALON' },
];

export const GALLERY_ITEMS: GalleryItem[] = [
  {
    image: 'https://res.cloudinary.com/dittrfbja/image/upload/v1789651071/hair-salon/hair-gallery1.webp',
    alt: 'Male model with tousled wavy haircut',
    caption: 'Textured swept crop',
    category: 'CUTTING',
  },
  {
    image: 'https://res.cloudinary.com/dittrfbja/image/upload/v1789650831/hair-salon/lookbook-2.webp',
    alt: 'Elegant blonde hair twist with gold leaf ornament',
    caption: 'The golden flora twist',
    category: 'STYLING',
  },
  {
    image: 'https://res.cloudinary.com/dittrfbja/image/upload/v1789650827/hair-salon/instagram-4.webp',
    alt: 'Brunette model with honey gloss highlights and beach waves',
    caption: 'Sun-drenched honey balayage',
    category: 'COLOUR',
  },
  {
    image: 'https://res.cloudinary.com/dittrfbja/image/upload/v1789650832/hair-salon/lookbook-3.webp',
    alt: 'Glossy editorial profile with sculpted strands',
    caption: 'Editorial wet strand',
    category: 'STYLING',
  },
  {
    image: 'https://res.cloudinary.com/dittrfbja/image/upload/v1789650823/hair-salon/instagram-1.webp',
    alt: 'Master stylist scissor work on a textured male crop',
    caption: 'Precision taper fade',
    category: 'CUTTING',
  },
  {
    image: 'https://res.cloudinary.com/dittrfbja/image/upload/v1789650820/hair-salon/hair-hero3.webp',
    alt: 'Salon interior with editorial color and finishing work in progress',
    caption: 'Inside Paul Hair Studio',
    category: 'SALON',
  },
];