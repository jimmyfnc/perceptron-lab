# Perceptron Lab — Interactive ML Field Manual

A portfolio-grade educational site teaching ML → deep learning → CNNs → transformers →
diffusion through hand-built interactive visualizations. Hosted on **Lovable** (do not
swap the framework). Design brief and IA: `docs/brainstorms/2026-06-11-ml-journey-site-brainstorm.md`.
Remaining work: `docs/TODO.md`.

## Commands

- `bun install` — install deps (this repo uses bun; do NOT use npm, it creates a stale package-lock)
- `bun run dev` — dev server on http://localhost:8080
- `bun run build` — production build (client + SSR); also regenerates `routeTree.gen.ts`
- `bun run lint` / `bun run format` — eslint / prettier (prettier enforces LF; run format after writing files on Windows to fix CRLF)
- `bun run test` — vitest (standalone `vitest.config.ts`; intentionally does NOT inherit
  `vite.config.ts`, which loads the TanStack/Lovable plugins). Unit-test pure logic in
  `src/lib/` (`*.test.ts` colocated); interactives are verified visually in the browser.
- Update `CHANGELOG.md` (dated Keep-a-Changelog entries) with every meaningful change.

## Stack

React 19 + TanStack Start (file routes in `src/routes/`) + Vite 7 + Tailwind 4 +
shadcn/Radix (in `src/components/ui/`, mostly unused — keep). **No chart libraries for
visualizations**: interactives are hand-rolled Canvas 2D / SVG. Fonts load via Google
Fonts `<link>` in `__root.tsx` (no @fontsource deps). Avoid adding dependencies; if one
is truly needed (e.g. three + react-three-fiber for the neural-nets module), add with
`bun add` and lazy-load it per-route.

## Architecture

- `src/lib/journey.ts` — **single source of truth** for the five stations + interlude:
  paths, titles, codenames, accent hues, live/soon status. Nav, home page, stubs, and
  bridge footers all derive from it. To launch a module: build its page, flip its
  `status` to `"live"`.
- `src/lib/conv.ts` — convolution math + kernel/sprite presets (CNN module).
- `src/components/site/` — shell primitives: `InstrumentPanel` (framed lab-instrument
  container), `Section` (numbered prose section with figure slot), `Bridge` (next-station
  footer), `StationStub` (offline-instrument placeholder).
- `src/components/interactives/` — one file per interactive, self-contained, own
  rAF/canvas logic. Math lives in `src/lib/`, not in components.
- Module page anatomy (see `src/routes/computer-vision.tsx`, the reference
  implementation): grid-paper hero → signature interactive above the fold → §1–§4
  prose sections with inline figures → `<Bridge>` to the next station.

## Design system ("precision instrument")

Dark graphite ground, warm-ivory serif prose, hairline borders, mono uppercase labels.
Defined entirely in `src/styles.css`:

- Fonts: Chakra Petch (display/headings), Newsreader (body prose), Spline Sans Mono
  (labels, numerals, buttons). Never introduce other fonts.
- Each station has an oklch accent hue (cool→warm across the journey). Pages set it via
  `style={stationStyle(hue)}`; everything accent-colored uses the `--station*` tokens /
  `text-station` etc. **Gotcha:** derived `--station*` tokens are declared on `*` so each
  element recomputes them from its inherited `--station-hue` — don't move them to `:root`.
- Utility classes: `.panel` + `.panel-ticks` (instrument frame), `.label-tech`,
  `.readout`, `.btn-tech`, `.led`, `.grid-paper`, `.prose-lab`, `.animate-rise`.
  `.grid-paper`'s mask lives on `::before` — never put a mask on a content container.
- Feature-map colormap convention: positive = station hue, negative = cyan (205).
- Tone: lab-instrument copy in lowercase mono labels ("instrument live", "in
  fabrication"). No generic SaaS styling, no glassmorphism, no purple-gradient-on-white.

## Content voice

Source register: `D:\GitHub\ComfyUI\docs\ml-refresher.md` (bridges classical ML to the
diffusion/ComfyUI world). Teach, don't define. Short sections, bold the one key claim
per paragraph, always connect concepts forward (the Bridge) and back to the author's
journey (MIT cert, CNN project, ComfyUI).
