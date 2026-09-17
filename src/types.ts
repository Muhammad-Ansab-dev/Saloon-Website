// ─────────────────────────────────────────────────────────────
// types.ts — shared TypeScript interfaces for the whole site.
// Mirrors the shapes of the static data in data/salonData.ts:
// products + cart items, services, testimonials and studio
// locations. (Gallery types live alongside their data in
// data/galleryData.ts.)
// ─────────────────────────────────────────────────────────────
export interface Product {
  id: string;
  name: string;
  category: string;
  subtitle: string;
  description: string;
  price: number;
  rating: number;
  reviewsCount: number;
  size: string;
  image: string;
  isBestSeller?: boolean;
  ingredients?: string[];
  howToUse?: string;
  benefits?: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  category: string;
}

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
  location?: string;
}

export interface LocationBranch {
  city: string;
  address: string;
  email: string;
  telephone: string;
  coordinates?: string;
  hours: string;
}
