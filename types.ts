// ─────────────────────────────────────────────────────────────
// types.ts — shared TypeScript interfaces for the whole site.
// Mirrors the shapes of the static data in data/salonData.ts and
// data/galleryData.ts: products/cart, services, press, testimonials,
// lookbook, locations and the appointment-booking payload.
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

export interface PressArticle {
  id: string;
  dateBadge: {
    month: string;
    day: string;
  };
  author: string;
  category: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  readTime: string;
}

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
  location?: string;
}

export interface LookbookItem {
  id: string;
  title: string;
  model: string;
  style: string;
  image: string;
  alt: string;
}

export interface LocationBranch {
  city: string;
  address: string;
  email: string;
  telephone: string;
  coordinates?: string;
  hours: string;
}

export interface AppointmentBooking {
  serviceId: string;
  serviceName: string;
  date: string;
  timeSlot: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  stylistName: string;
  notes?: string;
}
