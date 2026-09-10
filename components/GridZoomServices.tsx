'use client';
// GridZoomServices — Codrops-style grid-zoom interaction for browsing salon
// services. A 3×4 image grid zooms the clicked cell to the right side of the
// viewport while fading siblings, revealing service details (name, duration,
// price, category) with animated text transitions. A mini-grid navigation lets
// users cycle between services. Escape or the back arrow returns to the grid.
// Rendered on the /services page; calls onSelectService to pass the chosen
// service back to the parent for booking.
import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import SplitType from 'split-type';
import { SERVICES } from '@/data/salonData';
import { ServiceItem } from '@/types';
import '../experience/gridZoom.css';

interface GridZoomServicesProps {
  onSelectService: (service: ServiceItem) => void;
}

interface CellDef {
  id: string;
  gridClass: string;
  miniClass: string;
}

/* 3 rows x 4 columns of image cells, faithfully matching the Codrops grid geometry. */
const CELLS: CellDef[] = [
  { id: 'cell-1', gridClass: 'gz-cc1r1', miniClass: 'gz-cc1r1' },
  { id: 'cell-2', gridClass: 'gz-cc2r1', miniClass: 'gz-cc2r1' },
  { id: 'cell-3', gridClass: 'gz-cc3r1', miniClass: 'gz-cc3r1' },
  { id: 'cell-4', gridClass: 'gz-cc4r1', miniClass: 'gz-cc4r1' },
  { id: 'cell-5', gridClass: 'gz-cc1r2', miniClass: 'gz-cc1r2' },
  { id: 'cell-6', gridClass: 'gz-cc2r2', miniClass: 'gz-cc2r2' },
  { id: 'cell-7', gridClass: 'gz-cc3r2', miniClass: 'gz-cc3r2' },
  { id: 'cell-8', gridClass: 'gz-cc4r2', miniClass: 'gz-cc4r2' },
  { id: 'cell-9', gridClass: 'gz-cc1r3', miniClass: 'gz-cc1r3' },
  { id: 'cell-10', gridClass: 'gz-cc2r3', miniClass: 'gz-cc2r3' },
  { id: 'cell-11', gridClass: 'gz-cc3r3', miniClass: 'gz-cc3r3' },
  { id: 'cell-12', gridClass: 'gz-cc4r3', miniClass: 'gz-cc4r3' },
];

interface MediaDef {
  image: string;
  alt: string;
}

const GRID_MEDIA: Record<string, MediaDef> = {
  'cell-1': { image: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?q=80&w=1440&h=810&auto=format&fit=crop', alt: 'Hair colour treatment' },
  'cell-2': { image: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?q=80&w=1440&h=810&auto=format&fit=crop', alt: 'Barber at work' },
  'cell-3': { image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=1440&h=810&auto=format&fit=crop', alt: 'Stylist cutting hair' },
  'cell-4': { image: 'https://images.unsplash.com/photo-1600948836101-f9ffda59d250?q=80&w=1440&h=810&auto=format&fit=crop', alt: 'Salon styling' },
  'cell-5': { image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=1440&h=810&auto=format&fit=crop', alt: 'Hairdresser at the chair' },
  'cell-6': { image: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=1440&h=810&auto=format&fit=crop', alt: 'Salon chairs' },
  'cell-7': { image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=1440&h=810&auto=format&fit=crop', alt: 'Beauty portrait' },
  'cell-8': { image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=1440&h=810&auto=format&fit=crop', alt: 'Spa and wellness' },
  'cell-9': { image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=1440&h=810&auto=format&fit=crop', alt: 'Beauty treatment' },
  'cell-10': { image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=1440&h=810&auto=format&fit=crop', alt: 'Elegant portrait' },
  'cell-11': { image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1440&h=810&auto=format&fit=crop', alt: 'Gentleman portrait' },
  'cell-12': { image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1440&h=810&auto=format&fit=crop', alt: 'Editorial lifestyle shot' },
};

function mediaFor(id: string): MediaDef {
  return GRID_MEDIA[id] ?? { image: '/images/hero-1.jpg', alt: '' };
}

/* Wrap a set of split lines into overflow-hidden wrappers (faithful to utils.wrapLines). */
function wrapLines(lines: HTMLElement[], wrapType: string, wrapClass: string) {
  lines.forEach((line) => {
    const wrapEl = document.createElement(wrapType);
    wrapEl.classList.add(wrapClass);
    line.parentNode?.appendChild(wrapEl);
    wrapEl.appendChild(line);
  });
}

const calcWinsize = () => ({ width: window.innerWidth, height: window.innerHeight });

/* getBoundingClientRect corrected for an existing CSS transform (faithful port). */
function adjustedBoundingRect(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  const style = getComputedStyle(el);
  const tx = style.transform;
  if (tx && tx !== 'none') {
    let sx, sy, dx, dy;
    if (tx.startsWith('matrix3d(')) {
      const ta = tx.slice(9, -1).split(', ');
      sx = +ta[0];
      sy = +ta[5];
      dx = +ta[12];
      dy = +ta[13];
    } else if (tx.startsWith('matrix(')) {
      const ta = tx.slice(7, -1).split(', ');
      sx = +ta[0];
      sy = +ta[3];
      dx = +ta[4];
      dy = +ta[5];
    } else {
      return rect;
    }
    const to = style.transformOrigin;
    const x = rect.x - dx - (1 - sx) * parseFloat(to);
    const y = rect.y - dy - (1 - sy) * parseFloat(to.slice(to.indexOf(' ') + 1));
    const w = sx ? rect.width / sx : el.offsetWidth;
    const h = sy ? rect.height / sy : el.offsetHeight;
    return {
      x, y, width: w, height: h, top: y, right: x + w, bottom: y + h, left: x,
    } as DOMRect;
  }
  return rect;
}

type TextRevealHandler = { in: () => gsap.core.Timeline; out: () => gsap.core.Timeline };

function makeTextReveal(outerEls: HTMLElement[]): TextRevealHandler {
  const innerEls = outerEls.map((outer) => outer.querySelector<HTMLElement>('.gz-oh__inner')).filter(Boolean) as HTMLElement[];
  let inTimeline: gsap.core.Timeline | null = null;
  let outTimeline: gsap.core.Timeline | null = null;
  return {
    in() {
      outTimeline?.kill();
      inTimeline = gsap
        .timeline({ defaults: { duration: 1.2, ease: 'expo' } })
        .set(innerEls, { y: '120%', rotate: 15 })
        .to(innerEls, { y: '0%', rotate: 0, stagger: 0.03 });
      return inTimeline;
    },
    out() {
      inTimeline?.kill();
      outTimeline = gsap
        .timeline({ defaults: { duration: 0.5, ease: 'expo.in' } })
        .to(innerEls, { y: '-120%', rotate: -5, stagger: 0.03 });
      return outTimeline;
    },
  };
}

function makeTextLinesReveal(animationElems: HTMLElement): TextRevealHandler {
  let splitInstance: SplitType | null = null;
  let lines: HTMLElement[] = [];
  let isVisible = false;

  const split = () => {
    splitInstance = new SplitType(animationElems, { types: 'lines' });
    lines = splitInstance.lines as HTMLElement[];
    wrapLines([...lines], 'div', 'gz-oh');
    lines = [...animationElems.querySelectorAll<HTMLElement>('.gz-line')];
  };
  split();

  const onResize = () => {
    splitInstance?.split({ types: 'lines' });
    const newLines = (splitInstance?.lines ?? []) as HTMLElement[];
    wrapLines([...newLines], 'div', 'gz-oh');
    lines = [...animationElems.querySelectorAll<HTMLElement>('.gz-line')];
    if (!isVisible) {
      gsap.set(lines, { y: '-150%' });
    }
  };

  window.addEventListener('resize', onResize);

  return {
    in() {
      isVisible = true;
      gsap.killTweensOf(lines);
      return gsap
        .timeline({ defaults: { duration: 1.2, ease: 'expo' } })
        .set(lines, { y: '150%', rotate: 15 })
        .to(lines, { y: '0%', rotate: 0, stagger: 0.04 });
    },
    out() {
      isVisible = false;
      gsap.killTweensOf(lines);
      return gsap
        .timeline({ defaults: { duration: 0.5, ease: 'expo.in' } })
        .to(lines, { y: '-150%', rotate: -5, stagger: 0.02 });
    },
  };
}

export const GridZoomServices: React.FC<GridZoomServicesProps> = ({ onSelectService }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const onSelectRef = useRef(onSelectService);
  useEffect(() => {
    onSelectRef.current = onSelectService;
  }, [onSelectService]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const bodyEl = document.body;
    let winsize = calcWinsize();
    const onWinResize = () => { winsize = calcWinsize(); };

    const imageCellEls = [...root.querySelectorAll<HTMLElement>('.gz-grid--large .gz-grid__cell-img')];
    const contentEl = root.querySelector<HTMLElement>('.gz-content')!;
    const backCtrl = contentEl.querySelector<HTMLElement>('.gz-back')!;
    const miniGridEl = contentEl.querySelector<HTMLElement>('.gz-grid--mini')!;
    const miniGridCells = [...miniGridEl.querySelectorAll<HTMLElement>('.gz-grid__cell')];
    const gridTexts = [...root.querySelectorAll<HTMLElement>('.gz-grid--large .gz-oh')];

    interface ImgCell {
      el: HTMLElement;
      inner: HTMLElement;
      contentItem: {
        el: HTMLElement;
        textReveal: TextRevealHandler;
        textLinesReveal: TextRevealHandler;
        nav: { prev: HTMLElement; next: HTMLElement };
      };
    }

    const imageCellArr: ImgCell[] = imageCellEls.map((titleEl) => {
      const inner = titleEl.querySelector<HTMLElement>('.gz-grid__cell-img-inner')!;
      const contentId = inner.dataset.item!;
      const contentItemEl = contentEl.querySelector<HTMLElement>(`#${contentId}`)!;
      const outerTexts = [...contentItemEl.querySelectorAll<HTMLElement>('.gz-oh')];
      const textEl = contentItemEl.querySelector<HTMLElement>('.gz-content__item-text')!;
      return {
        el: titleEl,
        inner,
        contentItem: {
          el: contentItemEl,
          textReveal: makeTextReveal(outerTexts),
          textLinesReveal: makeTextLinesReveal(textEl),
          nav: {
            prev: contentItemEl.querySelector<HTMLElement>('.gz-slide-nav__img--prev')!,
            next: contentItemEl.querySelector<HTMLElement>('.gz-slide-nav__img--next')!,
          },
        },
      };
    });

    const gridTextReveal = makeTextReveal(gridTexts);

    /* Preload natural photo dimensions so the zoom shows each image at its original
       proportions — 16:9 landscape and 9:16 portrait stay consistent, no crop. */
    const naturalSizes = new Map<string, { w: number; h: number }>();
    CELLS.forEach((cell) => {
      const probe = new Image();
      probe.onload = () => {
        naturalSizes.set(cell.id, { w: probe.naturalWidth, h: probe.naturalHeight });
      };
      probe.src = GRID_MEDIA[cell.id].image;
    });

    let currentCell = -1;
    let isGridView = true;
    let isAnimating = false;

/* Zoom target — width 54% of the viewport (measured at scale 2.2872 @1184px,
       copying the Codrops GridZoom geometry). Height follows the photo's natural
       aspect ratio (16:9 or 9:16, both consistent); capped so there is a 10%
       viewport margin above and below, and always vertically centered. */
    const calcTransformImage = () => {
      const cellrect = adjustedBoundingRect(imageCellArr[currentCell].el) as DOMRect;
      const natural = naturalSizes.get(CELLS[currentCell].id);
      const aspect = natural ? natural.w / natural.h : 16 / 9;
      const vMargin = winsize.height * 0.1;
      let dw = winsize.width * 0.54 - 100;
      let dh = dw / aspect + 100;
      const maxH = winsize.height - vMargin * 2;
      if (dh > maxH) {
        dh = maxH;
        dw = dh * aspect;
      }
      return {
        scaleX: dw / cellrect.width,
        scaleY: dh / cellrect.height,
        x: winsize.width * 0.65 - (cellrect.left + cellrect.width / 2),
        y: winsize.height * 0.5 - (cellrect.top + cellrect.height / 2),
      };
    };

    const showContent = (image: ImgCell) => {
      const imageTransform = calcTransformImage();
      const otherImageCells = imageCellArr.filter((c) => c.el !== image.el).map((c) => c.el);

      gsap.killTweensOf([image.el, image.inner, otherImageCells]);
      gsap
        .timeline({
          defaults: { duration: 1.2, ease: 'expo.inOut' },
          onStart: () => bodyEl.classList.add('gz-body-oh'),
          onComplete: () => { isAnimating = false; },
        })
        .addLabel('start', 0)
        .add(() => gridTextReveal.out(), 'start')
        .set(contentEl, { pointerEvents: 'none' }, 'start')
        .set(image.el, { zIndex: 100 }, 'start')
        .set([image.el, image.inner, otherImageCells], { willChange: 'transform, opacity' }, 'start')
        .to(image.el, {
          scaleX: imageTransform.scaleX,
          scaleY: imageTransform.scaleY,
          x: imageTransform.x,
          y: imageTransform.y,
          onComplete: () => gsap.set(image.el, { willChange: '' }),
        }, 'start')
        .to(image.inner, {
          scale: 1,
          onComplete: () => gsap.set(image.inner, { willChange: '' }),
        }, 'start')
        .to([image.contentItem.nav.prev, image.contentItem.nav.next], { y: 0 }, 'start')
        .to(otherImageCells, {
          opacity: 0,
          scale: 0.8,
          onComplete: () => gsap.set(otherImageCells, { willChange: '' }),
          stagger: { grid: 'auto', amount: 0.17, from: currentCell },
        }, 'start')
        .addLabel('showContent', 'start+=0.45')
        .to(backCtrl, { ease: 'expo', startAt: { x: '50%' }, x: '0%', opacity: 1 }, 'showContent')
        .set(miniGridEl, { opacity: 1 }, 'showContent')
        .set(miniGridCells, { opacity: 0 }, 'showContent')
        .to(miniGridCells, {
          duration: 1, ease: 'expo', opacity: 1, startAt: { scale: 0.8 }, scale: 1,
          stagger: { grid: 'auto', amount: 0.3, from: currentCell },
        }, 'showContent+=0.2')
        .add(() => {
          image.contentItem.textReveal.in();
          image.contentItem.textLinesReveal.in();
        }, 'showContent')
        .add(() => contentEl.classList.add('gz-content--open'), 'showContent')
        .add(() => image.contentItem.el.classList.add('gz-content__item--current'), 'showContent+=0.02');
    };

    const closeContent = () => {
      const image = imageCellArr[currentCell];
      const otherImageCells = imageCellArr.filter((c) => c.el !== image.el).map((c) => c.el);
      gsap
        .timeline({
          defaults: { duration: 1, ease: 'expo.inOut' },
          onStart: () => bodyEl.classList.remove('gz-body-oh'),
          onComplete: () => { isAnimating = false; },
        })
        .addLabel('start', 0)
        .to(backCtrl, { x: '50%', opacity: 0 }, 'start')
        .to(miniGridCells, {
          duration: 0.5, ease: 'expo.in', opacity: 0, scale: 0.8,
          stagger: { grid: 'auto', amount: 0.1, from: -currentCell },
          onComplete: () => gsap.set(miniGridEl, { opacity: 0 }),
        }, 'start')
        .add(() => {
          image.contentItem.textReveal.out();
          image.contentItem.textLinesReveal.out();
          contentEl.classList.remove('gz-content--open');
        }, 'start')
        .add(() => image.contentItem.el.classList.remove('gz-content__item--current'))
        .addLabel('showGrid', 0)
        .set([image.el, otherImageCells], { willChange: 'transform, opacity' }, 'showGrid')
        .to(image.el, {
          scale: 1, x: 0, y: 0,
          onComplete: () => gsap.set(image.el, { willChange: '', zIndex: 1 }),
        }, 'showGrid')
        .to(image.contentItem.nav.prev, { y: '-100%' }, 'showGrid')
        .to(image.contentItem.nav.next, { y: '100%' }, 'showGrid')
        .to(otherImageCells, {
          opacity: 1,
          scale: 1,
          onComplete: () => {
            gsap.set(otherImageCells, { willChange: '' });
            gsap.set(contentEl, { pointerEvents: 'auto' });
          },
          stagger: { grid: 'auto', amount: 0.17, from: -currentCell },
        }, 'showGrid')
        .add(() => gridTextReveal.in(), 'showGrid+=0.3');
    };

    const changeContent = (position: number) => {
      const image = imageCellArr[currentCell];
      const upcomingImageCell = imageCellArr[position];
      miniGridCells[currentCell].classList.remove('gz-grid__cell--current');
      currentCell = position;
      miniGridCells[currentCell].classList.add('gz-grid__cell--current');

      const imageTransform = calcTransformImage();
      gsap
        .timeline({
          defaults: { duration: 1, ease: 'expo.inOut' },
          onComplete: () => { isAnimating = false; },
        })
        .addLabel('start', 0)
        .add(image.contentItem.textReveal.out(), 'start')
        .add(image.contentItem.textLinesReveal.out(), 'start')
        .add(() => image.contentItem.el.classList.remove('gz-content__item--current'))
        .set([image.el, upcomingImageCell.el], { willChange: 'transform, opacity' }, 'start')
        .to(image.el, {
          opacity: 0, scale: 0.8, x: 0, y: 0,
          onComplete: () => gsap.set(image.el, { willChange: '', zIndex: 1 }),
        }, 'start')
        .to(image.contentItem.nav.prev, { y: '-100%' }, 'start')
        .to(image.contentItem.nav.next, { y: '100%' }, 'start')
        .addLabel('showContent', '>-=0.4')
        .set(upcomingImageCell.el, { zIndex: 100 }, 'start')
        .to(upcomingImageCell.el, {
          scaleX: imageTransform.scaleX,
          scaleY: imageTransform.scaleY,
          x: imageTransform.x,
          y: imageTransform.y,
          opacity: 1,
          onComplete: () => gsap.set(upcomingImageCell.el, { willChange: '' }),
        }, 'start')
        .to([upcomingImageCell.contentItem.nav.prev, upcomingImageCell.contentItem.nav.next], {
          ease: 'expo', y: 0,
        }, 'showContent')
        .add(() => {
          upcomingImageCell.contentItem.textReveal.in();
          upcomingImageCell.contentItem.textLinesReveal.in();
        }, 'showContent')
        .add(() => upcomingImageCell.contentItem.el.classList.add('gz-content__item--current'), 'showContent+=0.02');
    };

    const onImageClick = (position: number) => {
      const image = imageCellArr[position];
      if (!isGridView || isAnimating) return;
      isAnimating = true;
      isGridView = false;
      if (currentCell !== -1) miniGridCells[currentCell].classList.remove('gz-grid__cell--current');
      currentCell = position;
      miniGridCells[currentCell].classList.add('gz-grid__cell--current');
      showContent(image);
    };

    const onImageHoverIn = (image: ImgCell) => {
      if (!isGridView) return;
      gsap.killTweensOf([image.el, image.inner]);
      gsap
        .timeline({ defaults: { duration: 2.4, ease: 'expo' } })
        .to(image.el, { scale: 0.95 }, 0)
        .to(image.inner, { scale: 1.4 }, 0);
    };

    const onImageHoverOut = (image: ImgCell) => {
      if (!isGridView) return;
      gsap.killTweensOf([image.el, image.inner]);
      gsap
        .timeline({ defaults: { duration: 2.4, ease: 'expo' } })
        .to([image.el, image.inner], { scale: 1 }, 0);
    };

    imageCellArr.forEach((image, position) => {
      image.el.addEventListener('click', () => onImageClick(position));
      image.el.addEventListener('mouseenter', () => onImageHoverIn(image));
      image.el.addEventListener('mouseleave', () => onImageHoverOut(image));
    });

    backCtrl.addEventListener('click', () => {
      if (isAnimating) return;
      isAnimating = true;
      isGridView = true;
      closeContent();
    });

    miniGridCells.forEach((cell, position) => {
      cell.addEventListener('click', () => {
        if (isAnimating || currentCell === position) return;
        isAnimating = true;
        changeContent(position);
      });
    });

    const onResize = () => {
      winsize = calcWinsize();
      if (isGridView) return;
      const imageTransform = calcTransformImage();
      gsap.set(imageCellArr[currentCell].el, {
        scaleX: imageTransform.scaleX,
        scaleY: imageTransform.scaleY,
        x: imageTransform.x,
        y: imageTransform.y,
      });
    };

    window.addEventListener('resize', onResize);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isGridView && !isAnimating) {
        isAnimating = true;
        isGridView = true;
        closeContent();
      }
    };
    window.addEventListener('keydown', onKeyDown);

    /* Reset grid texts to a visible resting state after the first paint. */
    gsap.set(gridTexts, { y: '0%', rotate: 0 });

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKeyDown);
      bodyEl.classList.remove('gz-body-oh');
      gsap.killTweensOf([...imageCellEls, miniGridCells, [backCtrl]]);
      imageCellArr.forEach((c) => {
        c.contentItem.textReveal.out().kill();
        c.contentItem.textLinesReveal.out().kill();
      });
    };
  }, []);

  return (
    <div ref={rootRef} className="gz-root" style={{ overflow: 'hidden' }}>
      <div className="px-6 sm:px-8 md:px-12 pt-32 sm:pt-40 pb-10 sm:pb-14 bg-[#f7f5ee]">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-[11px] sm:text-xs tracking-[0.3em] uppercase text-neutral-500 mb-4">
            Paul Hair Studio
          </p>
          <h1 className="font-editorial text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight leading-none text-black">
            Our Services
          </h1>
          <p className="mt-5 text-sm sm:text-base text-neutral-600 leading-relaxed max-w-xl mx-auto">
            Handcrafted rituals for hair, scalp and confidence — click any image to explore.
          </p>
          <p className="mt-6 text-[11px] tracking-[0.25em] uppercase text-neutral-500">
            Menu from CHF 29 &nbsp;·&nbsp; Zurich · Paris &nbsp;·&nbsp; 12 Studios
          </p>
        </div>
      </div>

      <section
        id="services"
        className="gz-grid gz-grid--large"
        style={{ background: '#f7f5ee', color: '#000', minHeight: '80vh' }}
      >
        {/* Image cells: 3 rows x 4 columns, every square is interactive */}
        {CELLS.map((cell) => {
          const media = mediaFor(cell.id);
          return (
            <div key={cell.id} className={`gz-grid__cell ${cell.gridClass}`}>
              <div className="gz-grid__cell-img">
                <div
                  className="gz-grid__cell-img-inner"
                  data-item={`gz-item-${cell.id}`}
                  style={{ backgroundImage: `url(${media.image})` }}
                  role="button"
                  aria-label={media.alt}
                />
              </div>
            </div>
          );
        })}
      </section>

      {/* ─── Content overlay ─── */}
      <div className="gz-content">
        {CELLS.map((cell, idx) => {
          const service = SERVICES[idx % SERVICES.length];
          const media = mediaFor(cell.id);
          const prev = CELLS[(idx - 1 + CELLS.length) % CELLS.length];
          const next = CELLS[(idx + 1) % CELLS.length];
          return (
            <div key={cell.id} className="gz-content__item" id={`gz-item-${cell.id}`}>
              <span className="gz-content__item-number gz-oh">
                <span className="gz-oh__inner">{String(idx + 1).padStart(2, '0')}</span>
              </span>
              <h2 className="gz-content__item-heading gz-oh">
                <span className="gz-oh__inner">{service.name}</span>
              </h2>
              <p className="gz-content__item-text">{service.description}</p>
              <div className="gz-content__item-meta">
                <div>
                  <span>Duration</span>
                  <strong>{service.durationMinutes} min</strong>
                </div>
                <div>
                  <span>Price</span>
                  <strong>CHF {service.price}</strong>
                </div>
                <div>
                  <span>Category</span>
                  <strong>{service.category}</strong>
                </div>
              </div>
              <button
                type="button"
                className="gz-content__item-link"
                onClick={() => {
                  onSelectService(service);
                }}
              >
                Request this service <span aria-hidden="true">→</span>
              </button>

              <nav className="gz-slide-nav" aria-hidden="true">
                <div
                  className="gz-slide-nav__img gz-slide-nav__img--prev"
                  style={{ backgroundImage: `url(${mediaFor(prev.id).image})` }}
                />
                <div
                  className="gz-slide-nav__img gz-slide-nav__img--next"
                  style={{ backgroundImage: `url(${mediaFor(next.id).image})` }}
                />
              </nav>
            </div>
          );
        })}

        <div className="gz-content__footer">
          <button className="gz-back" aria-label="Back to services grid">
            <svg viewBox="0 0 50 9" width="100%">
              <path d="M0 4.5l5-3M0 4.5l5 3M50 4.5h-77" />
            </svg>
          </button>
          <nav className="gz-grid gz-grid--mini">
            {CELLS.map((cell) => {
              const media = mediaFor(cell.id);
              return (
                <div key={cell.id} className={`gz-grid__cell ${cell.miniClass}`}>
                  <div className="gz-grid__cell-img">
                    <div
                      className="gz-grid__cell-img-inner"
                      style={{ backgroundImage: `url(${media.image})` }}
                    />
                  </div>
                </div>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
};