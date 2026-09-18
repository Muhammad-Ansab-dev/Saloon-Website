'use client';
// Hero — homepage hero: one fullscreen background image that changes
// based on which overlay box is hovered. Four boxes in a row, each with a
// small accent line and a larger heading at the bottom-left.
// Slide copy (accent / title / description) is editable by the admin from
// the Content dashboard tab (site_texts) with the static HERO_SLIDES as
// fallback; images come from the Media tab's hero image slots.
// Rendered by HomePage.

import React from 'react';
import '../../experience/heroSlider.css';
import { useSiteContent } from '@/hooks/useSiteContent';
import { HERO_SLIDES, SITE_TEXT_DEFAULTS } from '@/data/salonData';

export const Hero: React.FC = () => {
  const { images, texts } = useSiteContent();
  const [activeIndex, setActiveIndex] = React.useState(0);

  return (
    <section className="vfx-hero">
      {/* Stacked backgrounds — the hovered one fades in */}
      <div className="vfx-hero-backgrounds">
        {HERO_SLIDES.map((box, index) => (
          <div
            key={`hero-bg-${index}`}
            className={`vfx-hero-background${index === activeIndex ? ' active' : ''}`}
            style={{ backgroundImage: `url(${images[`hero.${index + 1}`] ?? box.image})` }}
          />
        ))}
      </div>
      <div className="vfx-boxes">
        {HERO_SLIDES.map((box, index) => {
          const n = index + 1;
          const accent = texts[`hero.${n}.accent`] ?? SITE_TEXT_DEFAULTS[`hero.${n}.accent`] ?? box.accent;
          const title = texts[`hero.${n}.title`] ?? SITE_TEXT_DEFAULTS[`hero.${n}.title`] ?? box.title;
          const description =
            texts[`hero.${n}.description`] ?? SITE_TEXT_DEFAULTS[`hero.${n}.description`] ?? box.description;
          return (
            <div
              key={`hero-box-${n}`}
              className="vfx-box"
              onMouseEnter={() => setActiveIndex(index)}
            >
              <div className="vfx-box-outer">
                <div className="vfx-box-text-container">
                  <div className="vfx-box-text">
                    <span className="vfx-box-accent">{accent}</span>
                    <span className="vfx-box-title">{title}</span>
                    <span className="vfx-box-description">{description}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};