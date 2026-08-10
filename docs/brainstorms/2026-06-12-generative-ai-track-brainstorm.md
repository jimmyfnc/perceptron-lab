---
date: 2026-06-12
topic: generative-ai-operator-track
---

# Track II — The Operator's Manual (prompt engineering vs loop engineering)

## What We're Building

The existing journey teaches **how the models work** (mechanics: KNN → descent →
convolution → attention → diffusion) and is complete. This adds a second track
teaching **how to operate them** — the practitioner skills the mechanics track
deliberately ends before: prompting, sampling, and above all _loop engineering_
(iterative feedback loops around a model vs. one-shot prompting).

Thematic spine: **a feedback loop with a model inside is gradient descent where
you are the loss function** — directly recalling station 02 (The Descent).

Launch with ONE station to validate the register:

**O1 — Prompt vs Loop, "The Feedback Bench"** (`/feedback-bench` or similar)

- Signature: the **loop player** — one real task given to a local LLM as a
  single mega-prompt vs. run through a critique-and-revise loop; step through
  the actual transcripts side by side and watch one converge while the other
  stalls. Generated offline (Ollama/transformers on the 4090), shipped as
  static JSON — same recipe as the attention weights and diffusion frames.
- Inline 1: **token sampler** — real GPT-2 next-token logits (top ~200 per
  position, extracted offline), with temperature / top-k / top-p computed live
  in the browser. Drag temperature, watch the real distribution reshape,
  sample from it.
- Inline 2: **prompt anatomy grid** — role/context/constraints/examples
  toggles on one fixed task; all 16 combinations precomputed so every flip
  shows a real output delta.
- Inline 3: **loop simulator** — toy in-browser agent loop (noisy "model" +
  feedback signal) showing measured convergence vs. one-shot, no LLM needed.

## Why This Approach

- **B (append station 06)** rejected: the mechanics journey is a complete arc
  ending at "static becomes a lighthouse"; bolting practice onto it weakens both.
- **C (interlude)** rejected: the topic outgrows an interlude immediately.
- **A (second track, one station first)** chosen: scales to later operator
  topics (context windows & RAG, evals, ComfyUI workflow design) without
  disturbing the finished journey; one station is a cheap validation of the
  new content register.

## Key Decisions

- Same design system, same offline-extraction recipe (real model outputs as
  static JSON; no runtime APIs, no keys, no cost).
- Track II gets its own numbering/labeling (e.g. "O1") and a distinct section
  on the home page so the two arcs read as mechanics vs. practice.
- journey.ts grows a `track` field (or a parallel registry) — nav/home derive
  from it as today.

## Open Questions

- Which local LLM for transcripts (quality vs. "ran on my own GPU" story):
  a small instruct model via Ollama is likely the sweet spot.
- The loop-player task should be intrinsically scoreable (code that passes
  tests? a constrained writing task with a rubric?) so "better" is visible,
  not asserted.
- Naming: "The Operator's Manual" vs "Field Notes" vs "Annex".

## Update 2026-08-10 — three rungs, one axis

The station's frame widens from "prompt vs loop" to **prompt vs loop vs
agentic**, unified as one question: **who closes the loop?**

- Prompt engineering — nobody does; one shot, all intelligence in the input.
- Loop engineering — _you_ do; critique-and-revise with an external judge.
- Agentic engineering — _the model_ does; goal + tools, it picks its own
  steps and decides when it's done.

This completes the thematic spine: loop = descent where you are the loss
function; agentic = **the model becomes its own loss function** — and agent
failure modes (bad self-evaluation, premature stops, runaway loops) are
exactly bad-loss failure modes.

Impact on the sketch:

- Loop player → **three-way** transcript comparison (one-shot / scripted
  loop / agent with tools), same offline-JSON recipe.
- Task question settled: a small coding task with tests — the agent rung
  needs a tool (run the tests), and "passes N of M" makes convergence
  visible in every column.
- Loop simulator gains a third mode: the toy agent estimates its own score
  (noisily) instead of receiving it — early stops and oscillation emerge.
- Token sampler + prompt anatomy grid unchanged (prompt rung).
- Scope guard: O1 teaches the _ladder_; tools/MCP/multi-agent depth is a
  future O2 if the register validates.

## Next Steps

→ ~~pick the transcript model, then plan O1 with the station-04/05
playbook~~ **Done — O1 shipped 2026-08-10** (qwen3.6:27b via Ollama; see
`docs/plans/2026-08-10-feedback-bench-plan.md`). Next: let the register
settle, then consider O2 (tools/MCP depth, context & RAG, or evals).
