# TODO — Perceptron Lab

Status after 2026-06-11 session: design language locked; stations 01 (Boundary Lab),
02 (The Descent), the interlude (Two Kinds of Nearest), 03 (Convolution Bench), and
04 (Attention Lens) are live end-to-end. Only 05 (Diffusion) remains.
Reference implementation for future modules: `src/routes/computer-vision.tsx`.

## Modules to build (in priority order)

- [x] **01 Foundations — The Boundary Lab** (`/foundations`) — live 2026-06-11
- [x] **Interlude — Two Kinds of Nearest** (`/interlude`) — live 2026-06-11
- [x] **02 Neural Networks — The Descent** (`/neural-networks`) — live 2026-06-11
  - 3D optimizer race (three + r3f, lazy chunk), activation gallery, live MLP trainer.
- [x] **04 Transformers — The Attention Lens** (`/transformers`) — live 2026-06-11
  - Real GPT-2 heads (scripts/extract_attention.py → public/data/attention.json),
    arc diagram + causal-mask matrix + head finders, Q·K·V sandbox.
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
