/**
 * Casino Mining case study extras. Does nothing on other pages.
 *
 *  - the ask: the list of deliverables drops in like a pile of new requests
 *
 * With reduced motion the list is simply there.
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initCasino(_signal: AbortSignal, reduceMotion: boolean) {
  if (!document.querySelector('.cas[data-case]')) return;
  if (reduceMotion) return;
  initPile();
}

/* ---------- The pile of deliverables ---------- */

function initPile() {
  const pile = document.querySelector<HTMLElement>('[data-pile]');
  if (!pile) return;
  const items = [...pile.children] as HTMLElement[];
  gsap.set(items, { opacity: 0, y: -28 });
  ScrollTrigger.create({
    trigger: pile,
    start: 'top 85%',
    once: true,
    onEnter: () =>
      gsap.to(items, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: 'back.out(2.2)',
        // Speeds up as it goes, like the requests did
        stagger: { each: 0.13, ease: 'power2.in' },
      }),
  });
}
