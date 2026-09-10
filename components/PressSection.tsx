'use client';
// PressSection — Three-column press/magazine article cards with hover zoom
// effects and a black date-badge overlay. Each card shows author, category,
// title, and a "READ MORE" link. Clicking a card triggers onSelectArticle,
// which opens the ArticleModal. Rendered in the #press section of the home
// page to showcase media coverage.
import { PRESS_ARTICLES } from '../data/salonData';
import { PressArticle } from '../types';
import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface PressSectionProps {
  onSelectArticle: (article: PressArticle) => void;
}

export const PressSection: React.FC<PressSectionProps> = ({ onSelectArticle }) => {
  return (
    <section id="press" className="bg-white py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 sm:mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="font-editorial text-3xl sm:text-4xl md:text-5xl font-black uppercase text-black tracking-tight mb-3"
          >
            PAUL'S WORK IN PRESS
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xs sm:text-sm text-neutral-600 font-medium"
          >
            Lorem ipsum dolor sit amet, consectetur adipiscing
          </motion.p>
        </div>

        {/* 3 Magazine Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10">
          {PRESS_ARTICLES.map((article, idx) => (
            <motion.article
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
              onClick={() => onSelectArticle(article)}
              className="group cursor-pointer flex flex-col"
            >
              {/* Image Container with Black Date Square Badge */}
              <div className="relative h-80 sm:h-96 overflow-hidden mb-5 bg-neutral-100">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                  loading="lazy"
                />

                {/* Date Square Badge (as in screenshot: Black square, Mar on top, day number below) */}
                <div className="absolute top-0 left-0 bg-black text-white w-12 h-14 sm:w-14 sm:h-16 flex flex-col items-center justify-center select-none shadow-md z-10">
                  <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-widest text-neutral-300 leading-tight">
                    {article.dateBadge.month}
                  </span>
                  <span className="text-base sm:text-lg font-black tracking-tight leading-none mt-0.5">
                    {article.dateBadge.day}
                  </span>
                </div>
              </div>

              {/* Category / Metadata */}
              <div className="flex items-center text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-neutral-500 uppercase mb-2">
                <span>{article.author}</span>
                <span className="mx-2 text-neutral-300">|</span>
                <span>{article.category}</span>
              </div>

              {/* Title */}
              <h3 className="font-editorial text-base sm:text-lg font-black uppercase text-black tracking-tight mb-4 group-hover:text-neutral-600 transition-colors leading-snug">
                {article.title}
              </h3>

              {/* Action Button: READ MORE */}
              <div className="mt-auto pt-1">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold tracking-[0.2em] uppercase text-black border-b border-black pb-0.5 group-hover:gap-2 transition-all">
                  <span>READ MORE</span>
                  <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};
