---
date: 2026-06-11
topic: ml-journey-site
---

# Visionary Labs — Interactive ML Education Site

## What We're Building

A portfolio-grade interactive educational site teaching ML → deep learning → computer
vision → transformers → diffusion, mirroring the author's own learning journey (MIT AI
cert + CNN project → ComfyUI/diffusion stack). The defining feature is one **signature
interactive** per module, hand-built on Canvas/SVG (plus one lazy-loaded three.js widget),
with all math running client-side in TypeScript. Hosted on Lovable (existing TanStack
Start + React 19 + Vite 7 + Tailwind 4 + shadcn template — kept as-is).

Source material: `D:\GitHub\ComfyUI\docs\ml-refresher.md` (concept list + explanation
register; bridge classical ML to the diffusion world, don't list definitions).

## Why This Approach

- **Keep the Lovable template** — hosting requires it, and the stack (React 19, Tailwind 4,
  TanStack Router file routes) is a good fit. No chart libraries for hero visuals.
- **Hand-rolled Canvas 2D/SVG interactives** — each a self-contained component with its own
  rAF loop. `three` + `react-three-fiber` lazy-loaded only for the loss-surface page.
- **Client-side math** — KNN, k-means, convolution, live tiny-MLP training, softmax
  attention are all cheap in the browser. Diffusion module uses precomputed frames.

## Information Architecture

Home = animated "journey map" with five stations; each module has a distinct accent hue
progressing cool → warm across the journey (doubles as navigation/wayfinding).

Module page anatomy: thesis line → signature interactive above the fold → 3–5 short
narrative sections with smaller inline interactives → "bridge" footer linking concepts
to the next module.

Pages:

1. **Classical ML — The Boundary Lab**: paintable/draggable 2-class point cloud, k-slider
   redraws KNN boundary live, train/test error readout forms the bias-variance curve,
   noise dial makes overfitting visceral. Inline: step-through k-means; polynomial fit
   with degree + λ sliders (regularization); gradient descent on 2D contours.
2. **Neural Networks — The Descent**: 3D loss surface, SGD vs momentum vs Adam racing
   from one start point, adjustable LRs, selectable surfaces (bowl/saddle/ravine/
   multi-minima). Inline: tiny MLP training live on 2D points (boundary morphs per
   epoch); activation gallery (dead ReLU, vanishing sigmoid).
3. **Interlude — "Two kinds of nearest"**: own page. Nearest-neighbor interpolation vs
   KNN; pixel-art scaling comparison (nearest vs bilinear vs bicubic) as the interactive.
   The site's origin story.
4. **CNNs — The Convolution Bench** (BUILD FIRST): paint pixels / pick preset sprites,
   choose or hand-edit kernels, watch kernel slide with live feature map; chain
   conv → ReLU → pool stages to show feature hierarchies emerge.
5. **Transformers — The Attention Lens**: curated sentences with real attention weights
   precomputed offline from a small model (shipped as JSON); hover-token arc diagram,
   head switcher. Plus toy Q·K·V sandbox with draggable 2D vectors.
6. **Diffusion — The Denoising Deck**: scrubber from pure noise → image over precomputed
   intermediate steps; seed switcher; CFG comparison strip (1/4/7/12); latent-vs-pixel
   toggle. Inline: LoRA ΔW = A·B low-rank visual; latent interpolation walk.
   **Assets: placeholders for now**, swap in author's ComfyUI exports later.

## Key Decisions

- **Aesthetic: "precision instrument"** — dark graphite, hairline grid lines, mono
  numerals, schematic annotations; interactives styled like lab instruments. Per-module
  accent hue. NOT glassmorphism/neon/generic-AI.
- **First module: CNNs** — author's home turf, most tactile interactive; locks the design
  language before scaling out.
- **Interlude is its own page** — short, personal, palate-cleanser.
- **Diffusion assets: placeholders first** — no blocking dependency on ComfyUI exports.
- Desktop-first; mobile usable but not the priority.

## Open Questions

- Route naming (existing stubs: machine-learning, deep-learning, computer-vision —
  likely rename/extend to the 6-page journey).
- Font selection within the precision-instrument direction (decide during first build).
- Whether transformers module later adds transformers.js for arbitrary user sentences
  (defer; curated sentences first).

## Next Steps

→ Build the CNN module end-to-end (design tokens, site shell, Convolution Bench,
narrative sections, bridge footer), review together, then scale to remaining modules.
