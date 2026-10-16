/**
 * Geometry for the Space to Lead lockup (path data in src/data/elmwood-lockup.ts).
 * Used on the server (to draw the anchor points) and in the browser (to make
 * the d's swash longer without squashing it).
 *
 * All numbers are in the logo's own units (the SVG is 1367 × 686).
 */

/** Which way the swash points: up and to the right, about 39° (measured from the vector) */
const SWASH_DIR = { x: Math.cos((39 * Math.PI) / 180), y: -Math.sin((39 * Math.PI) / 180) };
/** Where the swash starts leaving the d's bowl, and the middle of its rounded tip */
const SWASH_BASE = { x: 990, y: 350 };
const SWASH_TIP = { x: 1352, y: 8 };
/** The swash eases into the stretch over this distance, so the join to the bowl stays smooth */
const EASE_IN = 140;

type Segment = { cmd: string; nums: number[] };

/** Split a path into commands with their numbers (the lockup only uses absolute M, L, C, H, Z) */
export function parsePath(d: string): Segment[] {
  const segments: Segment[] = [];
  for (const [, cmd, args] of d.matchAll(/([A-Za-z])([^A-Za-z]*)/g)) {
    segments.push({ cmd, nums: (args.match(/-?\d*\.?\d+(?:e-?\d+)?/g) ?? []).map(Number) });
  }
  return segments;
}

const along = (x: number, y: number) => (x - SWASH_BASE.x) * SWASH_DIR.x + (y - SWASH_BASE.y) * SWASH_DIR.y;
const ramp = (t: number) => (t <= 0 ? 0 : t < EASE_IN ? (t * t) / (2 * EASE_IN) : t - EASE_IN / 2);
const TIP_RAMP = ramp(along(SWASH_TIP.x, SWASH_TIP.y));

/**
 * The d with its swash `extra` units longer (negative = shorter). Every point
 * slides along the swash's own direction, more the further up it is, so the
 * stroke keeps its thickness and the tip moves by exactly `extra`.
 */
export function stretchSwash(segments: Segment[], extra: number): string {
  let out = '';
  for (const { cmd, nums } of segments) {
    out += cmd;
    for (let i = 0; i + 1 < nums.length; i += 2) {
      const x = nums[i];
      const y = nums[i + 1];
      const shift = (extra * ramp(along(x, y))) / TIP_RAMP;
      out += `${(x + SWASH_DIR.x * shift).toFixed(1)} ${(y + SWASH_DIR.y * shift).toFixed(1)} `;
    }
  }
  return out;
}

/** Anchor points and handle lines, the way Illustrator shows them */
export function anchorsOf(d: string) {
  const anchors: [number, number][] = [];
  let handles = '';
  let at: [number, number] = [0, 0];
  for (const { cmd, nums } of parsePath(d)) {
    if (cmd === 'M' || cmd === 'L') {
      for (let i = 0; i + 1 < nums.length; i += 2) {
        at = [nums[i], nums[i + 1]];
        anchors.push(at);
      }
    } else if (cmd === 'H') {
      for (const x of nums) {
        at = [x, at[1]];
        anchors.push(at);
      }
    } else if (cmd === 'C') {
      for (let i = 0; i + 5 < nums.length; i += 6) {
        const [x1, y1, x2, y2, x, y] = nums.slice(i, i + 6);
        handles += `M${at[0]} ${at[1]}L${x1} ${y1}M${x2} ${y2}L${x} ${y}`;
        at = [x, y];
        anchors.push(at);
      }
    }
  }
  return { anchors, handles };
}
