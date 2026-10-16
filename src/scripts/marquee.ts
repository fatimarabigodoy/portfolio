/**
 * Endless moving strip (Home logo strip, Casino wildlife parade).
 *
 * Markup inside `root`: a [data-marquee-track] holding the list twice, and an
 * optional pause button [data-marquee-toggle] with a [data-marquee-label]
 * whose text reads "Pause …"; the play wording is made from it.
 *
 * The strip slides by exactly one copy and loops, so there's never a gap.
 * Page scroll gives it a push (backwards when scrolling up), hover slows it,
 * the button pauses it. With reduced motion it doesn't run at all.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface Options {
  /** Pixels per second at rest */
  speed?: number;
  /** Travel left to right instead of right to left */
  reverse?: boolean;
}

export function initMarquee(
  root: HTMLElement | null,
  signal: AbortSignal,
  reduceMotion: boolean,
  { speed: SPEED = 45, reverse = false }: Options = {},
) {
  const track = root?.querySelector<HTMLElement>('[data-marquee-track]');
  if (!root || !track || reduceMotion) return;

  let loop: gsap.core.Tween | null = null;

  // One copy of the list is half the track. Slide by that, then loop.
  const build = () => {
    const progress = loop?.progress() ?? 0;
    loop?.kill();
    const distance = track.scrollWidth / 2;
    loop = gsap.fromTo(
      track,
      { x: reverse ? -distance : 0 },
      { x: reverse ? 0 : -distance, duration: distance / SPEED, ease: 'none', repeat: -1 },
    );
    // Start deep into the loop so it can also run backwards (scrolling up) without hitting the start
    loop.totalTime(loop.duration() * (1000 + progress));
    apply();
  };

  // Speed is made of three parts: paused or not, hover (slows down), scroll push.
  let paused = false;
  const speed = { hover: 1, push: 1 };
  const apply = () => loop?.timeScale(paused ? 0 : speed.hover * speed.push);
  const pushTo = gsap.quickTo(speed, 'push', { duration: 0.8, ease: 'power3.out', onUpdate: apply });
  const hoverTo = gsap.quickTo(speed, 'hover', { duration: 0.6, ease: 'power2.out', onUpdate: apply });

  let settle: gsap.core.Tween | null = null;
  ScrollTrigger.create({
    trigger: root,
    start: 'top bottom',
    end: 'bottom top',
    onUpdate: (self) => {
      // Scrolling down speeds it up; scrolling up runs it backwards for a moment
      const v = self.getVelocity();
      const boost = gsap.utils.clamp(1, 6, 1 + Math.abs(v) / 250);
      pushTo(v < 0 ? -boost : boost);
      settle?.kill();
      settle = gsap.delayedCall(0.15, () => pushTo(1));
    },
  });

  if (matchMedia('(hover: hover)').matches) {
    root.addEventListener('mouseenter', () => hoverTo(0.25), { signal });
    root.addEventListener('mouseleave', () => hoverTo(1), { signal });
  }

  const toggle = root.querySelector<HTMLButtonElement>('[data-marquee-toggle]');
  const label = root.querySelector<HTMLElement>('[data-marquee-label]');
  const pauseText = label?.textContent ?? '';
  const playText = pauseText.replace(/^Pause/, 'Play');
  toggle?.addEventListener(
    'click',
    () => {
      paused = !paused;
      toggle.setAttribute('aria-pressed', String(paused));
      if (label) label.textContent = paused ? playText : pauseText;
      apply();
    },
    { signal },
  );

  // Pictures can finish loading after we measure; rebuild when the size changes.
  const ro = new ResizeObserver(() => build());
  ro.observe(track);
  signal.addEventListener('abort', () => {
    ro.disconnect();
    loop?.kill();
  });
}
