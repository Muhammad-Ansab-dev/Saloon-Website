'use client';
import React, { useState } from 'react';
import { X, Sparkles, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ScrollReveal, SpringReveal } from './ScrollReveal';

const CARD_DIRS = ['left', 'up', 'right'] as const;

interface ShortVideo {
  id: string;
  title: string;
  style: string;
  embed: string;
  player: string;
}

const SHORT_IDS = ['rr7ACX0M_0c', 'j3L5MsVY3oE', 'RHr0md2bB74'];

const VIDEOS: ShortVideo[] = SHORT_IDS.map((id, i) => ({
  id,
  title: `EDITORIAL FILM 0${i + 1}`,
  style: 'Styling in motion',
  embed: `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&disablekb=1&playsinline=1&rel=0`,
  player: `https://www.youtube.com/embed/${id}?autoplay=1&mute=0&rel=0&playsinline=1`,
}));

export const LookbookTrio: React.FC = () => {
  const [selectedVideo, setSelectedVideo] = useState<ShortVideo | null>(null);

  return (
    <section id="lookbook" className="bg-white py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 sm:mb-20">
          <ScrollReveal direction="down" distance={20}>
            <span className="text-[10px] font-bold tracking-[0.25em] uppercase text-neutral-400 mb-4 block">
              Our Lookbook
            </span>
          </ScrollReveal>
          <ScrollReveal scaleY={0.1} distance={0} origin="50% 100%">
            <h2 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-black uppercase text-black tracking-tight leading-[1.05]">
              EXPLORE THE GALLERY
            </h2>
          </ScrollReveal>
        </div>

        {/* 3-Column Vertical Video Grid — each card from a different direction */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {VIDEOS.map((video, idx) => (
            <SpringReveal
              key={video.id}
              direction={CARD_DIRS[idx]}
              distance={60}
              delay={idx * 0.12}
              easing="spring"
              className="group relative aspect-[9/16] sm:aspect-[9/16] overflow-hidden cursor-pointer bg-black"
              onClick={() => setSelectedVideo(video)}
            >
              <iframe
                src={video.embed}
                title={video.title}
                className="absolute inset-0 w-full h-full"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{ pointerEvents: 'none' }}
              />

              {/* Gradient Scrim & Hover Details */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent flex flex-col justify-end p-5 sm:p-6">
                <div className="flex items-center gap-1.5 text-white/70 text-[10px] tracking-[0.2em] uppercase mb-1">
                  <Sparkles className="w-3 h-3 text-white" />
                  <span>{video.style}</span>
                </div>
                <h3 className="text-white font-editorial text-lg sm:text-xl font-bold uppercase tracking-tight mb-2">
                  {video.title}
                </h3>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white/80 uppercase underline underline-offset-4 mt-1">
                  <Play className="w-3 h-3" /> Watch Film
                </span>
              </div>
            </SpringReveal>
          ))}
        </div>
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
    </section>
  );
};