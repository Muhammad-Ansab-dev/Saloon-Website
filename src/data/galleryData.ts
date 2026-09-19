// ─────────────────────────────────────────────────────────────
// galleryData.ts — static content for the /gallery route.
// GALLERY_CATEGORIES drives the filter pills (ALL + 4
// disciplines); GALLERY_ITEMS is the image pool with a caption
// and a category tag; GALLERY_VIDEOS is the set of six vertical
// editorial films (ordered 01–06); VIDEO_POSTERS maps each film
// id to its Cloudinary poster. Consumed by views/GalleryPage.tsx
// and sections/home/LookbookTrio.tsx.
// In plain words: the gallery page's photos, the filter button labels
// ("Cutting / Colour / …"), and the six short editorial films — all static
// starter content (admins can swap the photos from the dashboard).
// ─────────────────────────────────────────────────────────────

// One gallery photo: the image URL, an accessibility description (`alt`), a
// short caption, and the filter category the photo belongs to.
export interface GalleryItem {
  image: string;
  alt: string;
  caption: string;
  category: string;
}

// The filter pills on the gallery page: 'ALL' shows everything, the rest
// match each photo's `category` tag.
export const GALLERY_CATEGORIES = ['ALL', 'CUTTING', 'COLOUR', 'STYLING', 'SALON'];

// Cloudinary URLs for each film's cover poster, keyed by the film's YouTube
// id (uploaded via scripts/migrate-cloudinary.mjs).
export const VIDEO_POSTERS: Record<string, string> = {
  'rr7ACX0M_0c': 'https://res.cloudinary.com/dittrfbja/image/upload/v1789651056/hair-salon/rr7ACX0M_0c.webp',
  'j3L5MsVY3oE': 'https://res.cloudinary.com/dittrfbja/image/upload/v1789651401/hair-salon/j3L5MsVY3oE.webp',
  'RHr0md2bB74': 'https://res.cloudinary.com/dittrfbja/image/upload/v1789651038/hair-salon/RHr0md2bB74.webp',
  'hSwbZapaYrg': 'https://res.cloudinary.com/dittrfbja/image/upload/v1789651042/hair-salon/hSwbZapaYrg.webp',
  'GID7VSX2ddk': 'https://res.cloudinary.com/dittrfbja/image/upload/v1789651029/hair-salon/GID7VSX2ddk.webp',
  'IUC_K7ZT0I0': 'https://res.cloudinary.com/dittrfbja/image/upload/v1789651034/hair-salon/IUC_K7ZT0I0.webp',
};

// One of the six short films: its YouTube id, display title, style tag, and
// filter category (used to decide which film shows under which filter).
export interface GalleryVideo {
  id: string;
  title: string;
  style: string;
  category: string;
}

// The six editorial films shown on the gallery page's video strip, ordered
// 01–06.
export const GALLERY_VIDEOS: GalleryVideo[] = [
  { id: 'rr7ACX0M_0c', title: 'EDITORIAL FILM 01', style: 'Precision cutting', category: 'CUTTING' },
  { id: 'j3L5MsVY3oE', title: 'EDITORIAL FILM 02', style: 'Salon ritual', category: 'SALON' },
  { id: 'RHr0md2bB74', title: 'EDITORIAL FILM 03', style: 'Editorial styling', category: 'STYLING' },
  { id: 'hSwbZapaYrg', title: 'EDITORIAL FILM 04', style: 'Texture in motion', category: 'CUTTING' },
  { id: 'GID7VSX2ddk', title: 'EDITORIAL FILM 05', style: 'Honey gloss shine', category: 'COLOUR' },
  { id: 'IUC_K7ZT0I0', title: 'EDITORIAL FILM 06', style: 'Salon ritual', category: 'SALON' },
];

// The gallery photo pool — each item feeds a card on /gallery and the
// homepage lookbook trio.
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