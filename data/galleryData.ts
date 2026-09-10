export interface GalleryItem {
  image: string;
  alt: string;
  caption: string;
  category: string;
}

export const GALLERY_CATEGORIES = ['ALL', 'CUTTING', 'COLOUR', 'STYLING', 'SALON'];

export const GALLERY_ITEMS: GalleryItem[] = [
  {
    image: '/images/hair-gallery1.jpeg',
    alt: 'Male model with tousled wavy haircut',
    caption: 'Textured swept crop',
    category: 'CUTTING',
  },
  {
    image: '/images/lookbook-2.jpg',
    alt: 'Elegant blonde hair twist with gold leaf ornament',
    caption: 'The golden flora twist',
    category: 'STYLING',
  },
  {
    image: '/images/instagram-4.jpg',
    alt: 'Brunette model with honey gloss highlights and beach waves',
    caption: 'Sun-drenched honey balayage',
    category: 'COLOUR',
  },
  {
    image: '/images/lookbook-3.jpg',
    alt: 'Glossy editorial profile with sculpted strands',
    caption: 'Editorial wet strand',
    category: 'STYLING',
  },
  {
    image: '/images/instagram-1.jpg',
    alt: 'Master stylist scissor work on a textured male crop',
    caption: 'Precision taper fade',
    category: 'CUTTING',
  },
  {
    image: '/images/hair-hero3.jpeg',
    alt: 'Salon interior with editorial color and finishing work in progress',
    caption: 'Inside Paul Hair Studio',
    category: 'SALON',
  },
];