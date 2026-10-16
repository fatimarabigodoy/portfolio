/**
 * Planet Fitness case study extras. Does nothing on other pages.
 *
 *  - hero: "No one knows…" gets a new ending every few seconds. The old one
 *    slides up and out, the new one slides up from below. It waits while the
 *    hero is off screen, and "Pause the confessions" stops it for good.
 *
 * With reduced motion the first ending simply stays put.
 */
import gsap from 'gsap';

const HOLD = 2.4; // seconds each ending stays up

export function initPlanetFitness(signal: AbortSignal, reduceMotion: boolean, pageDelay: number) {
  if (!document.querySelector('.pf[data-case]') || reduceMotion) return;

  const box = document.querySelector<HTMLElement>('[data-endings]');
  const toggle = document.querySelector<HTMLButtonElement>('[data-endings-toggle]');
  const label = document.querySelector<HTMLElement>('[data-endings-label]');
  if (!box) return;
  const endings = [...box.querySelectorAll<HTMLElement>('[data-ending]')];
  if (endings.length < 2) return;

  // Screen readers only hear the first ending, so the swapping is visual only
  endings.forEach((e, i) => {
    e.style.visibility = 'visible';
    if (i > 0) gsap.set(e, { yPercent: 110, opacity: 0 });
  });

  let current = 0;
  let paused = false;
  let onScreen = true;
  let timer = 0;

  const schedule = (delay = HOLD) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(step, delay * 1000);
  };
  const step = () => {
    if (paused || !onScreen || document.hidden) return; // resumes via observer / visibility
    const from = endings[current];
    current = (current + 1) % endings.length;
    const to = endings[current];
    gsap.to(from, { yPercent: -110, opacity: 0, duration: 0.55, ease: 'power3.in' });
    gsap.fromTo(
      to,
      { yPercent: 110, opacity: 0 },
      { yPercent: 0, opacity: 1, duration: 0.7, ease: 'power3.out', delay: 0.4 },
    );
    schedule();
  };

  const io = new IntersectionObserver(([entry]) => {
    const was = onScreen;
    onScreen = entry.isIntersecting;
    if (onScreen && !was && !paused) schedule(1);
  });
  io.observe(box);
  signal.addEventListener('abort', () => {
    io.disconnect();
    window.clearTimeout(timer);
  });
  document.addEventListener(
    'visibilitychange',
    () => {
      if (!document.hidden && !paused) schedule(1);
    },
    { signal },
  );

  if (toggle) {
    toggle.hidden = false;
    toggle.addEventListener(
      'click',
      () => {
        paused = !paused;
        toggle.classList.toggle('is-paused', paused);
        if (label) label.textContent = paused ? 'Keep confessing' : 'Pause the confessions';
        if (paused) window.clearTimeout(timer);
        else schedule(0.3);
      },
      { signal },
    );
  }

  // First swap after the headline has risen in and had a moment to be read
  schedule(pageDelay + HOLD + 0.8);
}
