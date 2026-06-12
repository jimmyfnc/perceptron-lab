# TODO — Perceptron Lab

Status after 2026-06-11 session: **all six stops live end-to-end** — 01 (Boundary
Lab), 02 (The Descent), interlude (Two Kinds of Nearest), 03 (Convolution Bench),
04 (Attention Lens), 05 (Denoising Deck). The journey is complete; remaining work
is polish + possible new content tracks (see brainstorms).
Reference implementation for future modules: `src/routes/computer-vision.tsx`.

## Modules to build (in priority order)

- [x] **01 Foundations — The Boundary Lab** (`/foundations`) — live 2026-06-11
- [x] **Interlude — Two Kinds of Nearest** (`/interlude`) — live 2026-06-11
- [x] **02 Neural Networks — The Descent** (`/neural-networks`) — live 2026-06-11
  - 3D optimizer race (three + r3f, lazy chunk), activation gallery, live MLP trainer.
- [x] **04 Transformers — The Attention Lens** (`/transformers`) — live 2026-06-11
  - Real GPT-2 heads (scripts/extract_attention.py → public/data/attention.json),
    arc diagram + causal-mask matrix + head finders, Q·K·V sandbox.
- [x] **05 Diffusion — The Denoising Deck** (`/diffusion`) — live 2026-06-11
  - Went one better than placeholders: real SD1.5 frames generated locally from the
    ComfyUI checkpoint (scripts/generate_diffusion_frames.py). 21-state scrubber with
    canvas/guess/latent views, CFG strip, latent walk, LoRA rank lab (Jacobi SVD).
  - To refresh assets (new prompt/seeds): edit the script constants and rerun with
    PYTHONPATH=C:/Users/caldw/AppData/Local/Temp/diffusers-pkg (isolated diffusers).

## Per-module launch checklist

1. Build interactives in `src/components/interactives/`, math in `src/lib/`.
2. Replace the `StationStub` route with the full page (hero → signature → §sections → Bridge).
3. Flip the station's `status` to `"live"` in `src/lib/journey.ts`.
4. `bun run format && bun run lint && bun run build`, then verify in browser.

## Track II — The Operator's Manual (proposed)

- [ ] **O1 — Prompt vs Loop, "The Feedback Bench"** — see
      `docs/brainstorms/2026-06-12-generative-ai-track-brainstorm.md`
      (loop player on real local-LLM transcripts, GPT-2 token sampler,
      prompt anatomy grid, toy loop simulator).

## Site-wide polish (later)

- [ ] Home page: upgrade the journey list to an animated journey _map_ (one continuous
      path/spine with stations, scroll-reactive).
- [ ] Bolt/heart sprite pixel art could be cleaner (hand-tune `SPRITES` in conv.ts).
- [ ] `prefers-reduced-motion` handling for sweep/rise animations.
- [ ] Mobile pass on the Convolution Bench (panels overflow below ~380px width).
- [x] OG image — `public/og.png` (home-hero capture), self-hosted, wired into og/twitter tags 2026-06-11.
- [x] Favicon — perceptron mark (`favicon.svg` + ico + apple-touch-icon via `scripts/make_icons.py`) 2026-06-11.
- [x] SEO — per-route canonical/og via `src/lib/site.ts`, `sitemap.xml`, robots.txt (domain: perceptronlab.com) 2026-06-11.
- [ ] Self-host fonts if Lovable CSP or perf complains about Google Fonts.
- [x] Regenerate `public/og.png` with all stations live 2026-06-11.
