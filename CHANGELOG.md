# Changelog

All notable changes to Perceptron Lab are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); the project
does not version-number releases — entries are dated.

## 2026-06-12

### Added

- **Reactive grid paper** — the hero lattice is now a live spring-mass simulation
  (Geometry Wars, tuned to instrument subtlety): grid intersections ripple away
  from the pointer with neighbor-coupled wave propagation, glow faintly in the
  station hue while disturbed, and settle back. Canvas replaces the static CSS
  grid only while mounted; the simulation sleeps at rest (zero idle cost),
  declines to run under `prefers-reduced-motion` (which now also stills the
  rise/LED animations), and reproduces the original fade mask. Wired into the
  station heroes, the home page, and the interlude.

### Fixed

- Nav station titles now wait for xl screens — at 1024–1280px the rail still
  overflowed and clipped "05 Diffusion".
- Decoder-term underlines are more visible (was easy to scroll past the
  glossary entirely).

- **Desktop nav no longer clips "05 Diffusion"**: the interlude's full title was
  overflowing the rail (with the scrollbar hidden, the last items silently
  vanished) — the nav now labels it "Interlude" and the "/ ml field manual" tag
  waits for 2xl screens.
- **Responsive pass over every interactive** (phones, ~390px): fixed-width
  canvases/SVGs now shrink with the viewport (max-width + preserved aspect
  ratio), pointer math normalizes by the rendered size (Boundary Lab painting,
  Convolution Bench painting/hover, descent click-to-drop), and the Convolution
  Bench's canvas hook gained logical-coordinate scaling. All seven routes audited
  at 390px: zero horizontal overflow. Closes the "mobile pass" TODO item.

### Added

- **The decoder ring** — plain-words help for readers without ML vocabulary:
  `src/lib/glossary.ts` (45+ one-sentence, jargon-free definitions, with tests),
  a `<Term>` site primitive (dotted underline; hover/keyboard-focus popover with
  a mono "decoder" label), and first-occurrence terms threaded through all five
  station pages. Opt-in by design — the prose still teaches; the decoder is a
  lifeline, not a lecture.
- **Home-page lab note** ("why this site exists"): the founding
  nearest-neighbor-vs-nearest-neighbors anecdote now appears up front, tinted in
  the interlude's hue and linking to it — the interlude itself stays in its
  pedagogically-correct slot between stations 02 and 03.

## 2026-06-11

### Changed

- **Rebrand: Visionary Labs → Perceptron Lab** ("visionary labs" was taken and the
  space is crowded). Wordmark, page titles, OG/meta tags, footer, package.json name,
  docs, and the GitHub repo/folder all renamed. Design system unchanged.

### Fixed

- **Code-review pass over stations 02/04/05** (multi-agent review, 21 candidates,
  14 confirmed and fixed):
  - `svd.ts`: Jacobi rotation silently skipped on exact column-norm ties
    (`Math.sign(0) === 0`) — wrong singular values for tied matrices; regression
    test added.
  - Attention lens: failed weight fetch now shows "signal lost" + retry instead of
    loading forever.
  - Denoising deck: autoplay no longer calls `setPlaying` inside a state updater;
    dead `playRef` removed; per-seed frame preload now happens once per seed.
  - MLP trainer: resuming after auto-pause keeps the true epoch count (was reset
    to 0 with trained weights intact); offscreen canvas + ImageData hoisted out of
    the per-frame render path.
  - Optimizer race: fresh trails start hidden (no one-frame full-trajectory
    flash); contour bands now share the height mapping's normalization (one
    extrema scan, no disagreement); flat-surface divide-by-zero guarded; diverged
    runs bail at |coord| > 12 so the last trail point stays near the window;
    step readout denominator now matches the actual run length.
  - LoRA lab: ‖W‖ derived from singular values instead of building a zero matrix
    every render.
  - Home footer now counts instruments excluding the interlude ("5 of 5") —
    consistent with the diffusion outro's "all five instruments".

### Changed

- New `StationHero` site primitive replaces the hero block copy-pasted across all
  five station routes (~70 lines deleted; interlude keeps its bespoke hero).

### Added

- **Station 05 — Diffusion, "The Denoising Deck"** (live — the journey is complete):
  - Signature interactive: a real Stable Diffusion 1.5 run (the ComfyUI checkpoint,
    sampled locally on the 4090 by `scripts/generate_diffusion_frames.py` with an
    isolated diffusers install), all 21 DDIM states kept. Three views per state:
    the canvas (decoded x_t), the guess (x̂₀ — the model's running prediction of the
    finished image, recovered exactly from consecutive DDIM states), and the raw
    64×64 latent. Three seeds, filmstrip, autoplay.
  - Inline figures: live forward-process corruption on a procedural seascape with
    the ᾱ schedule curve (`src/lib/diffusion.ts`); CFG strip (same noise at
    guidance 1/4/7.5/12); latent walk (nine full runs over slerped noise); LoRA
    rank lab (16×16 ΔW rebuilt from top-r singular directions via a hand-written
    Jacobi SVD in `src/lib/svd.ts`).
  - Closing "all five instruments live" outro replaces the bridge on the last page.
  - Suite now at 100 tests.
- **Site identity + SEO pass** (canonical domain: perceptronlab.com):
  - Favicon set in the precision-instrument language — a perceptron mark (three
    ivory inputs feeding a blue neuron): hand-written `favicon.svg`, plus
    `favicon.ico` (16/32/48) and `apple-touch-icon.png` generated by
    `scripts/make_icons.py` (Pillow).
  - Self-hosted OG/Twitter preview (`public/og.png`, 1200×630 capture of the home
    hero) replacing the stale Lovable-bucket screenshot URL.
  - `src/lib/site.ts` + `pageHead()` helper: every route now emits its own
    og:title/og:description/og:url and a canonical link; root adds og:site_name,
    og:image dimensions, and theme-color.
  - `public/sitemap.xml` for all seven routes; robots.txt now points at it.
- **Station 04 — Transformers, "The Attention Lens"** (live):
  - Signature interactive: 144 real GPT-2 small attention heads over six curated
    sentences (Winograd pronouns, long-range agreement, repeated phrases, counting,
    and one about diffusion). Hover-token arc diagram with self-attention dot,
    BPE-subword chips (dashed seams), full T×T matrix showing the causal triangle,
    layer/head sliders, and data-driven head finders (previous-token head, attention
    sink, sharpest head) located per sentence by scoring all 144 heads.
  - Weights extracted offline by `scripts/extract_attention.py` (runs in the ComfyUI
    venv: torch + transformers) into `public/data/attention.json` (491 KB,
    lower-triangular, fetched lazily and cached at module level).
  - Inline figure: Q·K·V sandbox — draggable query/keys/values in 2D with live
    softmax weight bars, the output point Σ wᵢvᵢ, and a scale dial telling the √d
    story.
  - `src/lib/attention.ts` (softmax, scaled dot-product attend, triangular expansion,
    entropy, head-finder scores) with unit coverage — suite now at 77 tests.
- **Station 02 — Neural Networks, "The Descent"** (live):
  - Signature interactive: SGD, momentum, and Adam racing down a 3D loss surface
    (three + react-three-fiber, lazy-loaded in its own chunk so the route stays light).
    Four surfaces (ravine / bowl / saddle / egg crate), shared LR dial with live
    divergence readout, drag-to-orbit camera, click-to-re-drop, banded-contour
    coloring with draped graph paper.
  - Inline figures: activation gallery (f and f′ plots plus a log-scale
    "gradient survival through 8 layers" meter — drag the input negative to kill a
    ReLU live) and a 2→H→1 MLP training full-batch in the browser on the station 01
    datasets, with live decision field, loss sparkline, and dead-neuron re-roll.
  - New math libs with unit coverage: `src/lib/descent.ts` (surfaces with analytic
    gradients, SGD/momentum/Adam steppers) and `src/lib/mlp.ts` (hand-written
    backprop, activation zoo, vanishing-gradient chain) — suite now at 65 tests.
  - Home-page "fully powered" footer now derives from the journey registry instead
    of a hardcoded station list.
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
