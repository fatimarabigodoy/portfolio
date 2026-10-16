/**
 * Corner pin: warps a flat element so its four corners land on four points
 * of a photo (a poster screen, a phone screen). Same idea as corner pin in
 * After Effects.
 *
 *   pin(screen, [[18.4, 11.6], [44.5, 14.6], [44.5, 72.4], [18.3, 74.2]])
 *
 * Points are % of the element's parent (top-left, top-right, bottom-right,
 * bottom-left). The element keeps its own CSS size; it's re-fitted whenever
 * the parent changes size. Returns a function that stops watching.
 */
export type Quad = [number, number][];

export function pin(el: HTMLElement, quad: Quad): () => void {
  const parent = el.parentElement;
  if (!parent) return () => {};

  const fit = () => {
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const pw = parent.clientWidth;
    const ph = parent.clientHeight;
    if (!w || !h || !pw || !ph) return;
    const pts = quad.map(([x, y]) => [(x / 100) * pw, (y / 100) * ph]);
    el.style.transformOrigin = '0 0';
    el.style.transform = toMatrix(w, h, pts);
  };

  const ro = new ResizeObserver(fit);
  ro.observe(parent);
  fit();
  return () => ro.disconnect();
}

/** The perspective matrix that maps a w × h box onto the four points */
function toMatrix(w: number, h: number, [[x0, y0], [x1, y1], [x2, y2], [x3, y3]]: number[][]) {
  const dx1 = x1 - x2;
  const dx2 = x3 - x2;
  const dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2;
  const dy2 = y3 - y2;
  const dy3 = y0 - y1 + y2 - y3;
  const det = dx1 * dy2 - dx2 * dy1;
  const g = det ? (dx3 * dy2 - dx2 * dy3) / det : 0;
  const k = det ? (dx1 * dy3 - dx3 * dy1) / det : 0;
  const a = x1 - x0 + g * x1;
  const b = x3 - x0 + k * x3;
  const d = y1 - y0 + g * y1;
  const e = y3 - y0 + k * y3;
  const m = [a / w, d / w, 0, g / w, b / h, e / h, 0, k / h, 0, 0, 1, 0, x0, y0, 0, 1];
  return `matrix3d(${m.map((n) => +n.toFixed(8)).join(',')})`;
}
