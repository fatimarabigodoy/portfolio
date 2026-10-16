/**
 * Draws the "designer's hand" marks.
 *
 * Each mark's path is generated in real pixels from the size of the word it
 * sits on (and rebuilt if that size changes), so the line is never stretched,
 * circles always fit their word, and the draw-on animation stays smooth.
 */
import gsap from 'gsap';

type Pt = [number, number];
type Shape = 'underline' | 'scribble' | 'circle' | 'strike' | 'arrow';

/* ---------- geometry ---------- */

// Tiny seeded random so each word always gets the same wobble.
function rng(seedText: string) {
  let h = 2166136261;
  for (const c of seedText) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

// Smooth curve through points (Catmull-Rom → cubic Bézier).
function smooth(pts: Pt[]) {
  const f = (n: number) => n.toFixed(2);
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}

function buildPaths(shape: Shape, w: number, h: number, sw: number, rand: () => number): string[] {
  const m = sw; // keep the stroke inside the box
  const j = (amount: number) => (rand() - 0.5) * amount;

  switch (shape) {
    case 'underline':
      return [
        smooth([
          [m, h * (0.62 + j(0.15))],
          [w * 0.33, h * (0.45 + j(0.1))],
          [w * 0.68, h * (0.4 + j(0.1))],
          [w - m, h * (0.5 + j(0.15))],
        ]),
      ];

    case 'strike':
      return [
        // Nearly level, with a gentle hand wobble, so it reads right on one word or a whole phrase
        smooth([
          [m, h * (0.6 + j(0.1))],
          [w * 0.35, h * (0.48 + j(0.15))],
          [w * 0.7, h * (0.52 + j(0.15))],
          [w - m, h * (0.42 + j(0.1))],
        ]),
      ];

    case 'scribble': {
      const n = Math.round(Math.min(26, Math.max(6, w / 16)));
      const phase = rand() * Math.PI;
      const zig: Pt[] = Array.from({ length: n }, (_, i) => [
        m + ((w - 2 * m) * i) / (n - 1),
        h * 0.5 + Math.sin(i * 2.2 + phase) * h * 0.3 + j(h * 0.08),
      ]);
      return [smooth(zig)];
    }

    case 'circle': {
      const cx = w / 2;
      const cy = h / 2;
      const rx = w / 2 - m;
      const ry = h / 2 - m;
      const turns = 1.1 + rand() * 0.06; // overshoot past the start, like a real pen
      const start = -0.9 - rand() * 0.4; // begin near the top right
      const steps = 30;
      const wob = rand() * Math.PI * 2;
      const pts: Pt[] = [];
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const a = start - t * turns * Math.PI * 2;
        // starts a touch inside, ends a touch outside, so the overlap shows
        const r = 0.9 + 0.08 * t + 0.025 * Math.sin(t * 9 + wob);
        pts.push([cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r]);
      }
      return [smooth(pts)];
    }

    case 'arrow': {
      const tip: Pt = [w * 0.9, h * 0.16];
      return [
        smooth([
          [m, h * 0.86],
          [w * 0.35, h * 0.86],
          [w * 0.68, h * 0.6],
          tip,
        ]),
        // The head is sized from the height, so long arrows keep a normal-sized head
        `M${tip[0] - h * 0.4} ${tip[1]} L${tip[0]} ${tip[1]} L${tip[0] - h * 0.067} ${tip[1] + h * 0.4}`,
      ];
    }
  }
}

/* ---------- one mark ---------- */

export class Mark {
  el: HTMLElement;
  svg: SVGSVGElement;
  shape: Shape;
  paths: SVGPathElement[];
  lens: number[] = [];
  drawn = false;
  tl: gsap.core.Timeline | null = null;
  private ro: ResizeObserver;
  private key = '';

  constructor(el: HTMLElement) {
    this.el = el;
    this.svg = el.querySelector('svg')!;
    this.shape = (el.dataset.shape ?? 'underline') as Shape;
    this.paths = Array.from(this.svg.querySelectorAll('path'));
    this.build();
    this.ro = new ResizeObserver(() => this.build());
    this.ro.observe(this.svg);
  }

  build() {
    const { width: w, height: h } = this.svg.getBoundingClientRect();
    if (!w || !h) return;
    const key = `${w.toFixed(1)}x${h.toFixed(1)}`;
    if (key === this.key) return;
    this.key = key;

    const sw = parseFloat(getComputedStyle(this.svg).strokeWidth) || 2.5;
    this.svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    const ds = buildPaths(this.shape, w, h, sw, rng(this.shape + this.el.textContent));
    this.paths.forEach((p, i) => p.setAttribute('d', ds[i] ?? ''));
    this.lens = this.paths.map((p) => p.getTotalLength());

    // Keep whatever state it was in (drawn or hidden) after a resize.
    this.tl?.kill();
    this.paths.forEach((p, i) => {
      const len = this.lens[i];
      gsap.set(p, {
        strokeDasharray: `${len} ${len + 40}`,
        strokeDashoffset: this.drawn ? 0 : len,
        opacity: this.drawn ? 1 : 0,
      });
    });
  }

  draw(speed = 1) {
    this.tl?.kill();
    this.drawn = true;
    const tl = gsap.timeline();
    this.paths.forEach((p, i) => {
      const len = this.lens[i];
      // longer strokes take a little longer, like a hand would
      const dur = gsap.utils.clamp(0.3, 0.9, 0.25 + len / 900) / speed;
      tl.fromTo(
        p,
        { strokeDashoffset: len, opacity: 1 },
        { strokeDashoffset: 0, duration: dur, ease: i === 0 ? 'power2.inOut' : 'power2.out' },
        i === 0 ? 0 : '>-0.04',
      );
    });
    this.tl = tl;
    return tl;
  }

  // The pen lifts off: the line disappears from its start toward its end.
  erase() {
    this.tl?.kill();
    this.drawn = false;
    const tl = gsap.timeline();
    this.paths.forEach((p, i) => {
      tl.to(p, { strokeDashoffset: -this.lens[i], duration: 0.3, ease: 'power2.in' }, 0);
    });
    tl.set(this.paths, { opacity: 0 });
    this.tl = tl;
    return tl;
  }

  show() {
    this.tl?.kill();
    this.drawn = true;
    gsap.set(this.paths, { strokeDashoffset: 0, opacity: 1 });
  }

  destroy() {
    this.ro.disconnect();
    this.tl?.kill();
  }
}
