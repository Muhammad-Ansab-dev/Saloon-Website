'use client';
// InteractiveBooking — Booking section with three columns: (left) a large
// calligraphic "Love is in the hair" script with scroll-triggered clipPath
// reveal animation, (center) an interactive September 2026 calendar widget
// with time-slot picker, and (right) studio working hours plus a "BOOK
// APPOINTMENT" CTA. Selecting a date and clicking the CTA calls
// onSelectDateAndBook to initiate the booking flow. Rendered in the
// #booking section of the home page.
import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { motion, useInView } from 'motion/react';

interface InteractiveBookingProps {
  onSelectDateAndBook: (dateStr: string, timeSlot?: string) => void;
}

const SCRIPT_LINES = [
  { text: 'Love', indent: 'pl-0', duration: 0.7, delay: 0.15 },
  { text: 'is in', indent: 'pl-6 sm:pl-10 lg:pl-12', duration: 0.65, delay: 0.75 },
  { text: 'the', indent: 'pl-3 sm:pl-5 lg:pl-6', duration: 0.45, delay: 1.3 },
  { text: 'hair', indent: 'pl-10 sm:pl-16 lg:pl-20', duration: 0.75, delay: 1.65 },
];

export const InteractiveBooking: React.FC<InteractiveBookingProps> = ({
  onSelectDateAndBook,
}) => {
  // Matching September 2026 as displayed in the screenshot!
  const [selectedDay, setSelectedDay] = useState<number>(7);
  const [selectedSlot, setSelectedSlot] = useState<string>('14:30');

  // Scroll trigger detection: runs only once when scrolled into view
  const scriptContainerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(scriptContainerRef, { once: true, amount: 0.1 });
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    if (isInView) {
      setHasTriggered(true);
      return;
    }

    // Scroll & visibility fallback to guarantee animation triggers inside iframe
    const checkVisibility = () => {
      if (scriptContainerRef.current) {
        const rect = scriptContainerRef.current.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.95 && rect.bottom > 0) {
          setHasTriggered(true);
        }
      }
    };

    checkVisibility();
    window.addEventListener('scroll', checkVisibility, { passive: true });
    window.addEventListener('resize', checkVisibility, { passive: true });
    return () => {
      window.removeEventListener('scroll', checkVisibility);
      window.removeEventListener('resize', checkVisibility);
    };
  }, [isInView]);

  const shouldAnimate = isInView || hasTriggered;

  // Days configuration for September 2026 (starts on Tuesday Sep 1)
  // Week format: Mon, Tue, Wed, Thu, Fri, Sat, Sun
  const calendarDays = [
    { day: 31, isCurrentMonth: false },
    { day: 1, isCurrentMonth: true },
    { day: 2, isCurrentMonth: true },
    { day: 3, isCurrentMonth: true },
    { day: 4, isCurrentMonth: true },
    { day: 5, isCurrentMonth: true },
    { day: 6, isCurrentMonth: true },
    { day: 7, isCurrentMonth: true, isPopular: true },
    { day: 8, isCurrentMonth: true },
    { day: 9, isCurrentMonth: true },
    { day: 10, isCurrentMonth: true },
    { day: 11, isCurrentMonth: true },
    { day: 12, isCurrentMonth: true },
    { day: 13, isCurrentMonth: true },
    { day: 14, isCurrentMonth: true },
    { day: 15, isCurrentMonth: true },
    { day: 16, isCurrentMonth: true },
    { day: 17, isCurrentMonth: true },
    { day: 18, isCurrentMonth: true },
    { day: 19, isCurrentMonth: true },
    { day: 20, isCurrentMonth: true },
    { day: 21, isCurrentMonth: true },
    { day: 22, isCurrentMonth: true },
    { day: 23, isCurrentMonth: true },
    { day: 24, isCurrentMonth: true },
    { day: 25, isCurrentMonth: true },
    { day: 26, isCurrentMonth: true },
    { day: 27, isCurrentMonth: true },
    { day: 28, isCurrentMonth: true },
    { day: 29, isCurrentMonth: true },
    { day: 30, isCurrentMonth: true },
    { day: 1, isCurrentMonth: false },
    { day: 2, isCurrentMonth: false },
    { day: 3, isCurrentMonth: false },
    { day: 4, isCurrentMonth: false },
  ];

  const availableSlots = ['10:00', '11:30', '14:30', '16:00', '18:00'];

  const handleBookNow = () => {
    onSelectDateAndBook(`September ${selectedDay}, 2026`, selectedSlot);
  };

  return (
    <section id="booking" className="relative bg-[#fce7ee] py-20 sm:py-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          {/* Left: Giant Calligraphic Script "Love is in the hair" (Scroll-triggered single-run animation) */}
          <div ref={scriptContainerRef} className="lg:col-span-5 flex flex-col justify-center lg:justify-start items-center lg:items-start">
            <motion.div
              initial={{ opacity: 0, rotate: -4, scale: 0.95 }}
              animate={
                shouldAnimate
                  ? { opacity: 1, rotate: -2, scale: 1 }
                  : { opacity: 0, rotate: -4, scale: 0.95 }
              }
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="select-none text-black transform -rotate-3"
            >
              <div className="font-script text-7xl sm:text-8xl md:text-9xl lg:text-[7.5rem] xl:text-[8.5rem] 2xl:text-[9.5rem] font-bold leading-[1.05] tracking-tight text-neutral-950 overflow-visible py-2">
                {SCRIPT_LINES.map((line) => (
                  <div key={line.text} className={`block ${line.indent} overflow-visible my-1`}>
                    <div className="relative inline-block overflow-visible">
                      {/* Revealed cursive text using scroll-triggered clipPath animation (runs only once) */}
                      <motion.span
                        className="inline-block whitespace-nowrap will-change-transform px-3 py-1.5 overflow-visible"
                        initial={{ clipPath: 'inset(0% 100% 0% 0%)', opacity: 0 }}
                        animate={
                          shouldAnimate
                            ? { clipPath: 'inset(0% 0% 0% 0%)', opacity: 1 }
                            : { clipPath: 'inset(0% 100% 0% 0%)', opacity: 0 }
                        }
                        transition={{
                          duration: line.duration,
                          delay: line.delay,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      >
                        {line.text}
                      </motion.span>
                    </div>
                  </div>
                ))}

                {/* Calligraphic Flourish Swash & Heart drawn after the last word on scroll */}
                <div className="pl-8 sm:pl-16 lg:pl-20 mt-2 relative w-64 sm:w-80 lg:w-96 h-12 overflow-visible">
                  <svg
                    viewBox="0 0 320 50"
                    className="w-full h-full overflow-visible"
                    fill="none"
                  >
                    <motion.path
                      d="M 10 24 Q 100 44 195 22 T 285 26 C 293 26 302 18 294 11 C 286 5 278 18 290 26"
                      stroke="#111"
                      strokeWidth="3.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={
                        shouldAnimate
                          ? { pathLength: 1, opacity: 1 }
                          : { pathLength: 0, opacity: 0 }
                      }
                      transition={{
                        duration: 0.85,
                        delay: 2.3,
                        ease: 'easeInOut',
                      }}
                    />
                  </svg>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Center: The Interactive Calendar Widget */}
          <div className="lg:col-span-4 flex justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-white shadow-xl w-full max-w-[340px] overflow-hidden"
            >
              {/* Calendar Black Header bar */}
              <div className="bg-black text-white px-4 py-3 flex items-center justify-between">
                <span className="text-[11px] font-black tracking-[0.2em] uppercase">
                  SEPTEMBER 2026
                </span>
                <div className="flex items-center space-x-2">
                  <button className="text-white/60 hover:text-white cursor-pointer" aria-label="Previous month">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button className="text-white/60 hover:text-white cursor-pointer" aria-label="Next month">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Day Labels */}
              <div className="grid grid-cols-7 text-center py-2.5 border-b border-neutral-100 bg-neutral-50/60">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                  <span
                    key={d}
                    className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider"
                  >
                    {d}
                  </span>
                ))}
              </div>

              {/* Calendar Numbers Grid */}
              <div className="grid grid-cols-7 text-center p-2 gap-y-1">
                {calendarDays.map((item, idx) => {
                  const isSelected = item.isCurrentMonth && item.day === selectedDay;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        if (item.isCurrentMonth) setSelectedDay(item.day);
                      }}
                      disabled={!item.isCurrentMonth}
                      className={`h-8 w-8 mx-auto flex items-center justify-center text-xs font-medium transition-all ${
                        !item.isCurrentMonth
                          ? 'text-neutral-300 cursor-not-allowed'
                          : isSelected
                          ? 'border border-black font-bold text-black bg-neutral-100/50'
                          : 'text-neutral-800 hover:bg-neutral-100 cursor-pointer'
                      }`}
                    >
                      {item.day}
                    </button>
                  );
                })}
              </div>

              {/* Select Time Slot Strip inside Calendar */}
              <div className="px-4 py-3 bg-neutral-50 border-t border-neutral-100">
                <div className="flex items-center justify-between text-[11px] text-neutral-600 mb-2">
                  <span className="font-semibold text-black flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Sep {selectedDay}:
                  </span>
                  <span>Select Time</span>
                </div>
                <div className="flex flex-wrap gap-1.5 justify-between">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      className={`text-[10px] px-2 py-1 font-bold transition-colors ${
                        selectedSlot === slot
                          ? 'bg-black text-white'
                          : 'bg-white text-neutral-800 border border-neutral-200 hover:border-black'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right: Treatment Hours & Book Trigger */}
          <div className="lg:col-span-3 space-y-6 xl:pl-2">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h3 className="font-editorial text-lg sm:text-xl font-black uppercase tracking-tight text-black mb-6 leading-tight max-w-xs">
                FIND AVAILABLE DATE FOR TREATMENT
              </h3>

              {/* Working Hours with dotted borders */}
              <div className="space-y-3.5 text-xs text-neutral-800 mb-8 max-w-sm">
                <div className="flex items-center justify-between border-b border-neutral-300/60 pb-1.5">
                  <span className="font-medium text-neutral-900">Working days:</span>
                  <span className="font-semibold text-black">09:00 – 20:00</span>
                </div>
                <div className="flex items-center justify-between border-b border-neutral-300/60 pb-1.5">
                  <span className="font-medium text-neutral-900">Saturday:</span>
                  <span className="font-semibold text-black">10:00 – 18:00</span>
                </div>
                <div className="flex items-center justify-between border-b border-neutral-300/60 pb-1.5">
                  <span className="font-medium text-neutral-900">Sunday:</span>
                  <span className="font-semibold text-black">12:00 – 18:00</span>
                </div>
              </div>

              {/* Booking CTA button */}
              <button
                id="booking-confirm-cta"
                onClick={handleBookNow}
                className="w-full sm:w-auto px-8 py-3.5 bg-black text-white text-xs font-bold tracking-[0.2em] uppercase hover:bg-neutral-800 transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>BOOK APPOINTMENT (SEP {selectedDay})</span>
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
