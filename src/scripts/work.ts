/**
 * Work page interactions. Does nothing on other pages.
 *
 *  - headline lines slide up from behind a mask
 *  - cards: staggered rise-in, image drifts on scroll, and on phones a card
 *    turns full colour (and shows its description) in the middle of the screen
 *  - cream pill with each project's playful line ("Coach what??") that follows
 *    the mouse over cards
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initWork(signal: AbortSignal, reduceMotion: boolean, pageDelay: number) {
  const items = gsap.utils.toArray<HTMLElement>('[data-card]');
  if (!items.length) return;

  initHeadline(reduceMotion, pageDelay);
  initBangs(signal, reduceMotion, pageDelay);
  initCards(items, reduceMotion);
}

/* ---------- Headline ---------- */

/** Shared with case-study pages. */
export function initHeadline(reduceMotion: boolean, pageDelay: number) {
  const lines = gsap.utils.toArray<HTMLElement>('[data-hero-lines] .line');
  if (reduceMotion) return;
  gsap.fromTo(
    lines.map((l) => l.firstElementChild),
    { yPercent: 115, opacity: 1 },
    {
      yPercent: 0,
      duration: 1.1,
      ease: 'power4.out',
      stagger: 0.12,
      delay: pageDelay,
      onComplete: () => lines.forEach((l) => l.classList.add('is-in')),
    },
  );
}

/* ---------- "that!!!!" ---------- */

/** Extra exclamation marks appear one by one, like a held-down key. */
function initBangs(signal: AbortSignal, reduceMotion: boolean, pageDelay: number) {
  const bangs = gsap.utils.toArray<HTMLElement>('[data-bangs] > span');
  if (!bangs.length || reduceMotion) return;
  // Key-repeat rhythm, starting as the headline settles
  const tl = gsap.timeline({ delay: pageDelay + 0.75 });
  tl.to(bangs, { opacity: 1, duration: 0.08, ease: 'none', stagger: 0.06 });
  signal.addEventListener('abort', () => tl.kill());
}

/* ---------- Cards ---------- */

function initCards(items: HTMLElement[], reduceMotion: boolean) {
  if (reduceMotion) return;

  // Rise in, a row at a time
  gsap.set(items, { opacity: 0, y: 70 });
  ScrollTrigger.batch(items, {
    start: 'top 92%',
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.12, overwrite: true }),
  });

  // The picture drifts a little slower than the page
  items.forEach((item) => {
    const img = item.querySelector('[data-card-parallax]');
    if (!img) return;
    gsap.fromTo(
      img,
      { yPercent: -5 },
      { yPercent: 5, ease: 'none', scrollTrigger: { trigger: item, start: 'top bottom', end: 'bottom top', scrub: true } },
    );
  });

  // Phones have no hover, so colour and description come in when the card is centred
  if (matchMedia('(hover: none)').matches) {
    items.forEach((item) => {
      const card = item.querySelector('.card');
      if (!card) return;
      ScrollTrigger.create({
        trigger: item,
        start: 'top 65%',
        end: 'bottom 35%',
        toggleClass: { targets: card, className: 'is-live' },
      });
    });
  }

}

/* ---------- Cursor bubble ---------- */

/** Shared with the Home page. Runs on any page that has the <Cursor /> pill. */
export function initCursor(signal: AbortSignal) {
  const cursor = document.querySelector<HTMLElement>('[data-cursor]');
  if (!cursor || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  const x = gsap.quickTo(cursor, 'x', { duration: 0.5, ease: 'power3.out' });
  const y = gsap.quickTo(cursor, 'y', { duration: 0.5, ease: 'power3.out' });
  const text = cursor.querySelector<HTMLElement>('[data-cursor-text]');
  let visible = false;
  let current: Element | null = null;

  const show = (on: boolean) => {
    if (on === visible) return;
    visible = on;
    gsap.to(cursor, {
      scale: on ? 1 : 0,
      duration: on ? 0.5 : 0.3,
      ease: on ? 'back.out(1.7)' : 'power2.in',
      overwrite: 'auto',
    });
  };

  let px = -1;
  let py = -1;
  const check = (target: Element | null) => {
    const over = target?.closest?.<HTMLElement>('[data-card-link]') ?? null;
    if (over && over !== current && text) {
      text.textContent = over.dataset.cta ?? 'View project';
    }
    current = over;
    show(Boolean(over));
  };

  window.addEventListener(
    'pointermove',
    (e) => {
      px = e.clientX;
      py = e.clientY;
      x(px);
      y(py);
      check(e.target as Element | null);
    },
    { passive: true, signal },
  );
  // Scrolling moves the page under a still mouse, so look again at what's under it
  window.addEventListener('scroll', () => px >= 0 && check(document.elementFromPoint(px, py)), {
    passive: true,
    signal,
  });
  document.addEventListener('pointerleave', () => show(false), { signal });
  // Hide on click so it doesn't hang around during the page wipe
  document.addEventListener('click', () => show(false), { signal });
  signal.addEventListener('abort', () => gsap.set(cursor, { scale: 0 }));
}
