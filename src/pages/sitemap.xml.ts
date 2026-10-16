import type { APIRoute } from 'astro';
import { site } from '../data/site';

// Every page file becomes a sitemap entry, so new pages are listed automatically.
const files = Object.keys(import.meta.glob('./**/*.astro'));

export const GET: APIRoute = () => {
  const paths = files
    .filter((f) => !f.includes('[') && !f.endsWith('404.astro'))
    .map((f) => f.replace(/^\./, '').replace(/(index)?\.astro$/, '').replace(/\/?$/, '/'));
  const urls = paths.map((p) => `  <url><loc>${new URL(p, site.url)}</loc></url>`).join('\n');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml' } },
  );
};
