/**
 * Headspace case study extras. Does nothing on other pages.
 *
 *  - hero: search bars type themselves out, pile up and fade, and the
 *    "57 tabs open" count goes up with every new one
 *  - truth #1: a search interrupts the paragraph, typed out as it scrolls in
 *  - sponsored: a phone search at 2:47 a.m. with Headspace on top; tapping it rolls the tab count down
 *  - close-a-tab: hold to breathe in, let go to close a tab
 *  - the line: the screen pins while the tabs close one by one, revealing the headline
 *
 * With reduced motion everything is simply shown, still (the phone screen is
 * still pinned onto the photo, since that isn't motion).
 */
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { pin, type Quad } from '../utils/corner-pin';

gsap.registerPlugin(ScrollTrigger);

export function initHeadspace(signal: AbortSignal, reduceMotion: boolean, pageDelay: number) {
  if (!document.querySelector('.hs[data-case]')) return;

  initSearchAd(signal, reduceMotion);
  if (reduceMotion) return;

  initStack(signal, pageDelay);
  initHeckle(signal);
  initBreath(signal);
  initClose();
}

/** Plays a timeline only while its element is on screen */
function whileVisible(el: Element, tl: gsap.core.Timeline | gsap.core.Tween) {
  ScrollTrigger.create({
    trigger: el,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => (self.isActive ? tl.play() : tl.pause()),
  });
}

/** Pins an element onto its photo using the corners in its data-quad */
function pinFromData(el: HTMLElement, signal: AbortSignal) {
  const quad: Quad = JSON.parse(el.dataset.quad ?? '[]');
  if (quad.length !== 4) return;
  const stop = pin(el, quad);
  el.classList.add('is-pinned');
  signal.addEventListener('abort', stop);
}

/* ---------- Sponsored: the search ad on the phone ---------- */

function initSearchAd(signal: AbortSignal, reduceMotion: boolean) {
  const screen = document.querySelector<HTMLElement>('[data-ad-screen]');
  if (!screen) return;
  pinFromData(screen, signal);
  if (reduceMotion) return;

  const input = screen.querySelector<HTMLElement>('[data-ad-input]')!;
  const suggest = screen.querySelector<HTMLElement>('[data-ad-suggest]')!;
  const items = [...suggest.querySelectorAll<HTMLElement>('li')];
  const results = screen.querySelector<HTMLElement>('[data-ad-results]')!;
  const card = screen.querySelector<HTMLElement>('[data-ad-card]')!;
  const others = [...screen.querySelectorAll<HTMLElement>('[data-ad-other]')];
  const keys = screen.querySelector<HTMLElement>('[data-ad-keys]')!;
  const tabs = screen.querySelector<HTMLElement>('[data-ad-tabs]')!;
  const finger = screen.querySelector<HTMLElement>('[data-ad-finger]')!;
  const query = screen.dataset.query ?? '';
  const keyFor = (ch: string) => screen.querySelector<HTMLElement>(`[data-key="${ch === ' ' ? ' ' : ch.toLowerCase()}"]`);

  // Which suggestions show after how many letters
  const lateFrom = query.indexOf('turn') + 4;
  const showSuggestions = (typed: number) => {
    items.forEach((li) => {
      const wave = li.dataset.wave;
      li.hidden = typed < 3 || (wave === 'early' ? typed >= lateFrom : typed < lateFrom);
    });
  };

  const typing = { n: 0 };
  let lastKey: HTMLElement | null = null;
  const typeDur = query.length * 0.085;

  const tl = gsap.timeline({ repeat: -1, paused: true, repeatDelay: 0.6 });
  tl
    // Fresh search page with the keyboard up
    .set(results, { opacity: 0, y: 10 })
    .set(others, { opacity: 1, height: 'auto', paddingBlock: 12, borderBottomWidth: 1 })
    .set(suggest, { opacity: 1 })
    .set(keys, { translate: '0 0%' })
    .add(() => {
      input.textContent = '';
      tabs.textContent = '57';
      card.classList.remove('is-pressed');
      screen.classList.add('is-typing');
      showSuggestions(0);
    })
    .to(
      typing,
      {
        n: query.length,
        duration: typeDur,
        ease: 'none',
        onUpdate: () => {
          const n = Math.round(typing.n);
          if (input.textContent!.length === n) return;
          input.textContent = query.slice(0, n);
          showSuggestions(n);
          lastKey?.classList.remove('is-down');
          lastKey = keyFor(query[n - 1] ?? '');
          lastKey?.classList.add('is-down');
        },
      },
      0.8
    )
    // "go": keyboard drops, results load
    .add(() => {
      lastKey?.classList.remove('is-down');
      screen.querySelector('.ad__key--go')?.classList.add('is-down');
    }, `+=0.5`)
    .add(() => {
      screen.querySelector('.ad__key--go')?.classList.remove('is-down');
      screen.classList.remove('is-typing');
    }, '+=0.15')
    .to(keys, { translate: '0 100%', duration: 0.45, ease: 'power2.in' })
    .to(suggest, { opacity: 0, duration: 0.2 }, '<')
    .to(results, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '+=0.25')
    .addLabel('results')
    // A beat to read it, then the tap
    .set(finger, { left: '62%', top: '36%', scale: 1.4 }, '+=2.6')
    .to(finger, { opacity: 1, scale: 1, duration: 0.25, ease: 'power2.out' })
    .add('tap')
    .to(finger, { opacity: 0, scale: 1.3, duration: 0.35 }, '+=0.15')
    .call(closeTabs, [], 'tap')
    .to({}, { duration: 4.2 });

  // The tap: the ad lights up, the other results close, the count rolls down
  function closeTabs() {
    card.classList.add('is-pressed');
    gsap.delayedCall(0.25, () => card.classList.remove('is-pressed'));
    const count = { n: 57 };
    gsap.to(count, {
      n: 1,
      duration: 2,
      ease: 'power2.inOut',
      onUpdate: () => (tabs.textContent = String(Math.round(count.n))),
    });
    gsap.to(others, {
      opacity: 0,
      height: 0,
      paddingBlock: 0,
      borderBottomWidth: 0,
      duration: 0.5,
      stagger: 0.35,
      ease: 'power2.inOut',
      delay: 0.3,
    });
  }

  // Tapping the ad yourself skips straight to the good part
  card.addEventListener(
    'click',
    () => {
      const t = tl.labels.results;
      if (tl.time() >= t && tl.time() < tl.labels.tap) tl.seek('tap', false);
    },
    { signal }
  );

  whileVisible(screen, tl);
  signal.addEventListener('abort', () => {
    tl.kill();
    gsap.killTweensOf(others);
  });
}

/* ---------- Close-a-Tab: hold to breathe in, let go to close a tab ---------- */

function initBreath(signal: AbortSignal) {
  const device = document.querySelector<HTMLElement>('[data-breath-screen]');
  if (!device) return;
  const dot = device.querySelector<HTMLElement>('[data-breath-dot]')!;
  const cue = device.querySelector<HTMLElement>('[data-breath-cue]')!;
  const hint = device.querySelector<HTMLElement>('[data-breath-hint]')!;
  const count = device.querySelector<HTMLElement>('[data-breath-count]')!;
  const tabs = [...device.querySelectorAll<HTMLElement>('[data-breath-tab]')];
  const pips = [...device.querySelectorAll<HTMLElement>('[data-breath-pip]')];
  const live = document.querySelector<HTMLElement>('[data-breath-live]');
  const startHint = hint.textContent ?? '';

  // Close them in a scattered order
  const order = [2, 4, 0, 5, 1, 3].filter((i) => i < tabs.length);
  let closed = 0;
  let held = 0; // when the current breath in started (0 = not breathing in)
  let touched = false; // once someone has a go, the demo stops for good
  let onScreen = false;

  // The tabs drift a little, like they can't sit still
  const drift = tabs.map((tab, i) =>
    gsap.to(tab, {
      x: gsap.utils.random(-6, 6),
      y: gsap.utils.random(-5, 5),
      rotation: gsap.utils.random(-1.5, 1.5),
      duration: gsap.utils.random(2.2, 3.4),
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      delay: i * 0.2,
      paused: true,
    })
  );

  const say = (text: string) => (cue.textContent = text);

  function breatheIn() {
    if (closed >= tabs.length) return reset();
    held = performance.now();
    gsap.to(dot, { scale: 1.55, duration: 3.5, ease: 'sine.out', overwrite: true });
    say('Breathe in…');
  }

  function breatheOut(quiet = false) {
    if (!held) return;
    const length = performance.now() - held;
    held = 0;
    gsap.to(dot, { scale: 1, duration: 1.8, ease: 'sine.inOut', overwrite: true });
    if (length >= 700) {
      say('Breathe out…');
      closeOne();
    } else if (!quiet && length >= 250) {
      say('Longer than that.');
      gsap.delayedCall(1.4, () => !held && closed < tabs.length && say('Hold to breathe in'));
    } else {
      say('Hold to breathe in');
    }
  }

  function closeOne() {
    const tab = tabs[order[closed]];
    if (!tab) return;
    pips[closed]?.classList.add('is-done');
    closed++;
    const left = tabs.length - closed;
    count.textContent = `${left} open`;
    gsap
      .timeline()
      .to(tab.querySelector('.breath__search'), { opacity: 0, duration: 0.15 })
      .to(tab.querySelector('.breath__x'), { opacity: 1, duration: 0.15 }, '<')
      .to(tab, { opacity: 0, scale: 0.85, y: '-=14', duration: 0.7, ease: 'power2.in' }, '+=0.25');

    if (left === 0) {
      gsap.delayedCall(1.6, () => {
        say('That’s all of them');
        hint.textContent = 'Tabs closed: 6. Brain: noticeably less loud.';
        if (live) live.textContent = 'All tabs closed.';
      });
      // Tidy up and go again after a while
      gsap.delayedCall(touched ? 9 : 6, () => closed >= tabs.length && reset());
    } else if (live) {
      live.textContent = `${left} tabs open`;
    }
  }

  function reset() {
    gsap.killTweensOf(reset);
    closed = 0;
    pips.forEach((p) => p.classList.remove('is-done'));
    count.textContent = `${tabs.length} open`;
    hint.textContent = startHint;
    say('Hold to breathe in');
    tabs.forEach((tab, i) => {
      gsap.set(tab.querySelector('.breath__x'), { opacity: 0 });
      gsap.set(tab.querySelector('.breath__search'), { opacity: 1 });
      gsap.fromTo(tab, { opacity: 0, scale: 0.9, y: 0 }, { opacity: 1, scale: 1, duration: 0.5, delay: i * 0.12 });
    });
  }

  // The demo: it breathes by itself until someone has a go
  const demo = gsap.timeline({ repeat: -1, paused: true, delay: 1 });
  demo
    .call(() => closed < tabs.length && breatheIn())
    .to({}, { duration: 2.6 })
    .call(() => breatheOut(true))
    .to({}, { duration: 2.2 });

  const stopDemo = () => {
    if (touched) return;
    touched = true;
    demo.kill();
    held = 0;
  };

  // Mouse and touch
  device.addEventListener(
    'pointerdown',
    (e) => {
      if (e.button > 0) return;
      stopDemo();
      breatheIn();
    },
    { signal }
  );
  const release = () => breatheOut();
  device.addEventListener('pointerup', release, { signal });
  device.addEventListener('pointerleave', release, { signal });
  // A scroll that started on the phone: let it go without a telling-off
  device.addEventListener('pointercancel', () => breatheOut(true), { signal });
  device.addEventListener('contextmenu', (e) => e.preventDefault(), { signal });

  // Keyboard: hold Space or Enter
  device.addEventListener(
    'keydown',
    (e) => {
      if (e.key !== ' ' && e.key !== 'Enter') return;
      e.preventDefault();
      if (e.repeat) return;
      stopDemo();
      breatheIn();
    },
    { signal }
  );
  device.addEventListener(
    'keyup',
    (e) => {
      if (e.key !== ' ' && e.key !== 'Enter') return;
      e.preventDefault();
      breatheOut();
    },
    { signal }
  );

  ScrollTrigger.create({
    trigger: device,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => {
      onScreen = self.isActive;
      drift.forEach((t) => (onScreen ? t.play() : t.pause()));
      if (!touched) onScreen ? demo.play() : demo.pause();
    },
  });

  signal.addEventListener('abort', () => {
    demo.kill();
    drift.forEach((t) => t.kill());
    gsap.killTweensOf([dot, ...tabs, reset]);
  });
}

/** Random-ish typing speed, so it feels like a person (in milliseconds) */
const keystroke = () => 28 + Math.random() * 45;

/* ---------- Hero: the search stack ---------- */

function initStack(signal: AbortSignal, pageDelay: number) {
  const stack = document.querySelector<HTMLElement>('[data-stack]');
  const count = document.querySelector<HTMLElement>('[data-tab-count]');
  if (!stack) return;
  const queries: string[] = JSON.parse(stack.dataset.queries ?? '[]');
  const bars = [...stack.querySelectorAll<HTMLElement>('.stack__bar')];
  if (!queries.length || bars.length < 2) return;

  // slots[0] is the bottom (newest) bar, the last one is the top (oldest)
  const slots = [...bars].sort((a, b) => slotOf(a) - slotOf(b));
  const textOf = (bar: HTMLElement) => bar.querySelector<HTMLElement>('.q__text')!;

  // The older bars show the end of the list; the bottom one types the first query
  slots.forEach((bar, i) => {
    textOf(bar).textContent = i === 0 ? '' : queries[(queries.length - i) % queries.length];
  });
  let next = 0;
  let tabs = Number(count?.textContent) || 57;

  // A tiny scheduler that waits while the hero is off screen or the tab is hidden
  let onScreen = true;
  let pending: (() => void) | null = null;
  let timer = 0;
  const running = () => onScreen && !document.hidden;
  const later = (fn: () => void, ms: number) => {
    timer = window.setTimeout(() => (running() ? fn() : (pending = fn)), ms);
  };
  const resume = () => {
    if (running() && pending) {
      const fn = pending;
      pending = null;
      fn();
    }
  };

  const type = () => {
    const bar = slots[0];
    const text = textOf(bar);
    const query = queries[next % queries.length];
    next++;
    bar.classList.add('is-typing');
    let i = 0;
    const key = () => {
      text.textContent = query.slice(0, ++i);
      if (i < query.length) later(key, keystroke());
      else later(push, 1100);
    };
    later(key, 350);
  };

  // Everything moves up a slot; the oldest bar fades away and comes back as the new bottom one
  const push = () => {
    slots[0].classList.remove('is-typing');
    const oldest = slots.pop()!;
    slots.unshift(oldest);
    if (count && tabs < 99) count.textContent = String(++tabs);

    gsap
      .timeline({ onComplete: type })
      .to(oldest, { opacity: 0, duration: 0.35, ease: 'power1.out' })
      .to(slots.slice(1), { '--slot': (i: number) => i + 1, duration: 0.7, ease: 'power3.inOut' }, 0)
      .add(() => {
        gsap.set(oldest, { '--slot': 0 });
        textOf(oldest).textContent = '';
      })
      .to(oldest, { opacity: 1, duration: 0.3, clearProps: 'opacity' });
  };

  ScrollTrigger.create({
    trigger: stack,
    start: 'top bottom',
    end: 'bottom top',
    onToggle: (self) => {
      onScreen = self.isActive;
      resume();
    },
  });
  document.addEventListener('visibilitychange', resume, { signal });

  // Start once the headline has landed
  later(type, (pageDelay + 1) * 1000);

  signal.addEventListener('abort', () => {
    window.clearTimeout(timer);
    gsap.killTweensOf(bars);
  });
}

function slotOf(el: HTMLElement) {
  return Number(el.style.getPropertyValue('--slot')) || 0;
}

/* ---------- Truth #1: the heckle ---------- */

function initHeckle(signal: AbortSignal) {
  const heckle = document.querySelector<HTMLElement>('[data-heckle]');
  const text = heckle?.querySelector<HTMLElement>('[data-text]');
  if (!heckle || !text) return;
  const query = text.dataset.text ?? '';
  text.textContent = '';
  let timer = 0;

  ScrollTrigger.create({
    trigger: heckle,
    start: 'top 75%',
    once: true,
    onEnter: () => {
      heckle.classList.add('is-typing');
      let i = 0;
      const key = () => {
        text.textContent = query.slice(0, ++i);
        timer = window.setTimeout(i < query.length ? key : () => heckle.classList.remove('is-typing'), i < query.length ? keystroke() + 25 : 1200);
      };
      timer = window.setTimeout(key, 500);
    },
  });
  signal.addEventListener('abort', () => window.clearTimeout(timer));
}

/* ---------- The line: close your mental tabs ---------- */

function initClose() {
  const stage = document.querySelector<HTMLElement>('[data-close-stage]');
  const tabs = gsap.utils.toArray<HTMLElement>('[data-close-tab]');
  const after = document.querySelector<HTMLElement>('[data-close-after]');
  if (!stage || !tabs.length) return;

  // Close them in a scattered order rather than top to bottom
  const order = [4, 0, 7, 2, 8, 1, 5, 3, 6].filter((i) => i < tabs.length);

  const tl = gsap.timeline({
    scrollTrigger: { trigger: stage, start: 'top top', end: '+=140%', pin: true, scrub: 0.6 },
  });
  order.forEach((index, n) => {
    const tab = tabs[index];
    const at = n * 0.45;
    tl.to(tab.querySelector('.close__search'), { opacity: 0, duration: 0.15 }, at)
      .to(tab.querySelector('.close__x'), { opacity: 1, duration: 0.15 }, at)
      .to(tab, { opacity: 0, scale: 0.85, y: -14, duration: 0.45, ease: 'power2.in' }, at + 0.2);
  });
  if (after) tl.fromTo(after, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6 }, '+=0.1');
  tl.to({}, { duration: 0.4 }); // a beat of calm before the page moves on

  // The pin adds scroll space, so everything below it needs re-measuring
  ScrollTrigger.sort();
  ScrollTrigger.refresh();
}
