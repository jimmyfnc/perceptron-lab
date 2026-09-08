# Changelog

All notable changes to Perceptron Lab are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); the project
does not version-number releases — entries are dated.

## 2026-09-08

### Added

- Guided first diffusion experiment: replay a real image-generation run with a
  slider or stage buttons, compare starting noise, and check understanding with
  explained answers. Includes frame descriptions, keyboard controls, and image
  failure recovery. No account or mathematical background required.

### Changed

- Homepage now leads with a beginner starting point, a noise-to-image preview,
  question-led lesson links, and a builder note below the learning paths.
- Diffusion opens with the guided experiment and a plain-language explanation.
  The original lab and technical prose remain in an optional, crawlable section;
  advanced interactives mount only when that section is opened.
- Navigation uses “Explore”; buttons have a 44px minimum height. Added visible
  keyboard focus and a skip-to-content link.

## 2026-08-24

### Changed

- **SEO retitle pass across all nine routes.** First GSC data (40 impressions
  in 10 days, zero with learning intent — every query a collision with
  TransformerLens or Perceptron Inc.) showed the codename-first titles ranking
  for nothing the site is about. Title tags and meta descriptions now lead
  with the queries people actually search ("How Convolutional Neural Networks
  Work", "How Attention Works in Transformers", "How Stable Diffusion Works");
  codenames stay everywhere on-page. Section headings gained keyword-bearing
  prefixes ("CFG scale:", "Backpropagation", "Multi-head attention:",
  "Receptive fields:") and ledes now name their topic in plain terms.

### Added

- `.env` / `.env.example` scaffolding (gitignored) for Google Search API
  credentials.
- `scripts/gsc-report.ts` — zero-dependency Search Console reporter (service
  account JWT auth, no packages added): totals, top queries, top pages, or any
  `--dim` combination, for any GSC property the account is added to — reusable
  across future sites, not just this one.
- **DeeperCut fold-out math drawers** (`site/DeeperCut.tsx` + `MatrixCard`) —
  plain `<details>`, no JS, fully indexable. Piloted on the CNN page: worked
  convolution arithmetic + output-size formula, Sobel-as-derivative reading,
  pooling gradient routing, and the receptive-field recurrence. Rolls out to
  the other stations once the pattern is approved.
- `docs/distribution/2026-08-24-launch-kit.md` — Show HN / Reddit / X /
  LinkedIn drafts, newsletter list, and a pre-flight checklist (analytics
  before posting).

### Fixed

- **First full Lighthouse pass, all nine routes (mobile).** Now 100s across
  accessibility / best practices / SEO everywhere, with two real bugs found:
  kernel-weight inputs in the Convolution Bench had no accessible labels
  (added `aria-label`s), and bright pooling-inspector cells failed the 4.5:1
  contrast floor (colormap lightness now caps at 0.54; MAC readout dim state
  un-dimmed). The Track II data-fetch interactives (LoopPlayer, GraphTrace)
  jumped from a short "loading" strip to a tall player when transcripts
  arrived — CLS 0.255 on mobile; both now render structural skeletons that
  mirror the loaded layout. Accepted: diffusion frames flagged as low-res on
  high-DPI screens — they're genuine 512px SD1.5 outputs, upscaling them would
  misrepresent the model.

## 2026-08-13

### Added

- **Track II station O2: The Wiring Loom** (`/wiring-loom`) — graph
  engineering, taught as the structure under the churning term: state,
  nodes, edges; topology as a hyperparameter; every edge closes somebody's
  loop; the human re-enters as a checkpoint node.
  - **Graph trace** (signature): six machine-checked mini-tasks (regex /
    arithmetic / strict-JSON extraction) through two REAL orgs on
    qwen3.6:27b — a lone generalist vs router → specialists — with routing
    decisions, token bills, and harness verdicts side by side
    (`scripts/generate_graph_trace.py`, strict identical scoring for both
    orgs, honest results shipped as-is). The honest result: both orgs went
    6/6 — the difference showed up on the bill (generalist 1448 tokens vs
    953 routed; the IPv4 regex alone: 759 rambling vs 92 under a specialist's
    output contract). Equal quality, cheaper wiring.
  - **Wiring loom** (toy): identical noisy workers and judges rewired four
    ways (solo / pipeline / best-of-3 / review loop); quality, calls, and
    depth readouts; crank judge noise and watch best-of-3 collapse
    (`lib/graphsim.ts`, seeded + unit-tested).
  - **Checkpoint lab** (toy): one human, four possible gates on a
    defect-prone pipeline — escaped defects vs rework cost; placement beats
    intention.
  - O1 gains a Track II bridge tile to O2 (`nextOperatorStation`); glossary
    grows node, edge, shared state, router, checkpoint.
  - **Nav**: the full rail now waits for 2xl — "O2 Loom" would re-clip it at
    xl (~20px headroom measured); the pop-out journey map serves everything
    below, which is exactly what it was built for.

## 2026-08-10

### Added (later in the day)

- **Pop-out journey map (mobile/tablet nav)**: below xl the header's
  bare-number rail is replaced by a "≡ map" button that unfolds a grid-paper
  drawer under the header — both tracks grouped and labeled, every station
  with its num, full title, codename, hue, and live LED, active station
  outlined. Backdrop tap / Escape / navigation all fold it; body scroll locks
  while open; opens with focus on the first station. The xl+ rail is
  unchanged; when a third track outgrows it, drop the rail and let the drawer
  serve every width (`src/components/site/NavDrawer.tsx`).
- Mobile audit re-run at a true emulated 390px (prior checks bottomed out at
  the desktop window's minimum width): all eight routes, zero horizontal
  overflow.

### Added

- **Track II — The Operator's Manual, station O1: The Feedback Bench**
  (`/feedback-bench`): the site's first practice-track station, teaching
  prompt vs loop vs agentic engineering as one axis — _who closes the loop?_
  - **Loop player** (signature): one real task (`parse_duration`, six
    hidden-requirement acceptance tests) given to qwen3.6:27b three ways —
    one-shot, critique-and-revise loop, agent with a test-runner tool —
    with the actual transcripts scrubbable side by side
    (`scripts/generate_feedback_transcripts.py`, Ollama, seed 1145). The
    honest result shipped as-is: one-shot 4/6; the loop _found_ the spec's
    bare-number ambiguity, reasoned about it, and still chose wrong (4/6);
    the agent measured its way to 6/6 in two tool calls.
  - **Prompt anatomy grid**: role/context/constraints/example toggles over
    16 precomputed real outputs, same model + seed
    (`scripts/generate_prompt_anatomy.py`).
  - **Token sampler**: real GPT-2 top-200 next-token logits
    (`scripts/extract_logits.py`); temperature / top-k / top-p reshaping
    computed live in the browser (`lib/sampling.ts`, unit-tested).
  - **Loop simulator**: no-LLM toy where revisions are identical and only
    the stop signal differs (external judge vs noisy self-estimate) —
    early-stops below the quality bar emerge from estimate noise alone
    (`lib/loopsim.ts`, seeded PRNG, unit-tested).
  - Registry: `journey.ts` gains `OPERATOR_STATIONS` + `navLabel`; nav rail
    gets a divider + "O1 Bench" (one word — "Feedback Bench" re-clipped the
    xl rail); home page gains the Track II section; sitemap + JSON-LD wired.
  - Decoder ring: temperature, top-p, system prompt, agent, context window.
  - Verified at 390/1280/1920 — no overflow, no console errors, 110 tests.

### Added

- **Reactive grid paper** — the hero lattice is now a live spring-mass simulation
  (Geometry Wars, tuned to instrument subtlety): grid intersections ripple away
  from the pointer with neighbor-coupled wave propagation, glow faintly in the
  station hue while disturbed, and settle back. Canvas replaces the static CSS
  grid only while mounted; the simulation sleeps at rest (zero idle cost),
  declines to run under `prefers-reduced-motion` (which now also stills the
  rise/LED animations), and reproduces the original fade mask. Wired into the
  station heroes, the home page, and the interlude.

### Added (later in the day)

- **Home-page journey map**: the station list's spine is now one continuous
  line through every stop, tinted with the full journey gradient (cool → warm
  station hues) and drawn in by scroll — each station's LED ignites as the
  line reaches it. Reduced-motion gets the fully-drawn spine.

### Fixed

- The REAL cause of the clipped "05" nav item at large desktops: the
  "/ ml field manual" tagline reappeared at 2xl (1536px+) and shoved the rail
  past its container. The header tagline is gone (the footer keeps it);
  verified 390 / 1100 / 1280 / 1440 / 1920.
- Nav station titles now wait for xl screens — at 1024–1280px the rail still
  overflowed and clipped "05 Diffusion".
- Decoder-term underlines are more visible (was easy to scroll past the
  glossary entirely).
- Reactive grid reworked from speed-based impulses (only fast flicks registered
  — read as random) to a continuous dent that follows the cursor every frame,
  shedding slower, longer-lived waves; influence radius 130→220px.

### SEO round 2 (Lovable review triage)

- Local Lighthouse baseline: 100/100 SEO, accessibility, best practices.
- "Home page 404" and "duplicated meta/social tags": stale crawl of the
  pre-SEO-pass deploy — production returns 200 and SSR emits exactly one
  og/twitter tag per page (verified).
- Fixed for real: CV page title shortened under 60 chars; descriptive alt text
  on the denoising/CFG/latent-walk imagery; JSON-LD structured data on every
  route (WebSite on home, LearningResource per station) via `pageHead`.
- Parked in TODO: decision trees / random forests station ("01b — The Forest")
  — the one classical-ML family the journey skips, and a high-volume search
  target per Semrush.

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
