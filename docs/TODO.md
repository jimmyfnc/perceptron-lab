# TODO — Visionary Labs

Status after 2026-06-11 session: design language locked; stations 01 (Boundary Lab),
the interlude (Two Kinds of Nearest), and 03 (Convolution Bench) are live end-to-end.
Reference implementation for future modules: `src/routes/computer-vision.tsx`.

## Modules to build (in priority order)

- [x] **01 Foundations — The Boundary Lab** (`/foundations`) — live 2026-06-11
- [x] **Interlude — Two Kinds of Nearest** (`/interlude`) — live 2026-06-11
- [ ] **02 Neural Networks — The Descent** (`/neural-networks`)
  - Signature: 3D loss surface, SGD vs momentum vs Adam racing, adjustable LRs,
    selectable surfaces (bowl/saddle/ravine/multi-minima).
  - Needs dep: `bun add three @react-three/fiber` — lazy-load on this route only.
  - Inline: tiny MLP training live on 2D points; activation gallery (dead ReLU,
    vanishing sigmoid).
- [ ] **04 Transformers — The Attention Lens** (`/transformers`)
  - Signature: curated sentences with real attention weights; hover-token arcs, head
    switcher. Pre-step: extract attention from GPT-2/DistilBERT offline (Python,
    one-off script), ship as static JSON in `public/data/`.
  - Inline: toy Q·K·V sandbox with draggable 2D vectors → live softmax weights.
- [ ] **05 Diffusion — The Denoising Deck** (`/diffusion`)
  - Signature: noise→image scrubber over precomputed intermediate steps; seed switcher;
    CFG comparison strip (1/4/7/12); latent-vs-pixel toggle.
  - **Decision (2026-06-11): start with placeholder/public assets.** Later swap in
    James's own ComfyUI exports (save every KSampler step as a frame).
  - Inline: LoRA ΔW = A·B low-rank visual; latent interpolation walk.

## Per-module launch checklist

1. Build interactives in `src/components/interactives/`, math in `src/lib/`.
2. Replace the `StationStub` route with the full page (hero → signature → §sections → Bridge).
3. Flip the station's `status` to `"live"` in `src/lib/journey.ts`.
4. `bun run format && bun run lint && bun run build`, then verify in browser.

## Site-wide polish (later)

- [ ] Home page: upgrade the journey list to an animated journey _map_ (one continuous
      path/spine with stations, scroll-reactive).
- [ ] Bolt/heart sprite pixel art could be cleaner (hand-tune `SPRITES` in conv.ts).
- [ ] `prefers-reduced-motion` handling for sweep/rise animations.
- [ ] Mobile pass on the Convolution Bench (panels overflow below ~380px width).
- [ ] OG image (generate a precision-instrument card).
- [ ] Self-host fonts if Lovable CSP or perf complains about Google Fonts.
- [ ] Favicon + manifest still template defaults (`public/`).
