// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://fatimarabi.com',
  // Start loading the next page as soon as a link is hovered, so clicks feel instant.
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  // Hide Astro's developer toolbar in the local preview.
  devToolbar: { enabled: false },
  // Image compression. The defaults are quite aggressive (AVIF at 50%), which
  // made photos look soft. These keep files small without visible loss.
  image: {
    service: {
      entrypoint: 'astro/assets/services/sharp',
      config: {
        avif: { quality: 72 },
        webp: { quality: 88 },
        jpeg: { quality: 88, mozjpeg: true },
      },
    },
  },
});
