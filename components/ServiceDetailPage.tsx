'use client';
// ServiceDetailPage — Full detail view for a single service: hero image, description, price, duration.
// Services workflow step 3: individual service page (e.g. /services/womens-cut-classic).
// Rendered by: app/services/[id]/page.tsx when the URL param matches a known service ID.
// Offers a "Book This Service" button that triggers the booking modal via the parent callback.
import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { SERVICES, SERVICE_MEDIA } from '@/data/salonData';
import { ServiceItem } from '@/types';
import '../experience/svcDetail.css';

interface ServiceDetailPageProps {
  serviceId: string;
  onSelectServiceForBooking?: (service: ServiceItem) => void;
}

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

export const ServiceDetailPage: React.FC<ServiceDetailPageProps> = ({
  serviceId,
  onSelectServiceForBooking,
}) => {
  const service = SERVICES.find((s) => s.id === serviceId);

  if (!service) {
    return (
      <div className="svc-not-found">
        <h1>Service not found</h1>
        <Link href="/services">Back to services</Link>
      </div>
    );
  }

  const image = SERVICE_MEDIA[service.id]?.image ?? '/images/hero-1.jpg';
  const alt = SERVICE_MEDIA[service.id]?.alt ?? service.name;

  return (
    <div className="svc-detail">
      <motion.div
        className="svc-media"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <img src={image} alt={alt} />
      </motion.div>
      <div className="svc-content">
        <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="svc-back-wrap">
          <Link href="/services" className="svc-back">
            ← All services
          </Link>
        </motion.div>
        <motion.span
          {...fadeUp}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="svc-kicker"
        >
          {service.category}
        </motion.span>
        <motion.h1
          {...fadeUp}
          transition={{ duration: 0.6, delay: 0.16 }}
          className="svc-name"
        >
          {service.name}
        </motion.h1>
        <motion.p
          {...fadeUp}
          transition={{ duration: 0.6, delay: 0.26 }}
          className="svc-desc"
        >
          {service.description}
        </motion.p>
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.6, delay: 0.36 }}
          className="svc-meta"
        >
          <span className="svc-price">CHF {service.price}</span>
          <span className="svc-duration">{service.durationMinutes} min</span>
        </motion.div>
        <motion.div {...fadeUp} transition={{ duration: 0.6, delay: 0.46 }}>
          <button
            type="button"
            className="svc-book"
            onClick={() => onSelectServiceForBooking?.(service)}
          >
            Book This Service →
          </button>
        </motion.div>
      </div>
    </div>
  );
};