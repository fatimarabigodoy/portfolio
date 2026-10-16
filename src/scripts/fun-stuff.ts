/**
 * The Fun Stuff page extras. Does nothing on other pages.
 *
 *  - Who Am I?: a silent preview loops until "Play with sound". The label
 *    buttons under the film jump to that part, and the current one lights up.
 *  - Made in Peru: a lens shows the poster in Illustrator's outline view under
 *    the cursor. It drifts across once by itself as a hint. Click / tap /
 *    Enter switches the whole poster to outlines.
 *  - A Cat Named Molly: a stack of panels (the deck itself lives in deck.ts).
 *  - Breasts and Eggs: a highlighter swipes over "highlighted about half of it".
 *  - Rare Molly: on about 1 in 4 visits she peeks over the closing line.
 *    Add ?molly to the address to always see her.
 *
 * With reduced motion: no silent preview, no flying panels, no lens drift (clicking
 * still swaps to outlines) and Molly just sits there.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function initFunStuff(signal: AbortSignal, reduceMotion: boolean) {
  if (!document.querySelector('[data-fun]')) return;
  initFilm(signal, reduceMotion);
  initLens(signal, reduceMotion);
  initHighlight(reduceMotion);
  initPeek(reduceMotion);
}

/* ---------- Who Am I? ---------- */

function initFilm(signal: AbortSignal, reduceMotion: boolean) {
  const film = document.querySelector<HTMLElement>('[data-film-chapters]');
  const intro = film?.querySelector<HTMLVideoElement>('[data-film-intro]');
  const main = film?.querySelector<HTMLVideoElement>('[data-film-main]');
  const start = film?.querySelector<HTMLButtonElement>('[data-film-start]');
  if (!film || !intro || !main || !start) return;
  const chapters = [...film.querySelectorAll<HTMLButtonElement>('[data-chapter]')];
  const times = chapters.map((c) => Number(c.dataset.chapter));

  // Silent preview only while it's on screen
  if (!reduceMotion) {
    ScrollTrigger.create({
      trigger: film,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => {
        if (film.classList.contains('is-playing')) return;
        if (self.isActive) intro.play().catch(() => {});
        else intro.pause();
      },
    });
  }

  const play = (at = 0) => {
    if (!film.classList.contains('is-playing')) {
      film.classList.add('is-playing');
      intro.pause();
      main.controls = true;
    }
    main.currentTime = at;
    main.play().catch(() => {});
  };

  start.addEventListener(
    'click',
    () => {
      play(0);
      main.focus({ preventScroll: true });
    },
    { signal },
  );
  chapters.forEach((btn, i) => btn.addEventListener('click', () => play(times[i]), { signal }));

  // Light up the label that's on screen
  let current = -1;
  main.addEventListener(
    'timeupdate',
    () => {
      let next = -1;
      times.forEach((t, i) => {
        if (main.currentTime >= t - 0.05) next = i;
      });
      if (next === current) return;
      current = next;
      chapters.forEach((c, i) => c.setAttribute('aria-current', String(i === current)));
    },
    { signal },
  );

  // Stop when it scrolls fully away, or when leaving the page
  ScrollTrigger.create({
    trigger: film,
    start: 'top bottom',
    end: 'bottom top',
    onLeave: () => main.pause(),
    onLeaveBack: () => main.pause(),
  });
  signal.addEventListener('abort', () => {
    main.pause();
    intro.pause();
  });
}

/* ---------- Made in Peru: anchor points lens ---------- */

function initLens(signal: AbortSignal, reduceMotion: boolean) {
  const art = document.querySelector<HTMLElement>('[data-lens]');
  if (!art) return;
  const at = (x: number, y: number) => {
    art.style.setProperty('--lx', `${x}px`);
    art.style.setProperty('--ly', `${y}px`);
  };
  const local = (e: PointerEvent | MouseEvent) => {
    const box = art.getBoundingClientRect();
    at(e.clientX - box.left, e.clientY - box.top);
  };

  // Click / tap / Enter: the whole poster switches to outlines (and back)
  const toggle = () => {
    const on = art.getAttribute('aria-pressed') !== 'true';
    art.setAttribute('aria-pressed', String(on));
    art.classList.toggle('is-outline', on);
  };
  art.addEventListener(
    'click',
    (e) => {
      if (e.detail) local(e);
      else at(art.offsetWidth / 2, art.offsetHeight / 2);
      toggle();
    },
    { signal },
  );
  art.addEventListener(
    'keydown',
    (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      at(art.offsetWidth / 2, art.offsetHeight / 2);
      toggle();
    },
    { signal },
  );

  if (reduceMotion) return;

  // The nudge: when the poster first shows up, the lens drifts across it once
  // on its own, so people can see there's something underneath.
  const pos = { x: 0.18, y: 0.72 };
  const sweep = gsap.timeline({
    paused: true,
    onStart: () => art.classList.add('is-lens'),
    onUpdate: () => at(pos.x * art.offsetWidth, pos.y * art.offsetHeight),
    onComplete: () => {
      if (!art.matches(':hover')) art.classList.remove('is-lens');
    },
  });
  sweep
    .to(pos, { x: 0.42, y: 0.55, duration: 0.9, ease: 'sine.inOut' })
    .to(pos, { x: 0.66, y: 0.5, duration: 0.9, ease: 'sine.inOut' })
    .to(pos, { x: 0.58, y: 0.3, duration: 0.8, ease: 'sine.inOut' });
  ScrollTrigger.create({
    trigger: art,
    start: 'top 55%',
    once: true,
    onEnter: () => gsap.delayedCall(0.4, () => sweep.play()),
  });

  // The cursor lens is for mice only
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  art.addEventListener(
    'pointerenter',
    (e) => {
      sweep.kill();
      local(e);
      art.classList.add('is-lens');
    },
    { signal },
  );
  art.addEventListener('pointermove', local, { signal });
  art.addEventListener('pointerleave', () => art.classList.remove('is-lens'), { signal });
}

/* ---------- Breasts and Eggs: highlighter ---------- */

function initHighlight(reduceMotion: boolean) {
  if (reduceMotion) return;
  document.querySelectorAll<HTMLElement>('[data-highlight]').forEach((mark) => {
    gsap.fromTo(
      mark,
      { '--hl': '0%' },
      {
        '--hl': '100%',
        duration: 0.9,
        ease: 'power2.inOut',
        scrollTrigger: { trigger: mark, start: 'top 80%', once: true },
        delay: 0.5,
      },
    );
  });
}

/* ---------- Rare Molly ---------- */

function initPeek(reduceMotion: boolean) {
  const peek = document.querySelector<HTMLElement>('[data-molly-peek]');
  if (!peek) return;
  const forced = new URLSearchParams(location.search).has('molly');
  if (!forced && Math.random() > 0.25) return;
  peek.hidden = false;
  if (reduceMotion) return;

  const img = peek.querySelector('img');
  const note = peek.querySelector('.peek__note');
  gsap.set(img, { yPercent: 100 });
  gsap.set(note, { opacity: 0 });
  gsap
    .timeline({ scrollTrigger: { trigger: peek, start: 'top 90%', once: true } })
    .to(img, { yPercent: 0, duration: 0.9, ease: 'power3.out', delay: 0.4 })
    .to(note, { opacity: 1, duration: 0.5 }, '-=0.2');
}
