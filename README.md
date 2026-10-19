# Weikun Tian — personal website

An exhibition-style homepage for an experimental physicist, in three rooms:

1. **01 — Research**: experimental photography with a scroll-driven 3D year cylinder (CSS 3D + GSAP ScrollTrigger).
2. **02 — Publications**: an interactive archive box of dossiers (React Three Fiber), with a text index alongside.
3. **03 — Field Notes**: a slowly moving filmstrip of personal photographs (GSAP ticker, drag, pause).

Stack: Astro 5 · React 19 · TypeScript · GSAP · React Three Fiber / drei · React Bits (`FadeContent`, `Noise`).

## Run it

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # type-check + static build into dist/
npm run preview   # serve the built site
```

## Replacing the demonstration content

Everything marked `demo: true` is placeholder material and is labelled as such on the site.

| What | Where |
| --- | --- |
| Name, role, field, affiliation, biography, links | `src/content/profile/profile.md` |
| Research projects (year, title, photo, caption, location) | `src/content/research/*.md` — one file per project; several may share a year |
| Publications (title, authors, year, venue, summary, figure, DOI/PDF/preprint, order) | `src/content/publications/*.md` |
| Field notes (title, date, location, cover, frame number) | `src/content/notes/*.md` |
| Images | `src/assets/…` — referenced relatively from the Markdown; Astro optimises them to WebP |

All current photographs in `src/assets/demo/` are procedurally generated illustrations, not real photographs.
Publication figures are drawn as illustrative placeholders unless a `figure:` image is supplied.

## Notes

- `docs/reference-concept.png` is the visual reference the design follows.
- Header links to Publications / Field Notes jump instantly (no smooth scroll) so they skip the research timeline.
- Reduced motion, touch devices and narrow screens get a non-sticky research section, a static filmstrip with native
  horizontal scrolling, and colour photographs. If WebGL is unavailable, the archive falls back to a static drawing.
- Set the real domain in `astro.config.mjs` (`site`) before deploying.
- React Bits components are MIT + Commons Clause; see `src/components/reactbits/README.md`.
