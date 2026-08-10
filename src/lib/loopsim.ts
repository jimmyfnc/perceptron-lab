/**
 * Toy loop-convergence model for the Loop Simulator (Feedback Bench).
 * No LLM involved: a "draft" has hidden quality q ∈ [0,1], each revision
 * closes part of the remaining gap (plus noise), and the loop stops when
 * the *stop signal* says q has reached the threshold.
 *
 * The experiment's one variable is who provides that signal:
 *   external — the judge reads the true q (you, running the tests);
 *   self     — the model reads its own noisy estimate q̂ = q ± evalNoise.
 * Revision dynamics are identical in both modes, so every early stop and
 * wasted round is attributable to the estimate alone.
 */

export type Mode = "oneshot" | "external" | "self";

export interface SimParams {
  /** fraction of the remaining quality gap closed per good revision */
  gain: number;
  /** amplitude of revision luck (uniform ±) */
  reviseNoise: number;
  /** amplitude of the self-estimate's error (uniform ±); ignored by external */
  evalNoise: number;
  /** the loop stops when the stop signal reaches this quality */
  threshold: number;
  maxSteps: number;
}

export interface TrialStep {
  /** true quality after this step */
  q: number;
  /** what the stop signal believed (null for one-shot) */
  qhat: number | null;
}

export type StopReason = "oneshot" | "converged" | "early" | "budget";

export interface Trial {
  steps: TrialStep[];
  stop: StopReason;
  final: number;
}

/** Small deterministic PRNG so trials are reproducible (and testable). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export function runTrial(mode: Mode, params: SimParams, rng: () => number): Trial {
  const { gain, reviseNoise, evalNoise, threshold, maxSteps } = params;
  let q = 0.3 + 0.3 * rng(); // draft quality: mediocre, varied

  if (mode === "oneshot") {
    return { steps: [{ q, qhat: null }], stop: "oneshot", final: q };
  }

  const steps: TrialStep[] = [];
  for (let step = 0; step < maxSteps; step++) {
    const qhat = mode === "self" ? clamp01(q + evalNoise * (2 * rng() - 1)) : q;
    steps.push({ q, qhat });
    if (qhat >= threshold) {
      return { steps, stop: q >= threshold ? "converged" : "early", final: q };
    }
    q = clamp01(q + gain * (1 - q) + reviseNoise * (2 * rng() - 1));
  }
  steps.push({ q, qhat: mode === "self" ? clamp01(q + evalNoise * (2 * rng() - 1)) : q });
  return { steps, stop: "budget", final: q };
}

export function runBatch(mode: Mode, params: SimParams, n: number, seed: number): Trial[] {
  const rng = mulberry32(seed);
  return Array.from({ length: n }, () => runTrial(mode, params, rng));
}

export interface Summary {
  meanFinal: number;
  /** fraction of trials that stopped while truly below threshold */
  earlyRate: number;
  meanSteps: number;
  /** mean true quality at each step index; finished trials hold their final q */
  meanCurve: number[];
}

export function summarize(trials: Trial[], maxSteps: number): Summary {
  const n = trials.length;
  const meanCurve = Array.from({ length: maxSteps + 1 }, (_, i) => {
    let acc = 0;
    for (const t of trials) acc += i < t.steps.length ? t.steps[i].q : t.final;
    return acc / n;
  });
  return {
    meanFinal: trials.reduce((a, t) => a + t.final, 0) / n,
    earlyRate: trials.filter((t) => t.stop === "early").length / n,
    meanSteps: trials.reduce((a, t) => a + t.steps.length, 0) / n,
    meanCurve,
  };
}
