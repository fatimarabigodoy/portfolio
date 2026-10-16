/**
 * Puku Puku case study extras. Does nothing on other pages.
 *
 *  - "The trace": the dashed route draws itself as you scroll, each stop
 *    lights up when the line reaches it, and the counter climbs 0 → 5,000 mi.
 *  - "In the wild": the four ads on the pretend news site play together while
 *    it's on screen. "Pause the ads" stops them.
 *
 * With reduced motion the route is fully drawn, the counter reads 5,000 and
 * the ads start paused (the button can still play them).
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const MILES = 5000;

export function initPuku(signal: AbortSignal, reduceMotion: boolean) {
  if (!document.querySelector('.puku[data-case]')) return;
  initTrace(reduceMotion);
  initAds(signal, reduceMotion);
}

function initTrace(reduceMotion: boolean) {
  const route = document.querySelector<HTMLElement>('[data-trace]');
  const line = route?.querySelector<HTMLElement>('[data-trace-line]');
  const fill = route?.querySelector<HTMLElement>('[data-trace-fill]');
  if (!route || !line || !fill) return;
  const stops = [...route.querySelectorAll<HTMLElement>('[data-stop]')];
  const odos = [...document.querySelectorAll<HTMLElement>('[data-odo]')];
  const dots = stops.map((s) => s.querySelector<HTMLElement>('.stop__dot')!);

  // The line runs from the first dot to the last one (not past Vicente)
  let marks: number[] = [];
  const measure = () => {
    const top = dots[0].offsetTop + dots[0].parentElement!.offsetTop;
    const ends = dots.map((d) => d.offsetTop + d.parentElement!.offsetTop - top);
    const length = ends[ends.length - 1];
    line.style.setProperty('--trace-h', `${length}px`);
    marks = ends.map((e) => e / length);
  };
  measure();

  const show = (p: number) => {
    const miles = Math.round((p * MILES) / 10) * 10;
    const text = miles.toLocaleString('en-CA');
    odos.forEach((o) => (o.textContent = text));
    stops.forEach((s, i) => s.classList.toggle('is-reached', p >= marks[i] - 0.001));
  };

  if (reduceMotion) {
    show(1);
    // Re-measure when the page re-measures itself (fonts loading, resizing)
    ScrollTrigger.create({ trigger: line, onRefreshInit: measure });
    return;
  }

  show(0);
  gsap.fromTo(
    fill,
    { clipPath: 'inset(0 0 100% 0)' },
    {
      clipPath: 'inset(0 0 0% 0)',
      ease: 'none',
      scrollTrigger: {
        trigger: line,
        // The tip of the line follows a point 60% down the screen
        start: 'top 60%',
        end: 'bottom 60%',
        scrub: 0.4,
        onRefreshInit: measure,
        onUpdate: (self) => show(self.progress),
      },
    },
  );
}

function initAds(signal: AbortSignal, reduceMotion: boolean) {
  const paper = document.querySelector<HTMLElement>('[data-paper]');
  const toggle = document.querySelector<HTMLButtonElement>('[data-ads-toggle]');
  const label = document.querySelector<HTMLElement>('[data-ads-label]');
  if (!paper) return;
  const videos = [...paper.querySelectorAll<HTMLVideoElement>('[data-ad]')];

  let paused = reduceMotion;
  let onScreen = false;

  const sync = () => {
    const play = onScreen && !paused;
    videos.forEach((v) => {
      if (play) v.play().catch(() => {});
      else v.pause();
    });
    if (toggle) {
      toggle.classList.toggle('is-paused', paused);
      if (label) label.textContent = paused ? 'Play the ads' : 'Pause the ads';
    }
  };

  ScrollTrigger.create({
    trigger: paper,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => {
      onScreen = self.isActive;
      // Start them together so the four sizes stay in step
      if (onScreen && !paused) videos.forEach((v) => (v.currentTime = 0));
      sync();
    },
  });

  if (toggle) {
    toggle.hidden = false;
    toggle.addEventListener(
      'click',
      () => {
        paused = !paused;
        sync();
      },
      { signal },
    );
  }
  sync();
  signal.addEventListener('abort', () => videos.forEach((v) => v.pause()));
}
