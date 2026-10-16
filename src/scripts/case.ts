/**
 * Case-study page interactions. Does nothing on other pages.
 *
 *  - headline lines slide up from behind a mask (shared with the Work page)
 *  - pictures and videos open up from a smaller rounded frame as they scroll in
 *  - looping clips (our GIF replacements) only play while on screen, with a pause button
 *  - slideshows (several pictures crossfading) work the same way
 *  - "Play the film" button on videos with sound
 *  - concept cards open and close their stories
 *  - illustration parades stroll across the screen (see src/scripts/marquee.ts)
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initHeadline } from './work';
import { initMarquee } from './marquee';

gsap.registerPlugin(ScrollTrigger);

export function initCase(signal: AbortSignal, reduceMotion: boolean, pageDelay: number) {
  if (!document.querySelector('[data-case]')) return;

  initHeadline(reduceMotion, pageDelay);
  initMediaReveals(reduceMotion);
  initLoops(signal, reduceMotion);
  initSlides(signal, reduceMotion);
  initFilms(signal);
  initConcepts(signal);
  // Illustration parades walk left to right, the way most of the animals face
  document
    .querySelectorAll<HTMLElement>('[data-parade]')
    .forEach((p) => initMarquee(p, signal, reduceMotion, { speed: 40, reverse: true }));
}

/* ---------- Frames open up on scroll ---------- */

function initMediaReveals(reduceMotion: boolean) {
  if (reduceMotion) return;
  gsap.utils.toArray<HTMLElement>('[data-media]').forEach((frame) => {
    const inner = frame.querySelector('[data-media-inner]');
    const tl = gsap.timeline({
      scrollTrigger: { trigger: frame, start: 'top 95%', end: 'top 45%', scrub: 0.6 },
    });
    // See-through pictures have no frame to open up, so they grow and fade in
    if (frame.closest('.media--cutout')) {
      tl.fromTo(frame, { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, ease: 'power2.out' });
      return;
    }
    tl.fromTo(
      frame,
      { clipPath: 'inset(8% 5% 0% 5% round 24px)' },
      { clipPath: 'inset(0% 0% 0% 0% round 12px)', ease: 'power2.out' },
    );
    if (inner) tl.fromTo(inner, { scale: 1.15 }, { scale: 1, ease: 'power2.out' }, 0);
  });
}

/* ---------- Looping clips ---------- */

function initLoops(signal: AbortSignal, reduceMotion: boolean) {
  document.querySelectorAll<HTMLVideoElement>('[data-loop-video]').forEach((video) => {
    const toggle = video.closest('[data-media]')?.querySelector<HTMLButtonElement>('[data-loop-toggle]');
    // With reduced motion, clips start paused; the button can still play them.
    let userPaused = reduceMotion;
    let onScreen = false;

    const sync = () => {
      const play = onScreen && !userPaused;
      if (play) video.play().catch(() => {});
      else video.pause();
      if (toggle) {
        toggle.classList.toggle('is-paused', userPaused);
        toggle.setAttribute('aria-label', userPaused ? 'Play animation' : 'Pause animation');
      }
    };

    if (reduceMotion) video.preload = 'metadata';

    ScrollTrigger.create({
      trigger: video,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => {
        onScreen = self.isActive;
        sync();
      },
    });

    toggle?.addEventListener(
      'click',
      () => {
        userPaused = !userPaused;
        sync();
      },
      { signal },
    );
    sync();
    signal.addEventListener('abort', () => video.pause());
  });
}

/* ---------- Slideshows ---------- */

function initSlides(signal: AbortSignal, reduceMotion: boolean) {
  document.querySelectorAll<HTMLElement>('[data-slides]').forEach((show) => {
    const slides = [...show.querySelectorAll<HTMLElement>('.media__slide')];
    if (slides.length < 2) return;
    const toggle = show.closest('[data-media]')?.querySelector<HTMLButtonElement>('[data-loop-toggle]');
    const seconds = Number(show.dataset.interval) || 2.5;
    // With reduced motion, slideshows start paused; the button can still play them.
    let userPaused = reduceMotion;
    let onScreen = false;
    let current = 0;
    let timer = 0;

    const next = () => {
      slides[current].classList.remove('is-active');
      current = (current + 1) % slides.length;
      slides[current].classList.add('is-active');
    };

    let kickoff = 0;
    const sync = () => {
      window.clearInterval(timer);
      window.clearTimeout(kickoff);
      if (onScreen && !userPaused) {
        // First change comes quickly, so even a fast scroller sees it's moving
        kickoff = window.setTimeout(() => {
          next();
          timer = window.setInterval(next, seconds * 1000);
        }, Math.min(seconds, 0.6) * 1000);
      }
      if (toggle) {
        toggle.classList.toggle('is-paused', userPaused);
        toggle.setAttribute('aria-label', userPaused ? 'Play slideshow' : 'Pause slideshow');
      }
    };

    ScrollTrigger.create({
      trigger: show,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => {
        onScreen = self.isActive;
        sync();
      },
    });

    toggle?.addEventListener(
      'click',
      () => {
        userPaused = !userPaused;
        // Unpausing moves on straight away, so the click feels like it did something
        if (!userPaused) next();
        sync();
      },
      { signal },
    );
    sync();
    signal.addEventListener('abort', () => {
      window.clearInterval(timer);
      window.clearTimeout(kickoff);
    });
  });
}

/* ---------- Films with sound ---------- */

function initFilms(signal: AbortSignal) {
  document.querySelectorAll<HTMLVideoElement>('[data-film]').forEach((video) => {
    const frame = video.closest<HTMLElement>('[data-media]');
    const button = frame?.querySelector<HTMLButtonElement>('[data-film-play]');
    if (!frame || !button) return;

    button.addEventListener(
      'click',
      () => {
        frame.classList.add('is-playing');
        video.controls = true;
        video.play().catch(() => {});
        video.focus({ preventScroll: true });
      },
      { signal },
    );

    // Stop the film when it scrolls fully away
    ScrollTrigger.create({
      trigger: video,
      start: 'top bottom',
      end: 'bottom top',
      onLeave: () => video.pause(),
      onLeaveBack: () => video.pause(),
    });
    signal.addEventListener('abort', () => video.pause());
  });
}

/* ---------- Concept cards ---------- */

function initConcepts(signal: AbortSignal) {
  document.querySelectorAll<HTMLElement>('[data-concept]').forEach((card) => {
    const toggle = card.querySelector<HTMLButtonElement>('[data-concept-toggle]');
    if (!toggle) return;
    toggle.addEventListener(
      'click',
      () => {
        const open = toggle.getAttribute('aria-expanded') !== 'true';
        toggle.setAttribute('aria-expanded', String(open));
        card.classList.toggle('is-open', open);
        // The page gets taller or shorter, so scroll animations need re-measuring
        window.setTimeout(() => ScrollTrigger.refresh(), 650);
      },
      { signal },
    );
  });
}
