import type { ImageMetadata } from 'astro';

/**
 * Which sizes of a picture to make. Always includes the original's own width
 * (up to `max`), so sharp screens get the full detail instead of an upscaled
 * smaller copy. Sizes bigger than the original are skipped (no upscaling).
 */
export function widthsFor(image: ImageMetadata, steps = [600, 900, 1200, 1800, 2400], max = 2400) {
  const top = Math.min(image.width, max);
  return [...new Set([...steps.filter((w) => w < top), top])];
}
