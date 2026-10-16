/**
 * The site's motion engine. Runs once; re-wires each page after every
 * page change (Astro's ClientRouter swaps pages without a full reload).
 *
 *  - Lenis smooth scrolling
 *  - red wipe between pages
 *  - header: colour follows the section under it, hides on scroll down
 *  - mobile menu
 *  - [data-reveal] fade-up on scroll
 *  - <Scribble> self-drawing marks
 *  - footer: copy email, back to top
 *  - page-specific extras (Work page: work.ts, Home page: home.ts, case studies: case.ts, Headspace: headspace.ts, Planet Fitness: planet-fitness.ts, Casino / Elmwood / Coach Cedar: casino.ts, elmwood.ts, coach-cedar.ts, decks: deck.ts, About: about.ts, The Fun Stuff: fun-stuff.ts)
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { Mark } from './scribble';
import { initWork, initCursor } from './work';
import { initHome } from './home';
import { initCase } from './case';
import { initHeadspace } from './headspace';
import { initPlanetFitness } from './planet-fitness';
import { initPuku } from './puku';
import { initAbout } from './about';
import { initFunStuff } from './fun-stuff';
import { initDecks } from './deck';
import { initCasino } from './casino';
import { initElmwood } from './elmwood';
import { initCoachCedar } from './coach-cedar';

gsap.registerPlugin(ScrollTrigger);

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;

/* ---------- Smooth scroll ---------- */

let lenis: Lenis | null = null;
if (!reduceMotion) {
  lenis = new Lenis({ lerp: 0.1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis!.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ---------- Per-page cleanup ---------- */

// Everything a page sets up registers here so it can be torn down on leave.
let pageAbort = new AbortController();
let pageCtx: gsap.Context | null = null;

function teardownPage() {
  pageAbort.abort();
  pageAbort = new AbortController();
  pageCtx?.revert();
  pageCtx = null;
  destroyScribbles();
  lenis?.start();
}

/* ---------- Page transitions: red wipe ---------- */

let wipeCovering = false;
let wipeMark: Mark | null = null;

function wipeIn() {
  const wipe = document.querySelector<HTMLElement>('[data-wipe]');
  const mark = wipe?.querySelector('svg');
  if (!wipe || !mark) return Promise.resolve();
  wipeCovering = true;
  return gsap
    .timeline()
    .set(wipe, { clipPath: 'inset(100% 0% 0% 0%)' })
    .set(mark, { yPercent: 110 })
    .to(wipe, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.6, ease: 'power3.inOut' })
    .to(mark, { yPercent: 0, duration: 0.45, ease: 'power3.out' }, '-=0.2')
    .add(() => {
      const line = wipe.querySelector<HTMLElement>('[data-scribble]');
      if (!line) return;
      wipeMark ??= new Mark(line);
      wipeMark.draw(1.6);
    }, '-=0.15')
    .then(() => {});
}

function wipeOut() {
  const wipe = document.querySelector<HTMLElement>('[data-wipe]');
  const mark = wipe?.querySelector('svg');
  if (!wipe || !mark) return;
  wipeCovering = false;
  gsap
    .timeline()
    .add(() => wipeMark?.erase())
    .to(mark, { yPercent: -110, duration: 0.35, ease: 'power3.in' }, 0.05)
    .to(wipe, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.6, ease: 'power3.inOut' }, '-=0.1');
}

document.addEventListener('astro:before-preparation', (event) => {
  if (reduceMotion) return;
  const loadPage = event.loader;
  event.loader = async () => {
    await Promise.all([wipeIn(), loadPage()]);
  };
});

document.addEventListener('astro:before-swap', teardownPage);

document.addEventListener('astro:after-swap', () => {
  // The new page's <html> replaces ours, so re-add the motion flag.
  root.classList.add('js-ready');
  if (!reduceMotion) root.classList.add('js-motion');
  lenis?.resize();
  lenis?.scrollTo(window.scrollY, { immediate: true, force: true });
});

/* ---------- Header ---------- */

function initHeader(signal: AbortSignal) {
  const header = document.querySelector<HTMLElement>('[data-header]');
  if (!header) return;

  header.dataset.theme = root.dataset.startTheme ?? 'red';

  // Colour follows whichever themed section is behind the header.
  document.querySelectorAll<HTMLElement>('.theme-red, .theme-cream').forEach((section) => {
    if (section.closest('[data-header]')) return;
    const theme = section.classList.contains('theme-red') ? 'red' : 'cream';
    ScrollTrigger.create({
      trigger: section,
      start: 'top top+=40',
      end: 'bottom top+=40',
      onToggle: (self) => {
        if (self.isActive) header.dataset.theme = theme;
      },
    });
  });

  // Hide when scrolling down, come back when scrolling up.
  let lastY = window.scrollY;
  window.addEventListener(
    'scroll',
    () => {
      const y = window.scrollY;
      if (Math.abs(y - lastY) < 6) return;
      header.classList.toggle('is-hidden', y > lastY && y > 120);
      lastY = y;
    },
    { passive: true, signal },
  );

  initMobileMenu(header, signal);
}

function initMobileMenu(header: HTMLElement, signal: AbortSignal) {
  const toggle = header.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const menu = header.querySelector<HTMLElement>('[data-mobile-menu]');
  if (!toggle || !menu) return;
  const links = menu.querySelectorAll('[data-menu-link]');
  let open = false;

  const setOpen = (next: boolean) => {
    open = next;
    toggle.setAttribute('aria-expanded', String(open));
    header.classList.toggle('menu-open', open);
    gsap.killTweensOf([menu, links]);

    if (open) {
      menu.hidden = false;
      lenis?.stop();
      gsap.to(menu, { clipPath: 'inset(0% 0% 0% 0%)', duration: reduceMotion ? 0 : 0.6, ease: 'power3.inOut' });
      gsap.fromTo(
        links,
        { yPercent: 60, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.6, stagger: 0.06, delay: 0.2, ease: 'power3.out' },
      );
    } else {
      lenis?.start();
      gsap.to(menu, {
        clipPath: 'inset(0% 0% 100% 0%)',
        duration: reduceMotion ? 0 : 0.5,
        ease: 'power3.inOut',
        onComplete: () => {
          menu.hidden = true;
        },
      });
    }
  };

  toggle.addEventListener('click', () => setOpen(!open), { signal });
  document.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Escape' && open) {
        setOpen(false);
        toggle.focus();
      }
    },
    { signal },
  );
  // Close if the screen grows past phone size while open.
  matchMedia('(min-width: 48rem)').addEventListener(
    'change',
    (e) => {
      if (e.matches && open) setOpen(false);
    },
    { signal },
  );
}

/* ---------- Scroll reveals ---------- */

function initReveals() {
  if (reduceMotion) return;
  gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
    gsap.fromTo(
      el,
      { y: 40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1,
        ease: 'power3.out',
        delay: Number(el.dataset.revealDelay ?? 0),
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      },
    );
  });
}

/* ---------- Scribbles (the "designer's hand") ---------- */

let marks: Mark[] = [];

function initScribbles(signal: AbortSignal, pageDelay: number) {
  document.querySelectorAll<HTMLElement>('[data-scribble]').forEach((el) => {
    const mode = el.dataset.scribble;
    if (mode === 'manual') return;
    const mark = new Mark(el);
    marks.push(mark);

    if (reduceMotion) {
      if (mode !== 'hover') mark.show();
      return;
    }

    const delay = Number(el.dataset.delay ?? 0);
    if (mode === 'load') {
      gsap.delayedCall(pageDelay + delay, () => mark.draw());
    } else if (mode === 'scroll') {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 85%',
        once: true,
        onEnter: () => gsap.delayedCall(delay, () => mark.draw()),
      });
    }

    const hoverTarget = el.closest('a, button') ?? el;
    if (mode === 'hover') {
      hoverTarget.addEventListener('mouseenter', () => mark.draw(1.4), { signal });
      hoverTarget.addEventListener('mouseleave', () => mark.erase(), { signal });
    } else if (el.hasAttribute('data-redraw')) {
      hoverTarget.addEventListener('mouseenter', () => mark.draw(1.3), { signal });
    }
  });
}

function destroyScribbles() {
  marks.splice(0).forEach((m) => m.destroy());
}

/* ---------- Footer & email ---------- */

function initFooter(signal: AbortSignal) {
  // Copy-email buttons. The address is stored encoded so it isn't sitting
  // in the page as plain text for spam bots to collect.
  document.querySelectorAll<HTMLButtonElement>('[data-copy-email]').forEach((btn) => {
    const label = btn.querySelector<HTMLElement>('[data-copy-label]');
    const original = label?.textContent ?? '';
    let timer = 0;
    btn.addEventListener(
      'click',
      async () => {
        const email = atob(btn.dataset.copyEmail ?? '');
        try {
          await navigator.clipboard.writeText(email);
          if (label) label.textContent = 'Copied! Talk soon';
          btn.classList.add('is-copied');
        } catch {
          window.location.href = `mailto:${email}`;
        }
        clearTimeout(timer);
        timer = window.setTimeout(() => {
          if (label) label.textContent = original;
          btn.classList.remove('is-copied');
        }, 2400);
      },
      { signal },
    );
  });

  // Back to top
  document.querySelector('[data-to-top]')?.addEventListener(
    'click',
    () => (lenis ? lenis.scrollTo(0, { duration: 1.6 }) : window.scrollTo({ top: 0 })),
    { signal },
  );

}

/* ---------- Boot each page ---------- */

document.addEventListener('astro:page-load', () => {
  const arrivedViaWipe = wipeCovering;
  if (arrivedViaWipe) wipeOut();

  const { signal } = pageAbort;
  pageCtx = gsap.context(() => {
    initHeader(signal);
    initReveals();
    initScribbles(signal, arrivedViaWipe ? 0.6 : 0.2);
    initFooter(signal);
    initWork(signal, reduceMotion, arrivedViaWipe ? 0.5 : 0.1);
    initHome(signal, reduceMotion, arrivedViaWipe ? 0.5 : 0.1);
    initCase(signal, reduceMotion, arrivedViaWipe ? 0.5 : 0.1);
    initHeadspace(signal, reduceMotion, arrivedViaWipe ? 0.5 : 0.1);
    initPlanetFitness(signal, reduceMotion, arrivedViaWipe ? 0.5 : 0.1);
    initPuku(signal, reduceMotion);
    initAbout(signal, reduceMotion);
    initFunStuff(signal, reduceMotion);
    initDecks(signal, reduceMotion);
    initCasino(signal, reduceMotion);
    // Same page delay as the scribbles, so "space." spreads in step with its underline
    initElmwood(signal, reduceMotion, arrivedViaWipe ? 0.6 : 0.2);
    initCoachCedar(signal, reduceMotion, arrivedViaWipe ? 0.5 : 0.1);
    if (!reduceMotion) initCursor(signal);
  });

  // Fonts and images can change the page height; re-measure once settled.
  document.fonts.ready.then(() => ScrollTrigger.refresh());
});
