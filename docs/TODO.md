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

## Track II — The Operator's Manual

- [x] **O1 — Prompt · Loop · Agent, "The Feedback Bench"** (`/feedback-bench`)
      — live 2026-08-10. Real qwen3.6:27b transcripts (Ollama, local),
      GPT-2 token sampler, prompt anatomy grid, toy loop simulator. Plan:
      `docs/plans/2026-08-10-feedback-bench-plan.md`. To regenerate
      transcripts: `python scripts/generate_feedback_transcripts.py --seed N`
      (needs `ollama serve` + qwen3.6:27b pulled).
- [x] **O2 — Graph Engineering, "The Wiring Loom"** (`/wiring-loom`) — live
      2026-08-13. Real router-vs-generalist runs on qwen3.6:27b
      (`scripts/generate_graph_trace.py --seed 2145`; honest result: both
      orgs 6/6, the difference was the bill — 1448 vs 953 tokens), plus toy
      wiring + checkpoint labs on `lib/graphsim.ts`. Plan:
      `docs/plans/2026-08-13-wiring-loom-plan.md`.
- [ ] **O3 candidates** — context windows & RAG, evals ("The Proving
      Ground"?), or ComfyUI workflow design (bridges Track II back to the
      diffusion station). NOTE: a third operator station will re-clip the
      2xl nav rail (~1040px budget, see `__root.tsx`) — retire the rail and
      go drawer-everywhere when O3 lands.

## Content ideas (parked)

- [ ] **06 Reinforcement Learning — "Teaching Robots to Walk"** (idea 2026-11-01).
      Off-site training lab first (CartPole → MuJoCo Ant/HalfCheetah → GPU-parallel
      Go1 on the 4090 → ARC-RL Leaper → LSTM memory), modeled on Embark's ARC
      Raiders locomotion. Site payoff: trained CartPole policy running live beside a
      random one, a "watch it learn" checkpoint strip, memory-vs-no-memory chart.
      Full plan: `docs/plans/2026-11-01-rl-walking-lab-plan.md`.

- [ ] **Decision trees & random forests station** (Semrush/Lovable suggestion:
      tree-based-model explainers are high-volume search targets, and it's the
      one big classical-ML family the journey skips). Could slot beside station
      01 as "01b — The Forest": interactive tree growing split-by-split on the
      Boundary Lab datasets, then bagging N noisy trees into a smooth forest
      boundary. Strong fit with existing lib/ml.ts datasets.

## Site-wide polish (later)

- [x] Newcomer entry path — guided diffusion replay, explained knowledge check,
      question-led homepage, optional full lab, larger buttons, and keyboard focus
      (2026-09-08).
- [x] Guided computer-vision introduction — edge directions, moving the input,
      a solid-image counterexample, and an explained knowledge check (2026-09-08).
      The full lab remains optional. Other lessons still use the original technical format.
- [ ] Observe beginners using the guided diffusion experiment; use their feedback
      before extending the format to other lessons.
- [ ] Add lesson interaction measurement through a chosen analytics provider.
      Lovable visitor/page analytics are available, but do not measure experiment use.

- [x] Home page journey map — continuous station-hue gradient spine, drawn in by
      scroll, LEDs ignite as reached (reduced-motion: fully drawn) 2026-06-12.
- [ ] Bolt/heart sprite pixel art could be cleaner (hand-tune `SPRITES` in conv.ts).
- [x] `prefers-reduced-motion` — rise/LED stilled, reactive grid declines to mount 2026-06-12.
- [x] Mobile pass — responsive canvases/SVGs + scaled pointer math across all interactives, all routes audited at 390px 2026-06-12.
- [x] OG image — `public/og.png` (home-hero capture), self-hosted, wired into og/twitter tags 2026-06-11.
- [x] Favicon — perceptron mark (`favicon.svg` + ico + apple-touch-icon via `scripts/make_icons.py`) 2026-06-11.
- [x] SEO — per-route canonical/og via `src/lib/site.ts`, `sitemap.xml`, robots.txt (domain: perceptronlab.com) 2026-06-11.
- [ ] Self-host fonts if Lovable CSP or perf complains about Google Fonts.
- [x] Regenerate `public/og.png` with all stations live 2026-06-11.
