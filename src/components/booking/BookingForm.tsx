'use client';
// ---------------------------------------------------------------------------
// BookingForm — the single, reusable appointment form used by BOTH the
// BookingModal overlay and the ContactPage booking card. Owning the form in
// one place guarantees the modal and the page never drift apart.
//
// Flow: pick service → stylist → date (DatePickerField) → time (from live
// availability) → guest details → submit to POST /api/booking (409-clash-safe).
// On success it shows a summary panel and calls `onSuccess()` (used to fire
// confetti inside the modal). Rendered by BookingModal and ContactPage.
// ---------------------------------------------------------------------------
import React, { useEffect, useMemo, useState } from 'react';
import { ServiceItem } from '@/types';
import { CalendarIcon, Clock, Loader2 } from 'lucide-react';
import { useSiteContent } from '../../hooks/useSiteContent';
import { DatePickerField } from './DatePickerField';
import { generateTimeSlots, formatDisplayDate, todayISO } from '@/lib/bookingTime';

interface BookingFormProps {
  preSelectedService?: ServiceItem | null;
  preSelectedDate?: string;
  preSelectedTime?: string;
  /** Fired after a successful submission (BookingModal uses it for confetti). */
  onSuccess?: () => void;
  /** Fired when the user clicks "Done" on the success panel (modal close). */
  onDone?: () => void;
}

export const BookingForm: React.FC<BookingFormProps> = ({
  preSelectedService,
  preSelectedDate,
  preSelectedTime,
  onSuccess,
  onDone,
}) => {
  const { services, stylists } = useSiteContent();

  const [step, setStep] = useState<'form' | 'submitting' | 'success'>('form');
  const [submitError, setSubmitError] = useState('');

  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    preSelectedService?.id || services[0]?.id || ''
  );
  const [selectedStylistId, setSelectedStylistId] = useState<string>(stylists[0]?.id || '');
  const [bookingDate, setBookingDate] = useState<string>(preSelectedDate || todayISO);
  const [bookingTime, setBookingTime] = useState<string>(preSelectedTime || '');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  // Live availability for the chosen date + stylist.
  const [takenSlots, setTakenSlots] = useState<Set<string>>(new Set());
  const [availLoading, setAvailLoading] = useState(false);

  const currentService = services.find((service) => service.id === selectedServiceId) || services[0];
  const currentStylist = stylists.find((stylist) => stylist.id === selectedStylistId) || stylists[0];

  // Slots for the selected weekday, minus already-taken times.
  const allSlots = useMemo(
    () => generateTimeSlots(new Date(bookingDate + 'T12:00:00').getDay()),
    [bookingDate]
  );
  const availableSlots = useMemo(
    () => allSlots.filter((slot) => !takenSlots.has(slot)),
    [allSlots, takenSlots]
  );

  // Re-seed the service if a different one is pre-selected externally.
  useEffect(() => {
    if (preSelectedService) setSelectedServiceId(preSelectedService.id);
  }, [preSelectedService]);

  // Fetch availability whenever date or stylist changes.
  useEffect(() => {
    if (!bookingDate || !currentStylist) return;
    let cancelled = false;
    setAvailLoading(true);
    fetch(`/api/availability?date=${bookingDate}&stylist=${encodeURIComponent(currentStylist.name)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { taken: string[] }) => {
        if (!cancelled) setTakenSlots(new Set(data.taken));
      })
      .catch(() => {
        if (!cancelled) setTakenSlots(new Set());
      })
      .finally(() => {
        if (!cancelled) setAvailLoading(false);
      });
    return () => { cancelled = true; };
  }, [bookingDate, currentStylist]);

  // Keep the chosen time valid: jump to the first free slot when the
  // currently selected time gets booked by someone else (or clear it).
  useEffect(() => {
    if (!bookingTime) {
      setBookingTime(availableSlots[0] ?? '');
      return;
    }
    if (takenSlots.has(bookingTime)) {
      setBookingTime(availableSlots[0] ?? '');
    }
  }, [takenSlots, availableSlots, bookingTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !bookingTime) return;

    setSubmitError('');
    setStep('submitting');
    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: currentService.id,
          serviceName: currentService.name,
          stylistName: currentStylist.name,
          date: bookingDate,
          time: bookingTime,
          clientName: name,
          clientEmail: email,
          clientPhone: phone,
          notes,
          createdAt: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? 'Something went wrong — please try again.');
        setStep('form');
        return;
      }
      setStep('success');
      onSuccess?.();
    } catch {
      setSubmitError('Network error — please try again.');
      setStep('form');
    }
  };

  if (step === 'success') {
    return (
      <div className="text-center py-6 space-y-4">
        <h3 className="font-editorial text-2xl font-black uppercase tracking-tight text-black">
          RESERVATION CONFIRMED
        </h3>
        <p className="text-xs text-neutral-600 max-w-sm mx-auto leading-relaxed">
          We look forward to welcoming you, <span className="font-bold text-black">{name}</span>.
          We&apos;ll confirm your appointment shortly.
        </p>

        <div className="bg-neutral-50 p-4 border border-neutral-100 max-w-xs mx-auto text-left space-y-1.5 text-xs text-neutral-700">
          <div className="flex justify-between">
            <span className="text-neutral-500">Service:</span>
            <span className="font-bold text-black">{currentService.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Stylist:</span>
            <span className="font-bold text-black">{currentStylist.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Date &amp; Time:</span>
            <span className="font-bold text-black">{formatDisplayDate(bookingDate)} &bull; {bookingTime}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Price:</span>
            <span className="font-bold text-black">CHF {currentService.price}</span>
          </div>
        </div>

        {onDone && (
          <button
            onClick={onDone}
            className="mt-6 px-8 py-3 bg-black text-white text-xs font-bold tracking-[0.2em] uppercase hover:bg-neutral-800 cursor-pointer"
          >
            DONE
          </button>
        )}
      </div>
    );
  }

  const inputCls =
    'w-full px-3 py-2.5 bg-neutral-50 border border-neutral-300 text-xs font-medium focus:outline-none focus:border-black';

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      {/* Service Selection */}
      <div>
        <label className="block font-bold tracking-wider text-black uppercase mb-1.5">
          Select Treatment
        </label>
        <select
          value={selectedServiceId}
          onChange={(e) => setSelectedServiceId(e.target.value)}
          className={inputCls}
        >
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name} — CHF {service.price} ({service.durationMinutes} min)
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
          value={selectedStylistId}
          onChange={(e) => setSelectedStylistId(e.target.value)}
          className={inputCls}
        >
          {stylists.map((stylist) => (
            <option key={stylist.id} value={stylist.id}>
              {stylist.name} ({stylist.role})
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
          <DatePickerField value={bookingDate} onChange={setBookingDate} />
        </div>
        <div>
          <label className="block font-bold tracking-wider text-black uppercase mb-1.5 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Time
            {availLoading && <Loader2 className="w-3 h-3 animate-spin opacity-50" />}
          </label>
          <select
            value={bookingTime}
            onChange={(e) => setBookingTime(e.target.value)}
            disabled={availableSlots.length === 0}
            className={`${inputCls} disabled:opacity-40`}
          >
            {availableSlots.length === 0 ? (
              <option>{takenSlots.size > 0 ? 'No slots available' : 'Loading…'}</option>
            ) : (
              availableSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))
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
            className={inputCls}
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
            className={inputCls}
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
          className={inputCls}
        />
      </div>

      <div>
        <label className="block font-bold tracking-wider text-black uppercase mb-1.5">
          Notes (optional)
        </label>
        <input
          type="text"
          placeholder="e.g. Bring inspiration photos"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={inputCls}
        />
      </div>

      {submitError && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2">
          {submitError}
        </p>
      )}

      <button
        type="submit"
        disabled={step === 'submitting' || !bookingTime || availableSlots.length === 0}
        className="w-full mt-2 py-3.5 bg-black text-white text-xs font-bold tracking-[0.2em] uppercase hover:bg-neutral-800 transition-colors shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {step === 'submitting' ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Booking&hellip;
          </>
        ) : (
          <>CONFIRM APPOINTMENT (CHF {currentService.price})</>
        )}
      </button>
    </form>
  );
};