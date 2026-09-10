'use client';
// ArticleModal — Full-screen overlay modal that displays a press article's
// details: header image, author, category, date, read time, excerpt, and body
// content. Framer Motion handles enter/exit scale+fade transitions. A blurred
// backdrop closes the modal on click. Opened from PressSection when a user
// clicks "READ MORE" on any magazine card.
import { PressArticle } from '../types';
import { X, Calendar, Clock, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ArticleModalProps {
  article: PressArticle | null;
  onClose: () => void;
}

export const ArticleModal: React.FC<ArticleModalProps> = ({ article, onClose }) => {
  if (!article) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-xs"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-white w-full max-w-2xl shadow-2xl z-10 overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 bg-black/60 text-white hover:bg-black transition-colors rounded-full cursor-pointer"
            aria-label="Close article"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header Image */}
          <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-neutral-900">
            <img
              src={article.image}
              alt={article.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-neutral-300">
                {article.author} • {article.category}
              </span>
              <h2 className="font-editorial text-xl sm:text-2xl font-black uppercase tracking-tight text-white mt-1">
                {article.title}
              </h2>
            </div>
          </div>

          {/* Article Body */}
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-4 text-xs text-neutral-500 pb-4 mb-4 border-b border-neutral-100">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {article.dateBadge.month} {article.dateBadge.day}, 2026
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {article.readTime}
              </span>
            </div>

            <p className="text-sm font-semibold text-neutral-800 mb-4 leading-relaxed italic">
              "{article.excerpt}"
            </p>

            <div className="text-xs text-neutral-600 space-y-3 leading-relaxed">
              <p>{article.content}</p>
              <p>
                Our philosophy centers around sustainable, botanical formulations engineered in
                Switzerland. Every treatment is custom tailored to the natural curl pattern and scalp
                micro-climate of each guest.
              </p>
            </div>

            <div className="mt-8 pt-4 border-t border-neutral-100 flex justify-between items-center">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-black text-white text-xs font-bold tracking-[0.15em] uppercase hover:bg-neutral-800"
              >
                CLOSE
              </button>
              <span className="text-xs text-neutral-400 font-medium">Paul Hair Studio Press</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
