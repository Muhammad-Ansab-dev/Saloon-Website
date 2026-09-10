'use client';
// ---------------------------------------------------------------------------
// FloatingWidget — Persistent floating action button pinned to the right edge
// of the viewport. Displays a pulsing calendar icon that opens the booking modal.
//
// Workflow role: Global chrome — rendered by Providers on every page. Provides
// an always-visible shortcut to trigger BookingModal, complementing the Header's
// "Book Now" button for quick appointment access while scrolling.
//
// Dependencies: lucide-react (Calendar), framer-motion (pulse animation).
// Consumed only by Providers.tsx.
// ---------------------------------------------------------------------------
import React from 'react';
import { Calendar } from 'lucide-react';
import { motion } from 'motion/react';

interface FloatingWidgetProps {
  cartCount?: number;
  onOpenCart?: () => void;
  onOpenBooking: () => void;
}

export const FloatingWidget: React.FC<FloatingWidgetProps> = ({
  onOpenBooking,
}) => {
  return (
    <aside aria-label="Quick Actions" className="fixed right-3 sm:right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2.5">
      {/* Booking Quick Bubble */}
      <motion.button
        id="floating-booking-btn"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        onClick={onOpenBooking}
        className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black hover:bg-neutral-800 text-white shadow-xl flex items-center justify-center cursor-pointer focus:outline-none transition-colors group"
        aria-label="Book appointment"
        title="Schedule appointment"
      >
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-full border-2 border-black"
          animate={{ scale: [1, 1.6], opacity: [0.7, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
        />
        <Calendar className="w-5 h-5 group-hover:scale-110 transition-transform" />
      </motion.button>
    </aside>
  );
};
