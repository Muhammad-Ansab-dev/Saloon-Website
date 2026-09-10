'use client';
// InstagramGrid — Bento-style editorial layout displaying 5 Instagram posts
// from the salon. Left column is a large grayscale portrait; right column is a
// 2×2 grid of smaller images. Hover reveals a dark overlay with caption text,
// the @paulhairstudio handle, and a toggleable heart/like button. Rendered
// on the home page between the press and contact sections to showcase social
// content.
import React, { useState } from 'react';
import { INSTAGRAM_POSTS } from '../data/salonData';
import { Heart, Instagram, Maximize2 } from 'lucide-react';
import { motion } from 'motion/react';

export const InstagramGrid: React.FC = () => {
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});

  const toggleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLikedPosts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section className="bg-white">
      {/* 5-Photo Bento Editorial Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-1 sm:gap-2">
        {/* Left Column: Tall Male Model Portrait (Spans 6 cols on md) */}
        <div className="md:col-span-6 relative h-[380px] sm:h-[520px] md:h-[620px] overflow-hidden group bg-neutral-100 cursor-pointer">
          <img
            src={INSTAGRAM_POSTS[0].image}
            alt={INSTAGRAM_POSTS[0].alt}
            className="w-full h-full object-cover object-center filter grayscale contrast-105 group-hover:scale-105 transition-transform duration-700"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-6">
            <div className="flex items-center justify-between text-white">
              <span className="text-xs font-bold tracking-widest flex items-center gap-1.5">
                <Instagram className="w-4 h-4" /> @paulhairstudio
              </span>
              <button
                onClick={(e) => toggleLike(INSTAGRAM_POSTS[0].id, e)}
                className="p-1 text-white hover:text-rose-400 transition-colors"
                aria-label="Like post"
              >
                <Heart
                  className={`w-5 h-5 ${
                    likedPosts[INSTAGRAM_POSTS[0].id] ? 'fill-rose-500 text-rose-500' : ''
                  }`}
                />
              </button>
            </div>
            <p className="text-white text-xs font-medium tracking-wide max-w-sm">
              {INSTAGRAM_POSTS[0].caption}
            </p>
          </div>
        </div>

        {/* Right Section: 4-grid squares (Spans 6 cols on md, 2x2 grid) */}
        <div className="md:col-span-6 grid grid-cols-2 gap-1 sm:gap-2">
          {INSTAGRAM_POSTS.slice(1, 5).map((post) => (
            <div
              key={post.id}
              className="relative h-[185px] sm:h-[255px] md:h-[305px] overflow-hidden group bg-neutral-100 cursor-pointer"
            >
              <img
                src={post.image}
                alt={post.alt}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4 sm:p-5">
                <div className="flex items-center justify-between text-white">
                  <span className="text-[10px] font-bold tracking-wider flex items-center gap-1">
                    <Instagram className="w-3.5 h-3.5" />
                  </span>
                  <button
                    onClick={(e) => toggleLike(post.id, e)}
                    className="p-1 text-white hover:text-rose-400 transition-colors"
                    aria-label="Like post"
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        likedPosts[post.id] ? 'fill-rose-500 text-rose-500' : ''
                      }`}
                    />
                  </button>
                </div>
                <p className="text-white text-[10px] sm:text-[11px] font-normal line-clamp-2">
                  {post.caption}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
