'use client';
// GalleryPage — Full-page gallery browser replaced with 6 YouTube Shorts
// (vertical films) in a responsive grid. Category filter pills (ALL,
// CUTTING, COLOUR, STYLING, SALON) filter the visible videos with an
// AnimatePresence fade in/out transition on each change. Each card shows
// an autoplay-muted looped embed with a gradient scrim + "Watch Film"
// overlay; clicking opens a lightbox with sound. Video metadata comes from
// data/galleryData.ts (GALLERY_VIDEOS). Rendered by the /gallery route.
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Play, Film } from 'lucide-react';
import { GALLERY_VIDEOS, GALLERY_CATEGORIES, VIDEO_POSTERS } from '@/data/galleryData';

interface ShortVideo {
  id: string;
  title: string;
  style: string;
  category: string;
  poster: string;
  player: string;
}

const VIDEOS: ShortVideo[] = GALLERY_VIDEOS.map((video) => ({
  id: video.id,
  title: video.title,
  style: video.style,
  category: video.category,
  poster: VIDEO_POSTERS[video.id] ?? `/videos/${video.id}.webp`,
  player: `https://www.youtube.com/embed/${video.id}?autoplay=1&mute=0&rel=0&playsinline=1`,
}));

export const GalleryPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [selectedVideo, setSelectedVideo] = useState<ShortVideo | null>(null);

  const visible =
    activeCategory === 'ALL'
      ? VIDEOS
      : VIDEOS.filter((video) => video.category === activeCategory);

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
          <p className="mt-4 text-sm text-neutral-500 flex items-center justify-center gap-2">
            <Film className="w-4 h-4" /> Six films from the studio floor
          </p>
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

        {/* Video Grid with Fade In/Out on filter change */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
          >
            {visible.map((video, idx) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut', delay: idx * 0.06 }}
                className="group relative aspect-[9/16] overflow-hidden cursor-pointer bg-black"
                onClick={() => setSelectedVideo(video)}
              >
                <img
                  src={video.poster}
                  alt={video.title}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Gradient Scrim & Hover Details */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent flex flex-col justify-end p-4 sm:p-5">
                  <span className="absolute top-3 left-3 text-[9px] font-bold tracking-[0.2em] uppercase bg-white/90 text-black px-3 py-1">
                    {video.category}
                  </span>
                  <div className="flex items-center gap-1.5 text-white/70 text-[10px] tracking-[0.2em] uppercase mb-1">
                    <Sparkles className="w-3 h-3 text-white" />
                    <span>{video.style}</span>
                  </div>
                  <h3 className="text-white font-editorial text-base sm:text-lg font-bold uppercase tracking-tight mb-2">
                    {video.title}
                  </h3>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white/80 uppercase underline underline-offset-4 mt-1">
                    <Play className="w-3 h-3" /> Watch Film
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Video Lightbox */}
      <AnimatePresence>
        {selectedVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedVideo(null)}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
          >
            <motion.div
              initial={{ scale: 0.92 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 300, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[420px] bg-black overflow-hidden shadow-2xl border border-white/10"
            >
              <button
                onClick={() => setSelectedVideo(null)}
                className="absolute top-3 right-3 z-10 p-2 bg-black/70 text-white/80 hover:text-white rounded-full transition-colors cursor-pointer"
                aria-label="Close gallery film"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="aspect-[9/16] w-full">
                <iframe
                  key={selectedVideo.player}
                  src={selectedVideo.player}
                  title={selectedVideo.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>

              <div className="flex items-center justify-between px-5 py-4 bg-neutral-950 text-white">
                <div>
                  <span className="text-[9px] font-bold tracking-[0.25em] uppercase text-neutral-400 block">
                    Paul Hair Studio
                  </span>
                  <h3 className="font-editorial text-base font-bold uppercase tracking-tight">
                    {selectedVideo.title}
                  </h3>
                </div>
                <a
                  href={`https://www.youtube.com/shorts/${selectedVideo.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-bold tracking-[0.18em] uppercase text-black bg-white px-3 py-2 hover:bg-neutral-200 transition-colors shrink-0"
                >
                  OPEN ON YOUTUBE
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};