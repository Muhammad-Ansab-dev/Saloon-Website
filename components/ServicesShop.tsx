'use client';
// ServicesShop — Filterable card-grid service menu with category chip filters
// (All, Cut, Colour, Treatment…). Each card shows the service image, name,
// duration, and price, linking to a detail page (/services/[id]). GSAP animates
// card visibility on filter changes. Rendered on the /services page as the main
// browsable service catalog.
import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { SERVICES, SERVICE_MEDIA } from '@/data/salonData';
import { ServiceItem } from '@/types';
import '../experience/servicesShop.css';

interface ShopItem {
  service: ServiceItem;
  image: string;
  alt: string;
}

const ITEMS: ShopItem[] = SERVICES.map((service) => ({
  service,
  image: SERVICE_MEDIA[service.id]?.image ?? '/images/hero-1.jpg',
  alt: SERVICE_MEDIA[service.id]?.alt ?? service.name,
}));

const CATEGORIES = ['All', ...Array.from(new Set(ITEMS.map((item) => item.service.category)))];

export const ServicesShop: React.FC = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const cards = root.querySelectorAll<HTMLElement>('.svx-card');
    cards.forEach((card) => {
      const category = card.dataset.svxCategory ?? '';
      const shouldShow = activeCategory === 'All' || category === activeCategory;
      const hidden = card.classList.contains('svx-hide');

      gsap.killTweensOf(card);

      if (shouldShow && hidden) {
        card.classList.remove('svx-hide');
        gsap.fromTo(
          card,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out' }
        );
      } else if (!shouldShow && !hidden) {
        card.classList.add('svx-hide');
      }
    });
  }, [activeCategory]);

  return (
    <div ref={rootRef} className="svx-root">
      <div className="svx-head">
        <span className="svx-kicker">Paul Hair Studio · Menu & Prices</span>
        <h1 className="svx-title">Services</h1>
      </div>

      <div className="svx-row">
        <p className="svx-sub">
          Every service is performed by a senior stylist. Choose a treatment to preview the
          ritual, the duration and the price.
        </p>
        <div className="svx-filters">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              className={`svx-chip ${activeCategory === category ? 'svx-active' : ''}`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="svx-grid">
        {ITEMS.map((item) => (
          <article
            key={item.service.id}
            className="svx-card"
            data-svx-category={item.service.category}
          >
            <Link href={`/services/${item.service.id}`} className="svx-card-link">
              <div className="svx-card-media">
                <img src={item.image} alt={item.alt} loading="lazy" />
                <span className="svx-card-tag" aria-hidden="true">
                  +
                </span>
              </div>
              <div className="svx-card-body">
                <div className="svx-card-body-left">
                  <h3 className="svx-card-name">{item.service.name}</h3>
                  <span className="svx-card-cat">
                    {item.service.category} · {item.service.durationMinutes} min
                  </span>
                </div>
                <span className="svx-card-price">CHF {item.service.price}</span>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
};