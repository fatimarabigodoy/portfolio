/**
 * Swipeable decks: a pile of cards you drag away, or flip with the arrows /
 * arrow keys. Used by A Cat Named Molly (Fun Stuff).
 *
 * Markup: [data-deck] > [data-deck-stack] > [data-deck-card]…, plus optional
 * [data-deck-prev], [data-deck-next] and [data-deck-current] (the counter).
 * Fires "deck:change" on [data-deck] with { index } whenever the top card changes.
 */
import gsap from 'gsap';


// A slight, fixed tilt per panel so the pile looks like a pile
const TILTS = [-2.5, 1.8, -1.2, 2.6, -2, 1.3, -2.8, 2.1];

export function initDecks(signal: AbortSignal, reduceMotion: boolean) {
  document.querySelectorAll<HTMLElement>('[data-deck]').forEach((deck) => initDeck(deck, signal, reduceMotion));
}

function initDeck(deck: HTMLElement, signal: AbortSignal, reduceMotion: boolean) {
  const stack = deck.querySelector<HTMLElement>('[data-deck-stack]');
  if (!stack) return;
  const cards = [...stack.querySelectorAll<HTMLElement>('[data-deck-card]')];
  const counter = deck.querySelector<HTMLElement>('[data-deck-current]');
  const n = cards.length;
  let index = 0;
  let busy = false;

  // Where each card sits, depending on how far it is from the top of the pile
  const place = (card: HTMLElement, depth: number) => ({
    x: 0,
    y: Math.min(depth, 3) * 10,
    scale: 1 - Math.min(depth, 3) * 0.035,
    rotation: depth === 0 ? 0 : TILTS[cards.indexOf(card) % TILTS.length],
    opacity: depth > 3 ? 0 : 1,
    zIndex: n - depth,
  });

  const layout = (animate: boolean) => {
    cards.forEach((card, i) => {
      const depth = (i - index + n) % n;
      const to = place(card, depth);
      card.classList.toggle('is-top', depth === 0);
      card.setAttribute('aria-hidden', String(depth !== 0));
      if (animate && !reduceMotion) gsap.to(card, { ...to, duration: 0.5, ease: 'power3.out', overwrite: true });
      else gsap.set(card, to);
    });
    if (counter) counter.textContent = String(index + 1);
    announce();
  };
  // Tells the page which card is on top, for any extras that follow along
  const announce = () => deck.dispatchEvent(new CustomEvent('deck:change', { detail: { index } }));
  layout(false);
  deck.classList.add('is-ready');

  const next = (dir = -1) => {
    if (busy) return;
    const top = cards[index];
    index = (index + 1) % n;
    if (reduceMotion) return layout(false);
    busy = true;
    gsap.to(top, {
      x: dir * stack.offsetWidth * 1.15,
      rotation: dir * 14,
      duration: 0.4,
      ease: 'power2.in',
      overwrite: true,
      onComplete: () => {
        // Tuck it back under the pile
        gsap.set(top, { ...place(top, n - 1), x: 0 });
        busy = false;
      },
    });
    cards.forEach((card, i) => {
      if (card === top) return;
      gsap.to(card, { ...place(card, (i - index + n) % n), duration: 0.5, ease: 'power3.out', overwrite: true });
    });
    cards.forEach((card, i) => {
      card.classList.toggle('is-top', i === index);
      card.setAttribute('aria-hidden', String(i !== index));
    });
    if (counter) counter.textContent = String(index + 1);
    announce();
  };

  const prev = () => {
    if (busy) return;
    index = (index - 1 + n) % n;
    if (reduceMotion) return layout(false);
    const back = cards[index];
    gsap.set(back, { x: -stack.offsetWidth * 1.15, rotation: -14, zIndex: n + 1, opacity: 1 });
    layout(true);
  };

  deck.querySelector('[data-deck-next]')?.addEventListener('click', () => next(), { signal });
  deck.querySelector('[data-deck-prev]')?.addEventListener('click', prev, { signal });
  stack.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') prev();
      else return;
      e.preventDefault();
    },
    { signal },
  );

  // Drag or swipe the top card away
  let startX = 0;
  let startY = 0;
  let dragging: HTMLElement | null = null;
  stack.addEventListener(
    'pointerdown',
    (e) => {
      const card = (e.target as HTMLElement).closest<HTMLElement>('[data-deck-card]');
      if (busy || !card || card !== cards[index]) return;
      dragging = card;
      startX = e.clientX;
      startY = e.clientY;
      card.setPointerCapture(e.pointerId);
    },
    { signal },
  );
  stack.addEventListener(
    'pointermove',
    (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      if (Math.abs(e.clientY - startY) > Math.abs(dx) && Math.abs(dx) < 10) return;
      gsap.set(dragging, { x: dx, rotation: dx / 25 });
    },
    { signal },
  );
  const release = (e: PointerEvent) => {
    if (!dragging) return;
    const card = dragging;
    dragging = null;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > Math.min(110, stack.offsetWidth * 0.22)) {
      next(dx < 0 ? -1 : 1);
    } else {
      gsap.to(card, { x: 0, rotation: 0, duration: 0.4, ease: 'back.out(2)' });
    }
  };
  stack.addEventListener('pointerup', release, { signal });
  stack.addEventListener('pointercancel', release, { signal });
}
