/**
 * Home page interactions. Does nothing on other pages.
 *
 *  - hero: words rise in, then the headline drifts up as you scroll away
 *  - logo strip: endless slide, pushed along by page scroll, slows on hover,
 *    pause button
 *  - featured cards (computer): all shut at rest; hover / focus opens one.
 *    It widens in place (the others narrow); its text fades out, re-flows
 *    onto longer lines, and fades back up once the card has settled.
 *  - featured cards (phone): the swiped-to card is the open one
 *  - about: portrait rises a little slower than the page
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { initMarquee } from './marquee';

gsap.registerPlugin(ScrollTrigger);

export function initHome(signal: AbortSignal, reduceMotion: boolean, pageDelay: number) {
  if (!document.querySelector('[data-home]')) return;

  initHero(reduceMotion, pageDelay);
  initMarquee(document.querySelector('[data-marquee]'), signal, reduceMotion);
  initFeature(signal, reduceMotion);
  initPortrait(reduceMotion);
}

/* ---------- Hero ---------- */

function initHero(reduceMotion: boolean, pageDelay: number) {
  const title = document.querySelector<HTMLElement>('[data-home-title]');
  if (!title || reduceMotion) return;

  gsap.fromTo(
    title.querySelectorAll('.hw > span'),
    { yPercent: 150 },
    {
      yPercent: 0,
      duration: 1.1,
      ease: 'power4.out',
      stagger: 0.035,
      delay: pageDelay,
      onComplete: () => title.classList.add('is-in'),
    },
  );

  // Drift up and fade a touch as the hero scrolls away
  gsap.to(title, {
    yPercent: -25,
    opacity: 0.35,
    ease: 'none',
    scrollTrigger: { trigger: title.closest('section'), start: 'top top', end: 'bottom top', scrub: true },
  });
}

/* ---------- Featured cards ---------- */

function initFeature(signal: AbortSignal, reduceMotion: boolean) {
  const root = document.querySelector<HTMLElement>('[data-feature]');
  const list = root?.querySelector<HTMLElement>('[data-feature-list]');
  if (!root || !list) return;
  const items = Array.from(list.querySelectorAll<HTMLElement>('[data-feature-item]'));
  const dots = Array.from(root.querySelectorAll<HTMLElement>('[data-feature-dot]'));
  const desktop = matchMedia('(min-width: 48rem)');

  const OPEN = 2.1; // the open card is about twice as wide as the others
  const DUR = 0.75;
  const EASE = 'power3.inOut';
  let current = -1; // -1 = all shut

  // The words sit still while the card resizes: they fade out, swap to their
  // new line breaks out of sight, then fade back up once the card has settled.
  const swaps = new Map<HTMLElement, gsap.core.Timeline>();
  const swapText = (item: HTMLElement, wide: boolean, run: boolean) => {
    const copy = item.querySelector<HTMLElement>('[data-copy]');
    if (!copy) return;
    swaps.get(item)?.kill();
    gsap.killTweensOf(copy);
    if (!run) {
      item.classList.toggle('is-wide', wide);
      gsap.set(copy, { clearProps: 'opacity,transform' });
      return;
    }
    // Already showing the right layout (e.g. the mouse came straight back): just make sure it's visible
    if (item.classList.contains('is-wide') === wide) {
      gsap.to(copy, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' });
      return;
    }
    const tl = gsap
      .timeline()
      .to(copy, { opacity: 0, duration: 0.15, ease: 'power1.in' })
      .add(() => item.classList.toggle('is-wide', wide))
      .fromTo(copy, { y: 12 }, { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out' }, DUR * 0.6);
    swaps.set(item, tl);
  };

  // index -1 shuts them all
  const setOpen = (index: number, animate = true) => {
    if (index === current) return;
    current = index;
    const wide = desktop.matches;
    const run = animate && wide && !reduceMotion;

    items.forEach((el, i) => {
      el.classList.toggle('is-open', i === index);
      swapText(el, i === index, run);
    });
    dots.forEach((d, i) => d.classList.toggle('is-on', i === index));
    if (!wide) return;

    // Cards widen / narrow in place
    items.forEach((el, i) =>
      gsap.to(el, { flexGrow: i === index ? OPEN : 1, duration: run ? DUR : 0, ease: EASE, overwrite: true }),
    );
  };

  /* Computer: hover / keyboard focus opens a card; leaving shuts them all */

  let hoverTimer: gsap.core.Tween | null = null;
  const later = (fn: () => void) => {
    hoverTimer?.kill();
    // A short pause so sweeping the mouse across doesn't flick through every card
    hoverTimer = gsap.delayedCall(0.08, fn);
  };

  items.forEach((item, i) => {
    item.addEventListener('mouseenter', () => desktop.matches && later(() => setOpen(i)), { signal });
    item.addEventListener('focusin', () => desktop.matches && setOpen(i), { signal });
  });
  list.addEventListener('mouseleave', () => desktop.matches && later(() => setOpen(-1)), { signal });
  list.addEventListener(
    'focusout',
    (e) => {
      if (desktop.matches && !list.contains(e.relatedTarget as Node)) setOpen(-1);
    },
    { signal },
  );

  /* Phone: whichever card is centred in the swipe row is open */

  let raf = 0;
  const syncToScroll = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      if (desktop.matches) return;
      const mid = list.scrollLeft + list.clientWidth / 2;
      let best = 0;
      let bestDist = Infinity;
      items.forEach((el, i) => {
        const d = Math.abs(el.offsetLeft + el.offsetWidth / 2 - mid);
        if (d < bestDist) (best = i), (bestDist = d);
      });
      setOpen(best, false);
    });
  };
  list.addEventListener('scroll', syncToScroll, { passive: true, signal });

  dots.forEach((dot, i) =>
    dot.addEventListener(
      'click',
      () => {
        const el = items[i];
        list.scrollTo({
          left: el.offsetLeft - (list.clientWidth - el.offsetWidth) / 2,
          behavior: reduceMotion ? 'auto' : 'smooth',
        });
      },
      { signal },
    ),
  );

  // Switching between phone and computer layouts: start clean
  const reset = () => {
    gsap.killTweensOf(items);
    gsap.set(items, { clearProps: 'flexGrow' });
    current = -2;
    desktop.matches ? setOpen(-1, false) : syncToScroll();
  };
  desktop.addEventListener('change', reset, { signal });
  reset();

  signal.addEventListener('abort', () => {
    hoverTimer?.kill();
    cancelAnimationFrame(raf);
  });
}

/* ---------- About portrait ---------- */

function initPortrait(reduceMotion: boolean) {
  const photo = document.querySelector('[data-portrait-photo]');
  if (!photo || reduceMotion) return;
  gsap.fromTo(
    photo,
    { yPercent: 8 },
    {
      yPercent: -4,
      ease: 'none',
      scrollTrigger: { trigger: photo, start: 'top bottom', end: 'bottom top', scrub: true },
    },
  );
}
