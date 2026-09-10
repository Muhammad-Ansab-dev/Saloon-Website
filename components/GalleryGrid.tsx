'use client';
// GalleryGrid — Responsive 2/3-column image grid that displays gallery items
// with staggered scroll-reveal animations (motion/react). Each cell shows a
// lazy-loaded image with a gradient caption overlay on hover. Used exclusively
// inside GalleryPage to render the filtered salon portfolio.
import { motion } from 'motion/react';
import { GalleryItem } from '@/data/galleryData';

interface GalleryGridProps {
  items: GalleryItem[];
}

export const GalleryGrid: React.FC<GalleryGridProps> = ({ items }) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      {items.map((item, idx) => (
        <motion.figure
          key={item.image}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: '-40px' }}
          transition={{
            duration: 0.7,
            ease: 'easeOut',
            delay: idx * 0.06,
          }}
          className="relative group overflow-hidden bg-white aspect-square"
        >
          <img
            src={item.image}
            alt={item.alt}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
          />
          <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 bg-gradient-to-t from-black/60 via-black/20 to-transparent">
            <span className="block text-[10px] sm:text-[11px] leading-tight tracking-[0.18em] uppercase text-white font-semibold">
              {item.caption}
            </span>
          </div>
        </motion.figure>
      ))}
    </div>
  );
};