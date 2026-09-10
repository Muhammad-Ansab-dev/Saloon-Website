'use client';
// NewsletterSubscribe — email signup banner at the very bottom of the
// homepage (above footer). Shows a headline + email input form; on submit
// fires a canvas-confetti burst and swaps to a "Thank You" confirmation.
// Rendered by HomePage as the final content section.
// Uses motion/react for the success-state spring transition and
// canvas-confetti for the celebration effect.

import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { ScrollReveal, SpringReveal } from './ScrollReveal';

export const NewsletterSubscribe: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setIsSubmitted(true);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#000000', '#fce7ee', '#f3cbd7'],
    });

    setTimeout(() => {
      setEmail('');
      setIsSubmitted(false);
    }, 4000);
  };

  return (
    <section className="relative bg-[#fce7ee] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[200px] flex flex-col sm:flex-row items-center justify-between gap-6 py-12 sm:py-0 sm:h-[200px]">
        {/* Left: Text */}
        <div className="sm:flex-1 max-w-lg">
          <SpringReveal
            direction="up"
            distance={40}
            scale={0.92}
            easing="spring"
          >
            <h2 className="font-editorial text-2xl sm:text-3xl font-black uppercase text-black tracking-tight leading-snug">
              LET YOUR HAIR SHINE WITH SPECIAL OFFERS
            </h2>
            <p className="mt-3 text-sm text-neutral-600">
              Subscribe to receive exclusive Paul Haircare deals and editorial updates.
            </p>
          </SpringReveal>
        </div>

        {/* Right: Form */}
        <div className="sm:flex-1 max-w-md w-full">
          {isSubmitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="inline-flex items-center gap-2 bg-black text-white px-6 py-4 text-xs font-bold tracking-[0.2em] uppercase"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>THANK YOU FOR SUBSCRIBING</span>
            </motion.div>
          ) : (
            <ScrollReveal direction="up" distance={20}>
              <form
                onSubmit={handleSubmit}
                className="flex items-stretch gap-0 shadow-sm"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter e-mail address"
                  required
                  className="flex-1 min-w-0 px-4 py-4 bg-transparent border border-black/40 border-r-0 text-xs font-medium text-black placeholder:text-neutral-500 focus:outline-none focus:border-black bg-white/40"
                />
                <button
                  type="submit"
                  className="px-6 py-4 bg-black text-white text-xs font-bold tracking-[0.2em] uppercase hover:bg-neutral-800 transition-colors shrink-0 cursor-pointer"
                >
                  SUBSCRIBE
                </button>
              </form>
            </ScrollReveal>
          )}
        </div>
      </div>
    </section>
  );
};