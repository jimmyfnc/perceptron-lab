---
date: 2026-08-10
topic: o1-feedback-bench-plan
brainstorm: ../brainstorms/2026-06-12-generative-ai-track-brainstorm.md
---

# O1 — The Feedback Bench: build plan

Track II's first station. Frame: **prompt vs loop vs agentic engineering is one
axis — who closes the loop?** (nobody / you / the model). Spine callback:
loop = descent where you are the loss function; agentic = the model becomes
its own loss function.

## Decisions locked

- **Model**: Qwen 3.6 27B dense via Ollama (`qwen3.6:27b`, Q4_K_M ≈ 17 GB,
  fits the 4090). Same model across all three rungs — the loop is the only
  variable. Fixed temperature + seed for reproducibility.
- **Route**: `/feedback-bench`. Station num `"O1"`, hue **145** (instrument
  green — distinct from the journey's cool→warm arc; Track II gets its own
  hue family).
- **Registry**: `journey.ts` gains `OPERATOR_STATIONS` (parallel array, same
  `Station` type). `stationByPath` searches both; `nextStation` stays
  journey-only so the finished arc is untouched. Nav appends O1 after a thin
  divider; home page gets a "Track II — The Operator's Manual" section under
  the journey map.
- **The task** (loop-player): Python `parse_duration("1h 30m") → seconds`.
  One-paragraph spec, six hidden-requirement tests (basic, single unit, all
  units, bare number, decimal quantities, invalid input raises). Chosen
  because the ambiguities are _natural_ (what does "45" mean? is "1.5h"
  legal?) — the lesson is that loops surface hidden requirements, not that
  loops rescue weak models. If the 27B one-shots it, harden the spec's
  silence, don't weaken the model.

## The three rungs (loop player columns)

1. **one-shot** — spec → single completion. Tests run by the harness for
   scoring display only.
2. **loop (you close it)** — critique-and-revise, ≤4 rounds: model re-reads
   spec + its own code, lists problems, revises. **No test results fed
   back** — feedback is model-internal reflection, structured by you.
3. **agent (model closes it)** — JSON-action protocol: `run_tests` (returns
   failing test names + expected/got) or `submit`. ≤6 steps. Empirical
   ground truth + model-controlled flow.

Expected shape: one-shot passes some, loop climbs (catches spec-level
misses), agent lands 6/6 because it can _measure_. Curate seeds until the
transcripts genuinely show this — never fabricate.

## Data (all offline → static JSON, station-04/05 recipe)

- `scripts/generate_feedback_transcripts.py` → `public/data/feedback.json`
  (Ollama HTTP API; runs tests in a sandboxed subprocess with timeout).
- `scripts/generate_prompt_anatomy.py` → `public/data/prompt-anatomy.json`
  — one fixed task ("explain gradient descent to a 10-year-old"), 16 combos
  of role/context/constraints/examples toggles, same model.
- `scripts/extract_logits.py` → `public/data/logits.json` — GPT-2 top-200
  next-token logits for ~5 curated prompts (ComfyUI venv, same as
  attention.json). Temperature/top-k/top-p math runs live in the browser.

## Interactives

- `LoopPlayer.tsx` (signature) — three-column transcript scrubber; shared
  step slider; per-column test-pass meters (n/6 LEDs) that update as you
  scrub; the convergence read at a glance.
- `PromptAnatomyGrid.tsx` — four toggles → 16 real outputs; diff-highlight
  what changed vs. the bare prompt.
- `TokenSampler.tsx` — real GPT-2 distribution; temperature/top-k/top-p
  sliders reshape it live; click to sample. Math in `lib/sampling.ts`.
- `LoopSimulator.tsx` — toy convergence lab, no LLM: one-shot vs external
  feedback vs noisy _self_-evaluated feedback; sliders for eval noise +
  stop threshold; early-stop and oscillation emerge. Math in `lib/loopsim.ts`
  (seeded PRNG, unit-tested).

## Page (`src/routes/feedback-bench.tsx`)

Hero (kicker "Track II · the operator's manual") → LoopPlayer (fig. 01) →
§1 the prompt is the whole program (anatomy grid) → §2 where the words come
from (token sampler) → §3 a loop is descent — you are the loss function
(simulator) → §4 when the model closes the loop (agent rung; failure modes =
bad loss) → closing panel links back to station 02 (The Descent), not a
journey Bridge — Track II ends by pointing at the mechanics that explain it.

## Checklist

- [x] journey.ts: `OPERATOR_STATIONS` + helper updates + tests
- [x] lib/sampling.ts + tests; lib/loopsim.ts + tests
- [x] three data scripts; run; curate JSON sizes (25/10/17 KB)
- [x] four interactives; route; nav divider + O1; home Track II section
- [x] sitemap + pageHead entry; format/lint/test/build; browser pass at
      390/1280/1920; CHANGELOG + TODO

**Shipped 2026-08-10.** Curation note: seed 1145 kept on the first roll —
the loop rung's transcript explicitly identifies the bare-number ambiguity
and consciously picks the wrong reasonable answer ("raising an error is
safer than assuming seconds"), which is the strongest honest version of
the §4 lesson. One-shot 4/6 → loop 4/6 (found the gap, guessed wrong) →
agent 6/6 (measured).
