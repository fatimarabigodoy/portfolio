/**
 * Elmwood case study extras. Does nothing on other pages.
 *
 *  - hero: "space." spreads its letters out and takes up more room while its
 *    underline draws, at the same pace. Hover to do it again.
 *  - the lockup (src/components/elmwood/Lockup.astro): each note switches on
 *    one layer over the logo.
 *
 * With reduced motion the word stays as it is, the logo layers switch without
 * animating.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { parsePath, stretchSwash } from '../utils/lockup';

export function initElmwood(signal: AbortSignal, reduceMotion: boolean, pageDelay: number) {
  if (!document.querySelector('.elm[data-case]')) return;
  initAnatomy(signal, reduceMotion);
  if (reduceMotion) return;
  initSpace(signal, pageDelay);
}

const SPREAD = '0.09em';

function initSpace(signal: AbortSignal, pageDelay: number) {
  const word = document.querySelector<HTMLElement>('.elm-space');
  const svg = word?.querySelector<SVGSVGElement>('.scribble__svg');
  if (!word || !svg) return;

  // Size the underline for the spread-out word from the start (in em, so it
  // scales with the headline). Then the line never has to redraw mid-stroke:
  // the pen draws it out while the letters grow into it. Measured once the
  // headline font has loaded.
  let finalWidth = 0;
  const size = () => {
    const now = word.style.letterSpacing;
    word.style.letterSpacing = SPREAD;
    const em = parseFloat(getComputedStyle(word).fontSize);
    finalWidth = word.getBoundingClientRect().width;
    word.style.letterSpacing = now;
    svg.style.width = `${finalWidth / em + 0.1}em`;
  };
  size();
  document.fonts.ready.then(size);

  // Same timing as the underline's pen (see Mark.draw in scribble.ts)
  const penTime = (speed: number) => gsap.utils.clamp(0.3, 0.9, 0.25 + finalWidth / 900) / speed;
  const spread = (speed = 1) =>
    gsap.fromTo(
      word,
      { letterSpacing: '0em' },
      { letterSpacing: SPREAD, duration: penTime(speed), ease: 'power2.inOut', overwrite: true },
    );

  // Starts with the underline (draw="load" delay={1} on the headline)
  gsap.delayedCall(pageDelay + Number(word.dataset.delay ?? 0), () => spread());
  word.addEventListener('mouseenter', () => spread(1.3), { signal });
}

/* ---------- The lockup: take it apart ---------- */

function initAnatomy(signal: AbortSignal, reduceMotion: boolean) {
  const svg = document.querySelector<SVGSVGElement>('[data-anat-svg]');
  const notes = [...document.querySelectorAll<HTMLElement>('[data-anat-note]')];
  if (!svg || !notes.length) return;
  const logo = svg.querySelector<SVGGElement>('[data-anat-logo]')!;
  const lead = svg.querySelector<SVGGElement>('[data-anat-lead]')!;
  const swash = svg.querySelector<SVGPathElement>('[data-swash]')!;
  const layers = [...svg.querySelectorAll<SVGGElement>('[data-layer]')];
  const segments = parsePath(swash.getAttribute('d') ?? '');

  // Guide lines draw themselves (straight lines, so a dash offset is smooth)
  const drawIn = (layer: Element) => {
    const lines = [...layer.querySelectorAll<SVGPathElement>('[data-draw]')];
    lines.forEach((l) => {
      const len = l.getTotalLength();
      gsap.set(l, { strokeDasharray: len, strokeDashoffset: len });
    });
    return lines;
  };

  const swashLength = { extra: 0 };
  const setSwash = () => swash.setAttribute('d', stretchSwash(segments, swashLength.extra));

  // One timeline per layer; switching layers plays one forward and the others back
  const tl = (build: (t: gsap.core.Timeline) => void) => {
    const t = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } });
    build(t);
    return t;
  };
  const states = [
    // The small word: a box round SPACE TO, Lead steps back
    tl((t) =>
      t
        .set(layers[0], { opacity: 1 })
        .to(lead, { opacity: 0.28, duration: 0.5 }, 0)
        .to(drawIn(layers[0]), { strokeDashoffset: 0, duration: 0.7, stagger: 0.15 }, 0.1),
    ),
    // The box Lead doesn't fit in: the frame draws, then the swash keeps going
    tl((t) =>
      t
        .set(layers[1], { opacity: 1 })
        .to(drawIn(layers[1]), { strokeDashoffset: 0, duration: 0.8 })
        .to(swashLength, { extra: 330, duration: 1.1, onUpdate: setSwash }, '-=0.1'),
    ),
    // Under the hood: fill drops to outlines, the points come up
    tl((t) =>
      t
        .to(logo, { fillOpacity: 0, strokeWidth: 3, duration: 0.6 })
        .to(layers[2], { opacity: 1, duration: 0.6 }, 0.25),
    ),
  ];

  let current = -1;
  const show = (n: number) => {
    if (n === current) return;
    current = n;
    states.forEach((s, i) => {
      if (reduceMotion) s.progress(i === n ? 1 : 0);
      else if (i === n) s.timeScale(1).play();
      else s.timeScale(1.8).reverse();
    });
  };

  const triggers = notes.map((note, i) =>
    ScrollTrigger.create({
      trigger: note,
      start: 'top 55%',
      end: 'bottom 55%',
      onToggle: (self) => self.isActive && show(i),
      // Back to the clean logo before the first note and after the last
      onLeaveBack: i === 0 ? () => show(-1) : undefined,
      onLeave: i === notes.length - 1 ? () => show(-1) : undefined,
    }),
  );

  signal.addEventListener('abort', () => {
    triggers.forEach((t) => t.kill());
    states.forEach((s) => s.kill());
  });
}
