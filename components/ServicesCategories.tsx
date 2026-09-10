'use client';
import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SERVICES } from '@/data/salonData';
import { motion } from 'motion/react';

const CATEGORY_MEDIA: Record<string, string> = {
  'Cut & Style': '/images/hair-gallery1.jpeg',
  'Style & Finish': '/images/lookbook-2.jpg',
  'Wash & Refresh': '/images/press-1.jpg',
  'Color & Cut': '/images/instagram-4.jpg',
  'Cut & Texture': '/images/lookbook-3.jpg',
  'Bridal & Occasion': '/images/lookbook-1.jpg',
};

export const categorySlug = (category: string) =>
  category.toLowerCase().replace(/[^a-z0-9]+/g, '-');

export const ALL_CATEGORIES = Array.from(new Set(SERVICES.map((s) => s.category)));

export const ServicesCategories: React.FC = () => {
  return (
    <div className="bg-[#f7f5ee] min-h-screen">
      {/* Header */}
      <div className="pt-32 sm:pt-40 pb-10 sm:pb-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[11px] sm:text-xs tracking-[0.3em] uppercase text-neutral-500 mb-4">
            Paul Hair Studio
          </p>
          <h1 className="font-editorial text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight leading-none text-black">
            Our Services
          </h1>
          <p className="mt-5 text-sm sm:text-base text-neutral-600 leading-relaxed max-w-xl mx-auto">
            Choose a discipline, then explore every ritual it holds.
          </p>
        </div>
      </div>

      {/* Category cards grid */}
      <div className="px-4 sm:px-6 lg:px-8 pb-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-7">
          {ALL_CATEGORIES.map((category, idx) => {
            const count = SERVICES.filter((s) => s.category === category).length;
            return (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, ease: 'easeOut', delay: idx * 0.07 }}
              >
                <Link
                  href={`/services/${categorySlug(category)}`}
                  className="group block bg-white border border-neutral-200 hover:bg-black hover:border-black transition-colors duration-300 overflow-hidden"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={CATEGORY_MEDIA[category] ?? '/images/hero-1.jpg'}
                      alt={category}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                  </div>
                  <div className="p-6 sm:p-8 flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-editorial text-base sm:text-lg font-black uppercase tracking-wide text-black group-hover:text-white transition-colors">
                        {category}
                      </h3>
                      <p className="text-[11px] sm:text-xs text-neutral-500 group-hover:text-white/60 mt-1 transition-colors">
                        {count} {count === 1 ? 'Service' : 'Services'}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-black group-hover:text-white shrink-0 transition-all duration-300 group-hover:translate-x-1" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};