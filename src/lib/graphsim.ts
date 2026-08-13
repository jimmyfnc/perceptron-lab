/**
 * Toy graph-topology math for the Wiring Loom (Track II, O2).
 * Same spirit as loopsim: draft quality in [0,1], revisions close part of
 * the remaining gap, judges read quality through noise. Here the workers
 * and judges are held fixed and the WIRING is the experimental variable —
 * four topologies over identical parts, scored on quality, calls (cost),
 * and depth (latency: the longest dependency chain).
 */

import { mulberry32 } from "@/lib/loopsim";

export { mulberry32 };

export interface LoomParams {
  /** spread of initial draft quality (uniform ±) */
  workerNoise: number;
  /** error in every judging node's quality estimate (uniform ±) */
  judgeNoise: number;
}

const BASE_SKILL = 0.45;
const GAIN = 0.3;
const REVISE_NOISE = 0.05;
const ACCEPT = 0.85;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

const draft = (p: LoomParams, rng: () => number) =>
  clamp01(BASE_SKILL + p.workerNoise * (2 * rng() - 1));

const revise = (q: number, rng: () => number) =>
  clamp01(q + GAIN * (1 - q) + REVISE_NOISE * (2 * rng() - 1));

const estimate = (q: number, p: LoomParams, rng: () => number) =>
  clamp01(q + p.judgeNoise * (2 * rng() - 1));

export interface TopoResult {
  q: number;
  calls: number;
  depth: number;
}

export type TopologyId = "solo" | "pipeline" | "bestOf" | "reviewLoop";

export const TOPOLOGIES: { id: TopologyId; title: string; blurb: string }[] = [
  { id: "solo", title: "solo", blurb: "one worker, one shot" },
  { id: "pipeline", title: "pipeline", blurb: "draft → revise → revise" },
  { id: "bestOf", title: "best-of-3", blurb: "three drafts, a judge picks" },
  { id: "reviewLoop", title: "review loop", blurb: "worker ↔ reviewer until accepted" },
];

export function runTopology(id: TopologyId, p: LoomParams, rng: () => number): TopoResult {
  switch (id) {
    case "solo":
      return { q: draft(p, rng), calls: 1, depth: 1 };
    case "pipeline": {
      // three sequential nodes: every call is on the critical path
      let q = draft(p, rng);
      q = revise(q, rng);
      q = revise(q, rng);
      return { q, calls: 3, depth: 3 };
    }
    case "bestOf": {
      // three drafts in parallel; a judge ranks NOISY estimates, so it can
      // crown the wrong draft — fan-out only pays if the judge can see
      const qs = [draft(p, rng), draft(p, rng), draft(p, rng)];
      const est = qs.map((q) => estimate(q, p, rng));
      const pick = est.indexOf(Math.max(...est));
      return { q: qs[pick], calls: 4, depth: 2 };
    }
    case "reviewLoop": {
      // a separate reviewer node closes the worker's loop (O1's lesson,
      // now as wiring): revise until the reviewer's estimate clears the bar
      let q = draft(p, rng);
      let calls = 1;
      let depth = 1;
      for (let round = 0; round < 4; round++) {
        calls += 1; // reviewer reads it
        depth += 1;
        if (estimate(q, p, rng) >= ACCEPT) break;
        q = revise(q, rng);
        calls += 1;
        depth += 1;
      }
      return { q, calls, depth };
    }
  }
}

export interface TopoSummary {
  meanQ: number;
  meanCalls: number;
  meanDepth: number;
}

export function summarizeTopology(
  id: TopologyId,
  p: LoomParams,
  trials: number,
  seed: number,
): TopoSummary {
  const rng = mulberry32(seed);
  let q = 0;
  let calls = 0;
  let depth = 0;
  for (let i = 0; i < trials; i++) {
    const r = runTopology(id, p, rng);
    q += r.q;
    calls += r.calls;
    depth += r.depth;
  }
  return { meanQ: q / trials, meanCalls: calls / trials, meanDepth: depth / trials };
}

/* ---- checkpoint lab: one human node, four edges to hang it on ---- */

export interface CheckpointParams {
  /** per-stage probability of introducing a defect */
  stageDefect: number[];
  /** probability the human catches a defect present at the gate */
  catchProb: number;
}

export interface CheckpointSummary {
  /** fraction of runs that ship with a defect */
  escapedRate: number;
  /** mean rework steps per run (redo everything since the defect entered) */
  meanRework: number;
}

/**
 * Defects enter at stages; a checkpoint after stage `slot` inspects every
 * run: caught defects are fixed by redoing the stages since they entered
 * (late catches cost more rework), defects entering after the gate escape.
 * slot null = no checkpoint.
 */
export function runCheckpoint(
  slot: number | null,
  p: CheckpointParams,
  trials: number,
  seed: number,
): CheckpointSummary {
  const rng = mulberry32(seed);
  let escaped = 0;
  let rework = 0;
  for (let t = 0; t < trials; t++) {
    let defectAt = -1; // stage index where the (first) live defect entered
    for (let stage = 0; stage < p.stageDefect.length; stage++) {
      if (defectAt < 0 && rng() < p.stageDefect[stage]) defectAt = stage;
      if (slot === stage && defectAt >= 0 && rng() < p.catchProb) {
        rework += stage - defectAt + 1;
        defectAt = -1; // fixed; later stages can still break it again
      }
    }
    if (defectAt >= 0) escaped += 1;
  }
  return { escapedRate: escaped / trials, meanRework: rework / trials };
}
