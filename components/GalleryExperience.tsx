'use client';
// GalleryExperience — Immersive horizontal-scroll gallery powered by GSAP Flip,
// SplitText, and Lenis smooth scrolling. Displays 8 hero hairstyle images in a
// horizontally-scrollable strip; clicking an image zooms into a full detail view
// with animated text reveals (title, description labels). Clicking again closes
// the detail and returns to the horizontal grid. Rendered on the home page as a
// showpiece browsing experience.
import React, { useRef, useEffect } from 'react';
import imagesLoaded from 'imagesloaded';
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import '../experience/horizontal.css';

gsap.registerPlugin(Flip, SplitText);

interface GalleryItem {
  id: string;
  image: string;
  alt: string;
  wordTop: string;
  wordBottom: string;
  labelLeft: string;
  textLeft: string;
  labelRight: string;
  textRight: string;
}

const ITEMS: GalleryItem[] = [
  {
    id: 'g-1',
    image: '/images/hero-1.jpg',
    alt: 'Master stylist cutting textured hair',
    wordTop: 'Master',
    wordBottom: 'Cut',
    labelLeft: 'The Signature',
    textLeft:
      'Bespoke scissor work, shaped around bone structure and how the hair falls first thing in the morning.',
    labelRight: 'Hold',
    textRight:
      'Texture kept with tension, not product — a cut that dresses down as easily as it cleans up.',
  },
  {
    id: 'g-2',
    image: '/images/instagram-3.jpg',
    alt: 'Sleek graphic bob on female model',
    wordTop: 'Graphic',
    wordBottom: 'Bob',
    labelLeft: 'The Focus',
    textLeft:
      'A razor-sharp perimeter cut on a deep, saturated base. Wiped clean and worn with nothing but styling.',
    labelRight: 'Edge',
    textRight:
      'High-contrast weightline with a clean neck. Geometry over softness, precision over noise.',
  },
  {
    id: 'g-3',
    image: '/images/lookbook-2.jpg',
    alt: 'Elegant blonde twist with gold ornament',
    wordTop: 'Golden',
    wordBottom: 'Twist',
    labelLeft: 'The Ornament',
    textLeft:
      'Elegant blonde draping finished with a gold clasp — for occasions that ask for ceremony.',
    labelRight: 'Finish',
    textRight:
      'A meticulous seat of curls and a jewel detail. The bridal lookbook, page one.',
  },
  {
    id: 'g-4',
    image: '/images/instagram-4.jpg',
    alt: 'Honey gloss highlights with beach waves',
    wordTop: 'Honey',
    wordBottom: 'Gloss',
    labelLeft: 'The Gloss',
    textLeft:
      'Hand-painted balayage warmed with a honey glaze for movement under any light.',
    labelRight: 'Shine',
    textRight:
      'Beach waves and a mirror finish — lived-in colour with a salon polish.',
  },
  {
    id: 'g-5',
    image: '/images/hair-hero1.webp',
    alt: 'Stylist blow drying voluminous curls',
    wordTop: 'Volume',
    wordBottom: 'Air',
    labelLeft: 'The Blowout',
    textLeft:
      'Round-brush lift from the root, leaving a full, rounded crown that holds all day.',
    labelRight: 'Motion',
    textRight: 'Curls broken down to a soft bend. Big hair, quiet elegance.',
  },
  {
    id: 'g-6',
    image: '/images/instagram-1.jpg',
    alt: 'Precision scissor work on textured male crop',
    wordTop: 'Textured',
    wordBottom: 'Crop',
    labelLeft: 'The Taper',
    textLeft:
      'Disconnected crop with a razor finish, tuned to the grain of the hair.',
    labelRight: 'Fade',
    textRight:
      'Skin-tight blending under an airy top — sharp by design, lived-in by intent.',
  },
  {
    id: 'g-7',
    image: '/images/press-3.jpg',
    alt: 'High fashion editorial hairstyle with motion',
    wordTop: 'Editorial',
    wordBottom: 'Drama',
    labelLeft: 'The Campaign',
    textLeft:
      'Sculpted, windswept and weightless — built for the flash and the long plate.',
    labelRight: 'Form',
    textRight: 'The silhouette that owns the frame, frozen at the crest of movement.',
  },
  {
    id: 'g-8',
    image: '/images/lookbook-1.jpg',
    alt: 'Editorial hairstyle from the Paul lookbook',
    wordTop: 'Studio',
    wordBottom: 'Light',
    labelLeft: 'The Lookbook',
    textLeft:
      'Clean studio light and a considered shape — the haircut as stillness.',
    labelRight: 'Final',
    textRight: 'The quiet end of the book. Confidence, delivered at full shutter.',
  },
];

interface SplitBundle {
  titleTop: SplitText;
  titleBottom: SplitText;
  lines: Element[];
}

function wrapAll(elements: readonly Element[], className: string) {
  elements.forEach((el) => {
    const wrapper = document.createElement('div');
    wrapper.className = className;
    el.parentNode?.insertBefore(wrapper, el);
    wrapper.appendChild(el);
  });
}

function ensureSplit(content: HTMLElement): SplitBundle {
  const titleTopEl = content.querySelector<HTMLElement>('[data-content="text-top"] > div');
  const titleBottomEl = content.querySelector<HTMLElement>('[data-content="text-bottom"] > div');
  const textEls = [
    ...content.querySelectorAll<HTMLElement>('[data-content="text-left"] > div'),
    ...content.querySelectorAll<HTMLElement>('[data-content="text-right"] > div'),
  ];

  const titleTop = new SplitText(titleTopEl as Element, { type: 'chars' });
  const titleBottom = new SplitText(titleBottomEl as Element, { type: 'chars' });

  wrapAll(titleTop.chars ?? [], 'hx-char-wrap');
  wrapAll(titleBottom.chars ?? [], 'hx-char-wrap');

  const textSplits = textEls.map((el) => new SplitText(el as Element, { type: 'lines' }));

  const lines: Element[] = [];
  textSplits.forEach((split) => {
    (split.lines ?? []).forEach((line) => lines.push(line));
  });
  wrapAll(lines, 'hx-line-wrap');

  return { titleTop, titleBottom, lines };
}

export const GalleryExperience: React.FC = () => {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const scrollWrapper = root.querySelector<HTMLElement>('[data-scroll="wrapper"]')!;
    const scrollContent = scrollWrapper.querySelector<HTMLElement>('[data-scroll="content"]')!;
    const sectionContent = root.querySelector<HTMLElement>('[data-content="section"]')!;
    const galleryImagesWrapper = gsap.utils.toArray<HTMLElement>(
      '[data-gallery="image-wrapper"]'
    );
    const galleryImages = gsap.utils.toArray<HTMLElement>('[data-gallery="image"]');
    const contents = gsap.utils.toArray<HTMLElement>('[data-content="details"]');
    const contentWrappers = gsap.utils.toArray<HTMLElement>('[data-content="details-wrapper"]');
    const cursor = root.querySelector<HTMLElement>('[data-cursor="container"]')!;

    let lenis: Lenis | null = null;
    let rafId = 0;
    let cursorX = 0;
    let cursorY = 0;
    let targetX = 0;
    let targetY = 0;
    let isAnimating = false;
    let currentOpenIndex: number | null = null;
    let currentTween: gsap.core.Timeline | null = null;
    let cancelled = false;
    const listOfSplits: (SplitBundle | null)[] = [];

    const updateCursor = () => {
      cursorX += (targetX - cursorX) * 0.15;
      cursorY += (targetY - cursorY) * 0.15;
      cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
      rafId = requestAnimationFrame(updateCursor);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const bounds = cursor.getBoundingClientRect();
      targetX = e.clientX - (bounds.width * 3) / 4;
      targetY = e.clientY - (bounds.height * 3) / 4;
      if (!rafId) {
        rafId = requestAnimationFrame(updateCursor);
      }
    };

    const openContent = (index: number) => {
      if (isAnimating || currentOpenIndex !== null) return;
      isAnimating = true;
      currentOpenIndex = index;

      contents[index].classList.remove('hx-is-hidden');
      const currentWrapper = contentWrappers[index];
      const splits = listOfSplits[index];
      if (!splits) {
        isAnimating = false;
        currentOpenIndex = null;
        return;
      }

      currentTween = gsap.timeline({
        duration: 1.25,
        ease: 'power4.inOut',
        onStart: () => {
          sectionContent.classList.remove('hx-is-hidden');
          (splits.titleTop.chars ?? []).forEach((char) => {
            (char as HTMLElement).style.willChange = 'transform, clip-path';
          });
        },
        onComplete: () => {
          isAnimating = false;
          lenis?.stop();
          scrollWrapper.classList.add('hx-is-hidden');
          cursor.classList.add('is-open');
          currentTween = null;
          (splits.titleTop.chars ?? []).forEach((char) => {
            (char as HTMLElement).style.willChange = 'auto';
          });
        },
      });

      currentTween
        .addLabel('start', 0)
        .add(
          () => {
            const flipState = Flip.getState(galleryImages[index]);
            currentWrapper.appendChild(galleryImages[index]);
            Flip.from(flipState, {
              duration: 1.25,
              ease: 'power4.inOut',
              absolute: true,
            });
          },
          'start'
        )
        .to(
          galleryImagesWrapper.filter((img, i) => i !== index),
          { clipPath: 'inset(100% 0 0 0)', duration: 0.75, ease: 'power3.inOut' },
          0
        )
        .fromTo(
          splits.titleTop.elements,
          { xPercent: 15 },
          { xPercent: 0, duration: 1, ease: 'power3.out' },
          'start+=1.25'
        )
        .fromTo(
          [...(splits.titleTop.chars ?? []), ...(splits.titleBottom.chars ?? [])],
          { clipPath: 'inset(0 100% 0 0)', xPercent: 10 },
          { clipPath: 'inset(0 0% 0 0)', xPercent: 0, duration: 0.75, ease: 'power3.out' },
          'start+=1.25'
        )
        .fromTo(
          splits.lines,
          { yPercent: 100, opacity: 0 },
          { yPercent: 0, opacity: 1, stagger: 0.025 },
          'start+=1.2'
        );
    };

const hideContent = (index: number) => {
      if (currentOpenIndex !== index) return;

      currentTween?.kill();
      currentTween = null;
      isAnimating = true;

      const currentWrapper = contentWrappers[index];
      const splits = listOfSplits[index];
      if (!splits) {
        isAnimating = false;
        return;
      }

      lenis?.start();
      scrollWrapper.classList.remove('hx-is-hidden');

      currentTween = gsap.timeline({
        duration: 1.25,
        ease: 'power4.inOut',
        onComplete: () => {
          isAnimating = false;
          currentOpenIndex = null;
          currentTween = null;
          cursor.classList.remove('is-open');
          sectionContent.classList.add('hx-is-hidden');
          contents[index].classList.add('hx-is-hidden');
        },
      });

      currentTween
        .addLabel('start', 0)
        .fromTo(
          [...splits.titleTop.elements, ...splits.titleBottom.elements],
          { xPercent: 0 },
          { xPercent: 10, ease: 'power3.out', duration: 1 },
          'start'
        )
        .fromTo(
          [...(splits.titleTop.chars ?? []), ...(splits.titleBottom.chars ?? [])],
          { clipPath: 'inset(0 0% 0 0)', xPercent: 0 },
          { clipPath: 'inset(0 100% 0 0)', xPercent: 10, ease: 'power3.out', duration: 0.75 },
          'start'
        )
        .to(splits.lines, { yPercent: 100, stagger: 0.025, duration: 0.75 }, 'start')
        .add(
          () => {
            sectionContent.classList.add('hx-is-hidden');
            const contentImage = currentWrapper.querySelector<HTMLElement>('[data-gallery="image"]');
            if (!contentImage) return;
            const flipState = Flip.getState(contentImage);
            galleryImagesWrapper[index].appendChild(contentImage);
            Flip.from(flipState, {
              duration: 1.25,
              ease: 'power3.inOut',
              absolute: true,
            });
          },
          'start+=0.25'
        )
        .to(
          galleryImagesWrapper.filter((img, i) => i !== index),
          { clipPath: 'inset(0% 0 0 0)' }
        )
        .set(galleryImagesWrapper, { clipPath: 'none' });
    };

    const init = () => {
      listOfSplits.length = 0;
      contents.forEach((content, index) => {
        listOfSplits[index] = ensureSplit(content);
      });

      lenis = new Lenis({
        autoRaf: true,
        wrapper: scrollWrapper,
        content: scrollContent,
        orientation: 'horizontal',
        lerp: 0.05,
        wheelMultiplier: 0.85,
        touchMultiplier: 2,
      });

      window.addEventListener('mousemove', handleMouseMove);

      galleryImagesWrapper.forEach((img, index) => {
        img.setAttribute('tabindex', '0');
        img.setAttribute('role', 'button');

        const open = () => {
          if (currentOpenIndex === null) openContent(index);
        };
        img.addEventListener('click', open);
        const onTouchStart = (e: TouchEvent) => {
          if (e.touches.length === 1) open();
        };
        img.addEventListener('touchstart', onTouchStart);
        img.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            open();
          }
        });
        img.addEventListener('mouseenter', () => cursor.classList.add('is-visible'));
        img.addEventListener('mouseleave', () => cursor.classList.remove('is-visible'));
      });

      contentWrappers.forEach((content, index) => {
        const close = () => {
          if (currentOpenIndex === index) hideContent(index);
        };
        content.addEventListener('click', close);
        content.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            close();
          }
        });
        content.addEventListener('mouseenter', () => cursor.classList.add('is-visible'));
        content.addEventListener('mouseleave', () => cursor.classList.remove('is-visible'));
      });

      const escHandler = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && currentOpenIndex !== null) hideContent(currentOpenIndex);
      };
      document.addEventListener('keydown', escHandler);
      (root as HTMLElement & { __escHandler?: (e: KeyboardEvent) => void }).__escHandler =
        escHandler;
    };

    const onLoaded = () => {
      if (cancelled) return;
      init();
    };

    const imgs = root.querySelectorAll('img');
    if (imgs.length === 0) {
      onLoaded();
    } else {
      imagesLoaded(imgs, onLoaded);
    }

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', handleMouseMove);
      const esc = (root as HTMLElement & { __escHandler?: (e: KeyboardEvent) => void })
        .__escHandler;
      if (esc) document.removeEventListener('keydown', esc);
      currentTween?.kill();
      galleryImagesWrapper.forEach((img) => {
        img.removeAttribute('tabindex');
        img.removeAttribute('role');
      });
      lenis?.destroy();
    };
  }, []);

  return (
    <div ref={rootRef} className="hx-root">
      <div className="hx-cursor" data-cursor="container" aria-hidden="true">
        <div className="hx-cross-button" />
      </div>

      <div className="hx-scroll-wrapper" data-scroll="wrapper">
        <section className="hx-scroll-content" data-scroll="content">
          <div className="hx-gallery">
            {ITEMS.map((item) => (
              <div className="hx-gallery-image" data-gallery="image-wrapper" key={item.id}>
                <div className="hx-image-container" data-gallery="image">
                  <img src={item.image} alt={item.alt} loading="eager" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="hx-section-content hx-is-hidden" data-content="section">
        {ITEMS.map((item) => (
          <div className="hx-content hx-is-hidden" data-content="details" key={item.id}>
            <div className="hx-content-wrapper" data-content="details-wrapper">
              <div className="hx-content-title-top" data-content="text-top">
                <div className="hx-title-big">{item.wordTop}</div>
              </div>
              <div className="hx-content-title-bottom" data-content="text-bottom">
                <div className="hx-title-big">{item.wordBottom}</div>
              </div>
              <div className="hx-content-text-left" data-content="text-left">
                <div className="hx-title-small">{item.labelLeft}</div>
                <div className="hx-paragraph">{item.textLeft}</div>
              </div>
              <div className="hx-content-text-right" data-content="text-right">
                <div className="hx-title-small">{item.labelRight}</div>
                <div className="hx-paragraph">{item.textRight}</div>
              </div>
              <div className="hx-image-container" data-content="image" />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};