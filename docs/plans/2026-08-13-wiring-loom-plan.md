---
date: 2026-08-13
topic: o2-wiring-loom-plan
brainstorm: ../brainstorms/2026-06-12-generative-ai-track-brainstorm.md
---

# O2 — The Wiring Loom: build plan

Track II's second station. Subject: what 2026 calls **graph engineering** —
agent systems as explicit graphs (state, nodes, edges; multi-agent org
wiring). Editorial stance (James's call): **name the term as the current
word, teach the engineering underneath** — the word will churn like
"prompt/loop/agentic" did; state-nodes-edges and topology-as-hyperparameter
won't. Continues the O1 spine: O1 asked _who closes the loop_; O2 asks
_how many loops, wired how_ — every edge is someone closing a loop for
someone else, and the human re-enters the graph as a checkpoint node.

## Station identity

- num `"O2"`, path `/wiring-loom`, codename **The Wiring Loom**,
  title "Graph Engineering", navLabel "Loom", hue **115** (Track II green
  family, one step warmer than O1's 145).
- **Nav consequence**: the xl rail cannot absorb "O2 LOOM" (~20px headroom
  measured at 1280). Rail moves to 2xl+; the NavDrawer serves everything
  below — exactly the escape hatch it was built with.

## Signature — GraphTrace (real data, same credibility move as O1)

Six mini-tasks (2 regex, 2 arithmetic word problems, 2 strict-JSON
extraction — all machine-checkable) run through two real orgs on
qwen3.6:27b via Ollama:

- **generalist**: one prompt solves everything, straight through.
- **routed**: a router node classifies each task (one word), hands it to
  one of three specialist prompts (regex / math / extraction).

`scripts/generate_graph_trace.py` → `public/data/graphtrace.json`.
Scrub the runs task by task: routing decision, specialist reply, score
chip, token cost. A real misroute, if one occurs, is a feature — edges
are decisions, and decisions can be wrong. Curate seeds for honesty +
legibility; if the generalist aces all six, tighten the format checkers
(strict scoring IS part of the lesson: orgs are judged by harnesses).

## Toy labs (lib/graphsim.ts, seeded PRNG, unit-tested)

- **WiringLoom** (§2 figure): same noisy workers, four wirings — solo /
  pipeline of revisers / best-of-N + judge / worker↔reviewer loop.
  Sliders: worker noise, judge noise. Readouts per topology: mean quality,
  calls (cost), depth (latency). SVG node-edge diagrams; the topology is
  the only variable.
- **CheckpointLab** (§4 figure): a 4-stage pipeline where each stage can
  inject a defect; click an edge to place ONE human checkpoint; readouts:
  escaped-defect rate vs human interruptions. Placement beats headcount.

## Page (`src/routes/wiring-loom.tsx`)

Hero (kicker "Track II · the operator's manual", lede names the term-of-
the-moment then pivots to structure) → GraphTrace (fig. 01) →
§1 state, nodes, edges (prose; the primitives, LangGraph lineage,
work-graph vs improvement-graph) → §2 topology is a hyperparameter
(WiringLoom) → §3 every edge closes somebody's loop (O1 callback; judge
nodes, misroutes, bad-gradient propagation) → §4 the human is a node now
(CheckpointLab; governance/observability) → closing panel: back to the
journey map (home) — both tracks, one site.

O1's page gains a "next on track II" tile to O2 above its Return panel.

## Checklist

- [ ] journey.ts O2 + navLabel; rail breakpoint xl→2xl; tests
- [ ] lib/graphsim.ts + tests
- [ ] generate_graph_trace.py; run vs Ollama; curate
- [ ] GraphTrace / WiringLoom / CheckpointLab; route; O1 bridge tile
- [ ] glossary: node, edge, state (graph sense), router, checkpoint
- [ ] sitemap; format/lint/test/build; 390/1280/1920 + drawer; CHANGELOG,
      TODO, memory
