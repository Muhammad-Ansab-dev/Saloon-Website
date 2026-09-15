'use client';
// Hero — homepage hero: one fullscreen background image that changes
// based on which overlay box is hovered. Four boxes in a row, each with a
// small accent line and a larger heading at the bottom-left.
// Rendered by HomePage.

import React, { useEffect, useState } from 'react';
import '../../experience/heroSlider.css';

const BOXES = [
  {
    accent: 'Warm & Cozy',
    title: 'Rejuvenate Your Body & Mind',
    description:
      'Step into a warm, welcoming space designed to help you unwind, recharge, and leave feeling brand new.',
    image: '/images/hero-1.webp',
  },
  {
    accent: 'Fresh & Floral',
    title: 'Blossom Into Your Best Self',
    description:
      'Fresh floral tones and soft textures that bring out your natural radiance, season after season.',
    image: '/images/hair-hero2.webp',
  },
  {
    accent: 'Bold & Bright',
    title: 'Stand Out With Style',
    description:
      'Confident, statement looks crafted by our stylists — so every entrance feels like your moment.',
    image: '/images/hair-hero3.webp',
  },
  {
    accent: 'Soft & Serene',
    title: 'Where Calm Meets Beauty',
    description:
      'A serene escape where gentle care meets expert artistry, giving you calm and beauty in one visit.',
    image: '/images/lookbook-3.webp',
  },
];

export const Hero: React.FC = () => {
  const [loaded, setLoaded] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setLoaded(true);
  }, []);

  return (
    <section className={`vfx-hero${loaded ? ' loaded' : ''}`}>
      {/* Stacked backgrounds — the hovered one fades in */}
      <div className="vfx-hero-backgrounds">
        {BOXES.map((box, index) => (
          <div
            key={box.accent}
            className={`vfx-hero-background${index === activeIndex ? ' active' : ''}`}
            style={{ backgroundImage: `url(${box.image})` }}
          />
        ))}
      </div>
      <div className="vfx-boxes">
        {BOXES.map((box, index) => (
          <div
            key={box.accent}
            className="vfx-box"
            onMouseEnter={() => setActiveIndex(index)}
          >
            <div className="vfx-box-outer">
              <div className="vfx-box-text-container">
                <div className="vfx-box-text">
                  <span className="vfx-box-accent">{box.accent}</span>
                  <span className="vfx-box-title">{box.title}</span>
                  <span className="vfx-box-description">{box.description}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};