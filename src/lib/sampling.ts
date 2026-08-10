/**
 * Sampling math for the Token Sampler (Feedback Bench, Track II).
 * Operates on raw next-token logits extracted offline from GPT-2
 * (public/data/logits.json); everything here runs live in the browser.
 */

/** Numerically-stable softmax with temperature. T→0 collapses to argmax. */
export function softmax(logits: number[], temperature = 1): number[] {
  if (logits.length === 0) return [];
  if (temperature <= 1e-4) {
    // greedy limit: all mass on the (first) max logit
    const best = logits.indexOf(Math.max(...logits));
    return logits.map((_, i) => (i === best ? 1 : 0));
  }
  const max = Math.max(...logits);
  const exps = logits.map((l) => Math.exp((l - max) / temperature));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

/** Keep only the k highest-probability entries, renormalized. */
export function applyTopK(probs: number[], k: number): number[] {
  if (k <= 0 || k >= probs.length) return probs.slice();
  const cutoff = [...probs].sort((a, b) => b - a)[k - 1];
  let kept = 0;
  const out = probs.map((p) => {
    // ties at the cutoff: keep in original order until k slots are used
    if (p > cutoff || (p === cutoff && kept < k)) {
      kept += 1;
      return p;
    }
    return 0;
  });
  const sum = out.reduce((a, b) => a + b, 0);
  return out.map((p) => (sum > 0 ? p / sum : 0));
}

/**
 * Nucleus (top-p): keep the smallest high-probability set whose mass
 * reaches p — the token that crosses the boundary is included.
 */
export function applyTopP(probs: number[], p: number): number[] {
  if (p >= 1) return probs.slice();
  const order = probs.map((prob, i) => ({ prob, i })).sort((a, b) => b.prob - a.prob);
  const keep = new Set<number>();
  let mass = 0;
  for (const { prob, i } of order) {
    keep.add(i);
    mass += prob;
    if (mass >= p) break;
  }
  const out = probs.map((prob, i) => (keep.has(i) ? prob : 0));
  const sum = out.reduce((a, b) => a + b, 0);
  return out.map((prob) => (sum > 0 ? prob / sum : 0));
}

export interface SamplerKnobs {
  temperature: number;
  /** 0 disables */
  topK: number;
  /** 1 disables */
  topP: number;
}

/** The full pipeline in sampler order: temperature → top-k → top-p. */
export function reshape(logits: number[], knobs: SamplerKnobs): number[] {
  return applyTopP(applyTopK(softmax(logits, knobs.temperature), knobs.topK), knobs.topP);
}

/** Inverse-CDF draw; `rand` in [0,1). Returns the sampled index. */
export function sampleIndex(probs: number[], rand: number): number {
  let cum = 0;
  for (let i = 0; i < probs.length; i++) {
    cum += probs[i];
    if (rand < cum) return i;
  }
  // float round-off: fall back to the last non-zero entry
  for (let i = probs.length - 1; i >= 0; i--) if (probs[i] > 0) return i;
  return 0;
}

/** Shannon entropy in nats. exp(entropy) reads as "effective choices". */
export function entropy(probs: number[]): number {
  // + 0 folds the -0 that a one-hot distribution would produce
  return -probs.reduce((h, p) => (p > 0 ? h + p * Math.log(p) : h), 0) + 0;
}
