'use client';
// ---------------------------------------------------------------------------
// Footer — Site-wide footer with brand badge, 3-column layout (contact info,
// slogan + social icons, business hours), payment badges, copyright, and a
// back-to-top button. Purely presentational; receives a single callback.
//
// Workflow role: Global chrome — rendered by Providers on every page. Provides
// the scroll-to-top action (onScrollToTop) for the Footer's up-arrow button.
//
// Dependencies: lucide-react icons (Instagram, Linkedin, Facebook, ArrowUp,
// CreditCard). Consumed only by Providers.tsx.
// ---------------------------------------------------------------------------
import React from 'react';
import { Instagram, Linkedin, Facebook, ArrowUp, CreditCard } from 'lucide-react';

interface FooterProps {
  onScrollToTop: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onScrollToTop }) => {
  return (
    <footer className="bg-black text-white pt-16 sm:pt-20 pb-10 border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Center: White Rectangular Brand Badge (inverted) */}
        <div className="flex justify-center mb-16 sm:mb-20">
          <div className="bg-white text-black px-6 py-3 sm:px-7 sm:py-3.5 flex flex-col items-center justify-center shadow-lg select-none">
            <span className="text-[10px] tracking-[0.25em] font-light lowercase leading-tight">
              haircare
            </span>
            <span className="text-2xl sm:text-3xl font-black tracking-tight leading-none uppercase">
              paul
            </span>
          </div>
        </div>

        {/* 3-Column Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 sm:gap-14 text-center md:text-left mb-16">
          {/* Column 1: CONTACT */}
          <div>
            <h3 className="text-sm sm:text-base font-black tracking-[0.2em] uppercase text-white mb-4">
              CONTACT
            </h3>
            <div className="text-sm text-neutral-400 space-y-2 leading-relaxed">
              <p>
                <span className="font-semibold text-neutral-200">A:</span> Seestrasse 21, Zurich, CH
              </p>
              <p>
                <span className="font-semibold text-neutral-200">E:</span> paulhairstudio.com
              </p>
              <p>
                <span className="font-semibold text-neutral-200">T:</span> +675 467 967; +675 467 888
              </p>
            </div>
          </div>

          {/* Column 2: Center Slogan & Socials */}
          <div className="flex flex-col items-center justify-center">
            <h3 className="font-editorial text-base sm:text-lg font-black tracking-[0.15em] uppercase text-white text-center mb-6 max-w-xs leading-snug">
              IT'S NOT JUST A HAIR. IT'S STATE OF MIND.
            </h3>

            {/* Outlined Social Icon Squares */}
            <div className="flex items-center space-x-3">
              <a
                href="#"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 border border-neutral-700 hover:border-white text-neutral-300 hover:text-white flex items-center justify-center transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-3.5 h-3.5" />
              </a>
              <a
                href="#"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 border border-neutral-700 hover:border-white text-neutral-300 hover:text-white flex items-center justify-center transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-3.5 h-3.5" />
              </a>
              <a
                href="#"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 border border-neutral-700 hover:border-white text-neutral-300 hover:text-white flex items-center justify-center transition-colors"
                aria-label="Pinterest"
              >
                <span className="text-xs font-bold font-serif">P</span>
              </a>
              <a
                href="#"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 border border-neutral-700 hover:border-white text-neutral-300 hover:text-white flex items-center justify-center transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Column 3: HOURS */}
          <div className="md:text-right">
            <h3 className="text-sm sm:text-base font-black tracking-[0.2em] uppercase text-white mb-4">
              HOURS
            </h3>
            <div className="text-sm text-neutral-400 space-y-2 leading-relaxed">
              <p>
                <span className="font-semibold text-neutral-200">Working Days:</span> 09:00 – 20:00
              </p>
              <p>
                <span className="font-semibold text-neutral-200">Saturday:</span> 10:00 – 18:00
              </p>
              <p>
                <span className="font-semibold text-neutral-200">Sunday:</span> 12:00 – 18:00
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Sub-footer */}
        <div className="pt-8 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-neutral-500">
          {/* Payment Badges */}
          <div className="flex items-center space-x-2 text-neutral-400">
            <div className="px-2 py-0.5 border border-neutral-800 rounded text-[9px] font-bold">
              VISA
            </div>
            <div className="px-2 py-0.5 border border-neutral-800 rounded text-[9px] font-bold">
              MC
            </div>
            <div className="px-2 py-0.5 border border-neutral-800 rounded text-[9px] font-bold">
              AMEX
            </div>
            <div className="px-2 py-0.5 border border-neutral-800 rounded text-[9px] font-bold">
              APPLE PAY
            </div>
          </div>

          {/* Copyright */}
          <p>© 2026 Paul Hair Studio. All Rights Reserved</p>

          {/* Privacy & Back to Top */}
          <div className="flex items-center space-x-6">
            <span className="hover:text-neutral-300 cursor-pointer transition-colors">Privacy</span>
            <button
              onClick={onScrollToTop}
              className="p-1.5 border border-neutral-800 hover:border-white text-neutral-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Back to top"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
