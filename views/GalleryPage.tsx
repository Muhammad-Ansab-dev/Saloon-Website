'use client';
import React, { useState } from 'react';
import { GalleryGrid } from '../components/GalleryGrid';
import { GALLERY_ITEMS, GALLERY_CATEGORIES } from '@/data/galleryData';
import { motion, AnimatePresence } from 'motion/react';

export const GalleryPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('ALL');

  const items =
    activeCategory === 'ALL'
      ? GALLERY_ITEMS
      : GALLERY_ITEMS.filter((item) => item.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#f7f5ee] pt-28 sm:pt-32 pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-10 sm:mb-12">
          <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-neutral-400 mb-4 block">
            Gallery
          </span>
          <h1 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-black uppercase text-black tracking-tight leading-[1.05]">
            OUR WORK
          </h1>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-12 sm:mb-14">
          {GALLERY_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors cursor-pointer ${
                activeCategory === cat
                  ? 'bg-black text-white border border-black'
                  : 'border border-neutral-300 text-neutral-600 hover:border-black hover:text-black'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Filtered Image Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <GalleryGrid items={items} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};