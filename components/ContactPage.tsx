'use client';
// ContactPage — Full-page contact view with studio location cards (address,
// email, phone, hours, Google Maps link) on the left and a message form (name,
// email, subject, textarea) on the right. Uses ScrollReveal/SpringReveal for
// staggered entrance animations. Form submission shows a confirmation screen.
// Rendered by the /contact route.
import React, { useState } from 'react';
import { LOCATIONS } from '@/data/salonData';
import { ExternalLink, Mail, MapPin, Phone, Clock, Check } from 'lucide-react';
import { ScrollReveal, SpringReveal } from './ScrollReveal';

export const ContactPage: React.FC = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#f7f5ee]">
      {/* ── Page header ─────────────────────────────────────── */}
      <div className="px-6 sm:px-8 md:px-12 pt-32 sm:pt-40 pb-12 sm:pb-16 bg-[#f7f5ee]">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[11px] sm:text-xs tracking-[0.3em] uppercase text-neutral-500 mb-4">
            Paul Hair Studio
          </p>
          <h1 className="font-editorial text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight leading-none text-black">
            Contact
          </h1>
          <p className="mt-5 text-sm sm:text-base text-neutral-600 leading-relaxed max-w-xl mx-auto">
            Questions, bookings or collaborations — write to us and a stylist will get back
            within one business day.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* ── Left: Studios ────────────────────────────────── */}
          <div className="lg:col-span-6 space-y-8">
            {LOCATIONS.map((loc, idx) => (
              <SpringReveal
                key={loc.city}
                direction="left"
                distance={40}
                delay={idx * 0.12}
                easing="spring"
              >
                <div className="border border-neutral-300 bg-white p-7 sm:p-8">
                  <h2 className="font-editorial text-lg sm:text-xl font-black uppercase tracking-[0.15em] text-black border-b border-black/20 pb-3 inline-block">
                    {loc.city}
                  </h2>
                  <ul className="mt-5 space-y-3 text-sm text-neutral-700">
                    <li className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 mt-0.5 text-neutral-500 flex-shrink-0" />
                      <span>{loc.address}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Mail className="w-4 h-4 mt-0.5 text-neutral-500 flex-shrink-0" />
                      <a
                        href={`mailto:${loc.email}`}
                        className="hover:text-black hover:underline underline-offset-4 transition-colors"
                      >
                        {loc.email}
                      </a>
                    </li>
                    <li className="flex items-start gap-3">
                      <Phone className="w-4 h-4 mt-0.5 text-neutral-500 flex-shrink-0" />
                      <a
                        href={`tel:${loc.telephone.replace(/\s+/g, '')}`}
                        className="hover:text-black hover:underline underline-offset-4 transition-colors"
                      >
                        {loc.telephone}
                      </a>
                    </li>
                    <li className="flex items-start gap-3">
                      <Clock className="w-4 h-4 mt-0.5 text-neutral-500 flex-shrink-0" />
                      <span>{loc.hours}</span>
                    </li>
                  </ul>
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(`${loc.address}, ${loc.city}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.2em] text-black hover:opacity-70 uppercase"
                  >
                    GET DIRECTIONS <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </SpringReveal>
            ))}
          </div>

          {/* ── Right: Contact form ──────────────────────────── */}
          <ScrollReveal direction="right" distance={40} className="lg:col-span-6">
            <div className="border border-neutral-300 bg-white p-7 sm:p-9">
              <h2 className="font-editorial text-lg sm:text-xl font-black uppercase tracking-[0.15em] text-black border-b border-black/20 pb-3 inline-block">
                Send a Message
              </h2>

              {submitted ? (
                <div className="mt-8 flex flex-col items-center gap-4 py-10 text-center">
                  <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-black text-white">
                    <Check className="w-6 h-6" />
                  </span>
                  <p className="font-editorial text-xl font-bold uppercase text-black">
                    Message sent
                  </p>
                  <p className="text-sm text-neutral-600 max-w-sm">
                    Thank you, {form.name || 'friend'}. We will reply to you at{' '}
                    <span className="text-black font-semibold">{form.email}</span> shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <label className="block">
                      <span className="block text-[11px] tracking-[0.2em] uppercase text-neutral-500 mb-2">
                        Name
                      </span>
                      <input
                        name="name"
                        required
                        value={form.name}
                        onChange={handleChange}
                        placeholder="Your name"
                        className="w-full border border-neutral-300 px-4 py-3 text-sm text-black outline-none placeholder:text-neutral-400 focus:border-black transition-colors"
                      />
                    </label>
                    <label className="block">
                      <span className="block text-[11px] tracking-[0.2em] uppercase text-neutral-500 mb-2">
                        Email
                      </span>
                      <input
                        name="email"
                        type="email"
                        required
                        value={form.email}
                        onChange={handleChange}
                        placeholder="you@email.com"
                        className="w-full border border-neutral-300 px-4 py-3 text-sm text-black outline-none placeholder:text-neutral-400 focus:border-black transition-colors"
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="block text-[11px] tracking-[0.2em] uppercase text-neutral-500 mb-2">
                      Subject
                    </span>
                    <select
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      required
                      className="w-full border border-neutral-300 px-4 py-3 text-sm text-black bg-white outline-none focus:border-black transition-colors"
                    >
                      <option value="" disabled>
                        Choose a subject…
                      </option>
                      <option>General enquiry</option>
                      <option>Book an appointment</option>
                      <option>Gift card & vouchers</option>
                      <option>Collaboration / press</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="block text-[11px] tracking-[0.2em] uppercase text-neutral-500 mb-2">
                      Message
                    </span>
                    <textarea
                      name="message"
                      required
                      rows={5}
                      value={form.message}
                      onChange={handleChange}
                      placeholder="How can we help?"
                      className="w-full border border-neutral-300 px-4 py-3 text-sm text-black outline-none placeholder:text-neutral-400 focus:border-black transition-colors resize-none"
                    />
                  </label>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-black text-white text-xs font-bold tracking-[0.25em] uppercase hover:bg-neutral-800 transition-colors shadow-sm"
                  >
                    Send message →
                  </button>
                </form>
              )}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
};