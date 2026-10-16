/**
 * Coach Cedar case study extras. Does nothing on other pages.
 *
 *  - hero: the coach's check-ins arrive one at a time, each new one sliding
 *    in on top and nudging the older ones down, like a phone's notifications
 *
 * With reduced motion the notifications are simply there.
 */
import gsap from 'gsap';

export function initCoachCedar(_signal: AbortSignal, reduceMotion: boolean, pageDelay: number) {
  if (!document.querySelector('.cc[data-case]')) return;
  if (reduceMotion) return;
  initLock(pageDelay);
}

function initLock(pageDelay: number) {
  // Newest is first in the list, so they arrive bottom-up
  const notes = gsap.utils.toArray<HTMLElement>('[data-lock] .note').reverse();
  if (!notes.length) return;
  gsap.set(notes, { height: 0, opacity: 0, marginBottom: 0, paddingBlock: 0, scale: 0.92 });
  const tl = gsap.timeline({ delay: pageDelay + 1.3 });
  notes.forEach((note, i) => {
    tl.to(
      note,
      {
        height: 'auto',
        marginBottom: '0.6rem',
        paddingBlock: '0.75rem',
        duration: 0.45,
        ease: 'power3.out',
      },
      i === 0 ? 0 : '+=1.1',
    ).to(note, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.8)' }, '<0.15');
  });
}
