'use client';
// ---------------------------------------------------------------------------
// BookingModal — Appointment reservation form in a centered overlay modal.
// Two-step flow: (1) form with service, stylist, date/time, and guest info,
// (2) confirmation summary with confetti. Supports pre-selection of a service
// so callers (e.g. "Book Now" from a specific service card) can jump ahead.
//
// Workflow role: Booking workflow — opened by Providers via isBookingOpen state.
// Receives optional preSelectedService/Date/Time from Providers (set by
// onSelectServiceForBooking or header triggers). Fires confetti on success.
//
// Dependencies: salonData (SERVICES, STYLISTS), types (ServiceItem), lucide-react
// icons, framer-motion (overlay animation), canvas-confetti.
// Rendered by Providers.tsx.
// ---------------------------------------------------------------------------
import React, { useEffect, useState } from 'react';
import { SERVICES, STYLISTS } from '../data/salonData';
import { ServiceItem } from '../types';
import { X, Calendar as CalendarIcon, Clock, User, Check, Scissors } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

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
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    preSelectedService?.id || SERVICES[0].id
  );
  const [selectedStylist, setSelectedStylist] = useState<string>(STYLISTS[0].id);
  const [bookingDate, setBookingDate] = useState<string>(
    preSelectedDate || 'September 7, 2026'
  );
  const [bookingTime, setBookingTime] = useState<string>(
    preSelectedTime || '14:30'
  );
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const currentService = SERVICES.find((s) => s.id === selectedServiceId) || SERVICES[0];
  const stylist = STYLISTS.find((s) => s.id === selectedStylist) || STYLISTS[0];

  useEffect(() => {
    if (isOpen && preSelectedService) {
      setSelectedServiceId(preSelectedService.id);
    }
  }, [isOpen, preSelectedService]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    setStep('success');
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const handleReset = () => {
    setStep('form');
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
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
          />

          <motion.div
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
                onClick={onClose}
                className="text-white/60 hover:text-white p-1 cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 sm:p-8">
              {step === 'success' ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-14 h-14 bg-black text-white rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="font-editorial text-2xl font-black uppercase tracking-tight text-black">
                    RESERVATION CONFIRMED
                  </h3>
                  <p className="text-xs text-neutral-600 max-w-sm mx-auto leading-relaxed">
                    We look forward to welcoming you, <span className="font-bold text-black">{name}</span>.
                    A confirmation email with calendar invite has been sent to {email}.
                  </p>

                  <div className="bg-neutral-50 p-4 border border-neutral-100 max-w-xs mx-auto text-left space-y-1.5 text-xs text-neutral-700">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Service:</span>
                      <span className="font-bold text-black">{currentService.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Stylist:</span>
                      <span className="font-bold text-black">{stylist.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Date & Time:</span>
                      <span className="font-bold text-black">{bookingDate} • {bookingTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Price:</span>
                      <span className="font-bold text-black">${currentService.price}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleReset}
                    className="mt-6 px-8 py-3 bg-black text-white text-xs font-bold tracking-[0.2em] uppercase hover:bg-neutral-800 cursor-pointer"
                  >
                    DONE
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                  {/* Service Selection */}
                  <div>
                    <label className="block font-bold tracking-wider text-black uppercase mb-1.5">
                      Select Treatment
                    </label>
                    <select
                      value={selectedServiceId}
                      onChange={(e) => setSelectedServiceId(e.target.value)}
                      className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-300 text-xs font-medium focus:outline-none focus:border-black"
                    >
                      {SERVICES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} — ${s.price} ({s.durationMinutes} min)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Stylist Choice */}
                  <div>
                    <label className="block font-bold tracking-wider text-black uppercase mb-1.5">
                      Stylist / Artisan
                    </label>
                    <select
                      value={selectedStylist}
                      onChange={(e) => setSelectedStylist(e.target.value)}
                      className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-300 text-xs font-medium focus:outline-none focus:border-black"
                    >
                      {STYLISTS.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.name} ({st.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date & Time Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold tracking-wider text-black uppercase mb-1.5 flex items-center gap-1">
                        <CalendarIcon className="w-3.5 h-3.5" /> Date
                      </label>
                      <input
                        type="text"
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-300 text-xs font-medium focus:outline-none focus:border-black"
                      />
                    </div>
                    <div>
                      <label className="block font-bold tracking-wider text-black uppercase mb-1.5 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Time
                      </label>
                      <select
                        value={bookingTime}
                        onChange={(e) => setBookingTime(e.target.value)}
                        className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-300 text-xs font-medium focus:outline-none focus:border-black"
                      >
                        {['09:30', '10:00', '11:30', '13:00', '14:30', '16:00', '17:30', '19:00'].map(
                          (t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  </div>

                  {/* Guest Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block font-bold tracking-wider text-black uppercase mb-1.5">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Sophia Miller"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-300 text-xs focus:outline-none focus:border-black"
                      />
                    </div>
                    <div>
                      <label className="block font-bold tracking-wider text-black uppercase mb-1.5">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="sophia@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-300 text-xs focus:outline-none focus:border-black"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold tracking-wider text-black uppercase mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="+41 79 123 4567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-300 text-xs focus:outline-none focus:border-black"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-4 py-3.5 bg-black text-white text-xs font-bold tracking-[0.2em] uppercase hover:bg-neutral-800 transition-colors shadow-sm cursor-pointer"
                  >
                    CONFIRM APPOINTMENT (${currentService.price})
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
