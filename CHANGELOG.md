# Changelog

All notable changes to Visionary Labs are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); the project
does not version-number releases — entries are dated.

## 2026-06-11

### Added

- **Station 01 — Classical ML, "The Boundary Lab"** (live):
  - Signature interactive: paintable/draggable two-class KNN arena with live decision
    regions, k + noise dials, held-out test reveal with misclassification markers, and
    a clickable error-vs-k chart that traces the bias-variance U-curve in real time.
  - Inline figures: polynomial ridge fit (degree + λ sliders), step-through k-means
    with centroid trails and inertia readout, gradient descent on contour-banded
    surfaces (ravine/bowl/twin pits) with a divergence-prone LR slider.
- **Interlude — "Two Kinds of Nearest"** (live): hand-implemented
  nearest/bilinear/bicubic resampling bench on a pixel-art mushroom vs a smooth
  gradient; prose untangling NN-interpolation from KNN.
- New math libs with full unit coverage: `src/lib/ml.ts` (seeded datasets, KNN,
  k-means, polynomial ridge regression, gradient descent) and `src/lib/resample.ts`
  (nearest/bilinear/bicubic over RGBA buffers) — suite now at 45 tests.

### Fixed

- SSR crash on `/foundations` (`ImageData is not defined`): decision-field colors are
  now built inside the canvas effect instead of render-time memo.

- **Design system ("precision instrument")** — dark graphite theme, per-station oklch
  accent hues, Chakra Petch / Newsreader / Spline Sans Mono type system, instrument
  utility classes (`.panel`, `.label-tech`, `.readout`, `.btn-tech`, `.grid-paper`).
- **Journey architecture** — `src/lib/journey.ts` single source of truth for the six
  stations; header nav, home page, stubs, and bridge footers all derive from it.
- **Station 03 — CNNs & Vision, "The Convolution Bench"** (first live module):
  - Signature interactive: paintable 16×16 input, editable 3×3 kernel with seven
    presets, animated kernel sweep, live Σ w·x readout, conv → ReLU → maxpool pipeline.
  - Inline figures: kernel gallery on a procedural calibration card, pooling
    inspector with hover-traced source windows, receptive-field tracer.
  - Narrative sections §1–§4 plus bridge footer to transformers.
- **Home page** — journey list with live/in-fabrication status per station.
- **Station stubs** — styled "instrument offline" pages for `/foundations`,
  `/neural-networks`, `/interlude`, `/transformers`, `/diffusion`.
- **Docs** — brainstorm/design doc, `docs/TODO.md` roadmap, `CLAUDE.md`, this changelog.
- **Tests** — vitest (dev dependency) with a standalone `vitest.config.ts`; unit
  coverage for the convolution math library and the journey registry (21 tests).
  Found and fixed an `inkColor` chroma-clamping bug on first run.

### Changed

- Replaced the Lovable stub site (ML Academy) wholesale: new root shell, fonts via
  Google Fonts link, dark-only theme, updated meta/SEO and sitemap entries.

### Removed

- Old stub routes `/machine-learning` and `/deep-learning` (superseded by
  `/foundations` and `/neural-networks`).
