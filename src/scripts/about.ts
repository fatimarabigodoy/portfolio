/**
 * About page extras. Does nothing on other pages.
 *
 *  - portrait: hover (or tap) swaps the photo for the drawing of me
 *  - report card: the ticks and the star draw themselves
 *  - path: the red timeline line draws down as you scroll
 *  - passport: visa stamps thunk on one by one when it scrolls in; the empty
 *    "your tool here" slot stamps (and un-stamps) on click
 *  - portfolio comic: on laptops the section pins and the pages slide sideways
 *    as you scroll, with a page counter; the circle on the last page draws as
 *    it slides in. Phones get a swipe row; the circle draws once it's in view.
 *  - comics: "Next comic" (or a click on the top card) sends it to the back of the pile
 *
 * With reduced motion the swap is a plain fade and nothing draws.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Mark } from './scribble';

export function initAbout(signal: AbortSignal, reduceMotion: boolean) {
  const page = document.querySelector<HTMLElement>('[data-about]');
  if (!page) return;

  initPortrait(signal, reduceMotion);
  initReport(reduceMotion);
  initPath(reduceMotion);
  initPortfolioComic(signal, reduceMotion);
  initPassport(signal, reduceMotion);
  initComics(signal, reduceMotion);
}

/* ---------- Two Fatimas ---------- */

function initPortrait(signal: AbortSignal, reduceMotion: boolean) {
  const duo = document.querySelector<HTMLButtonElement>('[data-duo]');
  if (!duo) return;
  const drawing = duo.querySelector('.duo__img--drawing');
  const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;

  const set = (on: boolean) => {
    if (duo.getAttribute('aria-pressed') === String(on)) return;
    duo.setAttribute('aria-pressed', String(on));
    // A little "boing" when the drawn me shows up
    if (on && drawing && !reduceMotion) {
      gsap.fromTo(drawing, { scale: 0.94, rotate: -3 }, { scale: 1, rotate: 0, duration: 0.6, ease: 'back.out(2.5)' });
    }
  };

  if (canHover) {
    duo.addEventListener('mouseenter', () => set(true), { signal });
    duo.addEventListener('mouseleave', () => set(false), { signal });
  }
  // Click/tap (and keyboard) toggles
  duo.addEventListener('click', () => set(duo.getAttribute('aria-pressed') !== 'true'), { signal });
}

/* ---------- Report card ticks ---------- */

function initReport(reduceMotion: boolean) {
  const report = document.querySelector('[data-report]');
  if (!report || reduceMotion) return;
  const paths = report.querySelectorAll<SVGPathElement>('.report__mark path');
  paths.forEach((p) => {
    const len = p.getTotalLength();
    gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
  });
  gsap.to(paths, {
    strokeDashoffset: 0,
    duration: 0.45,
    ease: 'power2.inOut',
    stagger: 0.22,
    scrollTrigger: { trigger: report, start: 'top 75%', once: true },
  });
}

/* ---------- Timeline line ---------- */

function initPath(reduceMotion: boolean) {
  const path = document.querySelector<HTMLElement>('[data-path]');
  if (!path || reduceMotion) return;
  gsap.fromTo(
    path,
    { '--line': 0 },
    {
      '--line': 1,
      ease: 'none',
      scrollTrigger: { trigger: path, start: 'top 75%', end: 'bottom 70%', scrub: true },
    },
  );
}

/* ---------- The portfolio comic ---------- */

function initPortfolioComic(signal: AbortSignal, reduceMotion: boolean) {
  const section = document.querySelector<HTMLElement>('[data-pc]');
  const win = section?.querySelector<HTMLElement>('[data-pc-window]');
  const row = section?.querySelector<HTMLElement>('[data-pc-row]');
  const count = section?.querySelector<HTMLElement>('[data-pc-count]');
  if (!section || !win || !row) return;

  const pages = Array.from(section.querySelectorAll<HTMLElement>('[data-pc-page]'));
  // The last page's circle is a "manual" scribble, so this page draws it
  const marksFor = new Map<HTMLElement, Mark[]>();
  const allMarks: Mark[] = [];
  pages.forEach((page) => {
    const marks = Array.from(page.querySelectorAll<HTMLElement>('[data-scribble="manual"]')).map((el) => new Mark(el));
    if (marks.length) marksFor.set(page, marks);
    allMarks.push(...marks);
  });
  signal.addEventListener('abort', () => allMarks.forEach((m) => m.destroy()));

  if (reduceMotion) {
    allMarks.forEach((m) => m.show());
    return;
  }

  const drawPage = (page: Element) => marksFor.get(page as HTMLElement)?.forEach((m) => !m.drawn && m.draw());

  const mm = gsap.matchMedia();
  signal.addEventListener('abort', () => mm.revert());

  // Laptops: pin the section and slide the pages left through their window
  // (the intro beside it stays put)
  mm.add('(min-width: 48rem)', () => {
    section.classList.add('is-filmstrip');
    const distance = () => Math.max(0, row.offsetWidth - win.clientWidth);

    // The counter shows the last page whose left edge has passed the middle
    // (the final page never gets that far, so the very end counts as it)
    let current = -1;
    const updateCount = (progress = 0) => {
      if (!count) return;
      const mid = window.innerWidth * 0.55;
      let at = 0;
      pages.forEach((page, i) => {
        if (page.getBoundingClientRect().left < mid) at = i;
      });
      if (progress > 0.97) at = pages.length - 1;
      if (at !== current) {
        current = at;
        count.textContent = String(at + 1).padStart(2, '0');
      }
    };

    const slide = gsap.to(row, {
      x: () => -distance(),
      ease: 'none',
      // On the tween (not the trigger), so it follows the eased slide
      onUpdate() {
        updateCount(this.progress());
      },
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${distance()}`,
        pin: true,
        scrub: 0.6,
        invalidateOnRefresh: true,
      },
    });

    marksFor.forEach((_, page) => {
      ScrollTrigger.create({
        trigger: page,
        containerAnimation: slide,
        start: 'left 65%',
        once: true,
        onEnter: () => drawPage(page),
      });
    });

    // The pin adds scroll space, so everything below it needs re-measuring
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
    updateCount();

    return () => section.classList.remove('is-filmstrip');
  });

  // Phones: native swipe row; draw each page's marks once it's mostly in view
  mm.add('(max-width: 47.99rem)', () => {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          drawPage(e.target);
          io.unobserve(e.target);
        }),
      { threshold: 0.6 },
    );
    marksFor.forEach((_, page) => io.observe(page));
    return () => io.disconnect();
  });
}

/* ---------- Passport ---------- */

function initPassport(signal: AbortSignal, reduceMotion: boolean) {
  const passport = document.querySelector<HTMLElement>('[data-passport]');
  if (!passport) return;

  const slot = passport.querySelector<HTMLButtonElement>('[data-stamp-slot]');
  // The landing itself is CSS (aria-pressed); JS only adds the page bump
  slot?.addEventListener(
    'click',
    () => {
      const on = slot.getAttribute('aria-pressed') !== 'true';
      slot.setAttribute('aria-pressed', String(on));
      if (on && !reduceMotion) bump(passport, 0.12);
    },
    { signal },
  );

  if (reduceMotion) return;
  const stamps = passport.querySelectorAll<HTMLElement>('[data-stamp]');
  gsap.set(stamps, { opacity: 0, scale: 1.4 });
  const tl = gsap.timeline({
    paused: true,
    scrollTrigger: { trigger: passport, start: 'top 70%', once: true },
  });
  stamps.forEach((s, i) => {
    tl.to(s, { opacity: 0.92, scale: 1, duration: 0.22, ease: 'back.out(3)' }, 0.35 + i * 0.28).add(
      () => bump(passport, 0),
      '>-0.08',
    );
  });
}

// The page gives a little under the stamp
function bump(el: HTMLElement, delay: number) {
  gsap.fromTo(el, { y: 0 }, { y: 2, duration: 0.06, delay, ease: 'power1.out', yoyo: true, repeat: 1 });
}

/* ---------- Comic pile ---------- */

function initComics(signal: AbortSignal, reduceMotion: boolean) {
  const list = document.querySelector<HTMLElement>('[data-stack]');
  const next = document.querySelector<HTMLButtonElement>('[data-stack-next]');
  if (!list || !next) return;
  let busy = false;

  const reindex = () =>
    list.querySelectorAll<HTMLElement>('[data-comic]').forEach((c, i) => c.style.setProperty('--i', String(i)));

  const shuffle = () => {
    const topCard = list.querySelector<HTMLElement>('[data-comic]');
    if (!topCard || busy || list.children.length < 2) return;

    if (reduceMotion) {
      list.append(topCard);
      reindex();
      return;
    }

    busy = true;
    gsap
      .timeline({ onComplete: () => (busy = false) })
      .to(topCard, { x: '75%', y: '-8%', rotate: 14, duration: 0.4, ease: 'power2.in' })
      .add(() => {
        list.append(topCard);
        reindex();
      })
      .to(topCard, { x: 0, y: 0, rotate: 0, duration: 0.5, ease: 'power3.out' });
  };

  next.addEventListener('click', shuffle, { signal });
  // Clicking the top card itself also shuffles (unless it's the LinkedIn link)
  list.addEventListener(
    'click',
    (e) => {
      const target = e.target as HTMLElement;
      if (target.closest('a')) return;
      if (target.closest('[data-comic]') === list.querySelector('[data-comic]')) shuffle();
    },
    { signal },
  );
}
