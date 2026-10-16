# fatimarabi.com

Astro 7 + GSAP (ScrollTrigger) + Lenis. Owner doesn't code: explain changes plainly.

- Dev server: preview config "site" in `.claude/launch.json` (port 4321). If npm hits cache permission errors, pass `--cache <scratchpad>/npm-cache`.
- Design tokens (colours, type scale, spacing, easing): `src/styles/global.css`. Shared text (email, socials, nav): `src/data/site.ts`.
- Every page uses `src/layouts/Base.astro` (header, footer, red page wipe, ClientRouter). Pass `headerTheme="cream"` if a page starts on cream.
- Sections use `.theme-red` / `.theme-cream`; the header switches colours from these automatically.
- `src/scripts/motion.ts` runs once and re-wires each page on `astro:page-load`. Per-page listeners must use the `signal` passed in so they're removed on navigation.
- Motion hooks: `data-reveal` (fade-up on scroll); `<Scribble type="underline|scribble|circle|strike|arrow" draw="scroll|load|hover|manual" redraw>`. Scribble paths are generated in pixels per word by `src/scripts/scribble.ts` (no stretched viewBox / pathLength, which caused jittery drawing).
- Email is never shown as text: copy buttons use `data-copy-email={btoa(site.email)}`.
- Astro drops whitespace between text and a component on a new line; add `{' '}`.
- Always respect `prefers-reduced-motion`.
- `raw-assets/` is git-ignored (originals, ~290MB). Optimised copies go in `src/assets/`.
