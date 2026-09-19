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
import { useSiteContent, staticBranches } from '../../hooks/useSiteContent';
import { DatePickerField } from './DatePickerField';
import { TimeSlotDropdown } from './TimeSlotDropdown';
import { generateTimeSlots, formatDisplayDate, todayISO } from '@/lib/bookingTime';
import { stylistBranch } from '@/data/salonData';

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
  const { services, stylists, branches } = useSiteContent();
  // Live branches from the store; static LOCATIONS until the fetch resolves.
  const branchList = branches.length > 0 ? branches : staticBranches();

  // Which stage the form is in: filling in details → request in flight →
  // success summary. `submitError` holds the message shown under the form
  // if the submission fails.
  const [step, setStep] = useState<'form' | 'submitting' | 'success'>('form');
  const [submitError, setSubmitError] = useState('');

  // The visitor's choices so far. When the booking flow opens with a
  // pre-selected service, date or time those are used as starting values;
  // otherwise we default to the first service and first stylist.
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    preSelectedService?.id || services[0]?.id || ''
  );
  const [selectedStylistId, setSelectedStylistId] = useState<string>(stylists[0]?.id || '');
  // The chosen day and time, plus the guest's contact details. `phone` and
  // `notes` are optional; name and email are required before submitting.
  const [bookingDate, setBookingDate] = useState<string>(preSelectedDate || todayISO());
  const [bookingTime, setBookingTime] = useState<string>(preSelectedTime || '');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  // Live availability for the chosen date + stylist.
  const [takenSlots, setTakenSlots] = useState<Set<string>>(new Set());
  const [availLoading, setAvailLoading] = useState(false);

  // Which salon/branch the appointment is for; defaults to the first branch.
  const [selectedBranch, setSelectedBranch] = useState<string>(
    branchList[0]?.slug ?? ''
  );

  // Stylists for the chosen branch (each branch has its own team).
  const branchStylists = useMemo(
    () => stylists.filter((s) => stylistBranch(s) === selectedBranch),
    [stylists, selectedBranch]
  );
  // If the branch has no team assigned yet, fall back to every stylist.
  const stylistOptions = branchStylists.length > 0 ? branchStylists : stylists;

  // Resolve the selected IDs to their full records (for names, prices and the
  // summary panel); if nothing is chosen yet, use the first matching entry.
  const currentService = services.find((service) => service.id === selectedServiceId) || services[0];
  const currentStylist = stylists.find((stylist) => stylist.id === selectedStylistId) || stylistOptions[0];

  // The weekday of the chosen date decides which time slots exist at all.
  const allSlots = useMemo(
    () => generateTimeSlots(new Date(bookingDate + 'T12:00:00').getDay()),
    [bookingDate]
  );
  // The bookable times: every slot for that weekday minus the already-taken ones.
  const availableSlots = useMemo(
    () => allSlots.filter((slot) => !takenSlots.has(slot)),
    [allSlots, takenSlots]
  );

  // Re-seed the service if a different one is pre-selected externally.
  useEffect(() => {
    if (preSelectedService) setSelectedServiceId(preSelectedService.id);
  }, [preSelectedService]);

  // Switching branch re-selects that branch's first stylist.
  useEffect(() => {
    setSelectedStylistId(stylistOptions[0]?.id ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranch, stylists]);

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

  // POST the booking to /api/booking. A failure (including a 409 "clash" when
  // the slot was taken by someone else meanwhile) returns to the form with the
  // server's message; success shows the summary panel and fires `onSuccess`.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Bail without sending unless all the essential fields are filled in.
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
          branch: selectedBranch,
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
            <span className="text-neutral-500">Branch:</span>
            <span className="font-bold text-black">{selectedBranch.toUpperCase()}</span>
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
            <span className="font-bold text-black">USD {currentService.price}</span>
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
      {/* Branch Selection */}
      <div>
        <label className="block font-bold tracking-wider text-black uppercase mb-1.5">
          Select Salon / Branch
        </label>
        <select
          value={selectedBranch}
          onChange={(e) => setSelectedBranch(e.target.value)}
          className={inputCls}
        >
          {branchList.map((location) => (
            <option key={location.slug} value={location.slug}>
              {location.city} — {location.address}
            </option>
          ))}
        </select>
      </div>

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
              {service.name} — USD {service.price} ({service.durationMinutes} min)
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
          {stylistOptions.map((stylist) => (
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
          <TimeSlotDropdown
            value={bookingTime}
            onChange={setBookingTime}
            slots={availableSlots}
            loading={availLoading}
          />
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
          <>CONFIRM APPOINTMENT (USD {currentService.price})</>
        )}
      </button>
    </form>
  );
};