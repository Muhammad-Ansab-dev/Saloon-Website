'use client';
// ---------------------------------------------------------------------------
// BookingModal — centered overlay that hosts the shared BookingForm. All form
// logic (service/stylist/date/time/availability/submit) lives in BookingForm
// so the modal and the /contact booking card stay identical. This file only
// provides the overlay chrome, close button and confetti on success.
// Rendered by Providers.tsx.
// ---------------------------------------------------------------------------
import { useState } from 'react';
import { ServiceItem } from '@/types';
import { X, Scissors } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { BookingForm } from './BookingForm';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedService?: ServiceItem | null;
  preSelectedDate?: string;
  preSelectedTime?: string;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  preSelectedService,
  preSelectedDate,
  preSelectedTime,
}) => {
  // Force a fresh form each time the modal opens (no stale selections).
  const [sessionKey, setSessionKey] = useState(0);

  const handleClose = () => {
    setSessionKey((prevKey) => prevKey + 1);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
          />

          <motion.div
            key={sessionKey}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="relative bg-white w-full max-w-xl shadow-2xl z-10 overflow-hidden"
          >
            {/* Modal Header */}
            <div className="bg-black text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4" />
                <h3 className="font-editorial text-xs font-black tracking-[0.2em] uppercase">
                  HAIR STUDIO RESERVATION
                </h3>
              </div>
              <button
                onClick={handleClose}
                className="text-white/60 hover:text-white p-1 cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 sm:p-8">
              <BookingForm
                key={sessionKey}
                preSelectedService={preSelectedService}
                preSelectedDate={preSelectedDate}
                preSelectedTime={preSelectedTime}
                onSuccess={() =>
                  confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } })
                }
                onDone={handleClose}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};