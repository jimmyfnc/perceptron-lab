/**
 * The forward (noising) process for the Diffusion module's in-browser
 * figure: DDPM's linear beta schedule and the closed-form jump
 * x_t = √ᾱ_t·x₀ + √(1−ᾱ_t)·ε. The signature deck uses real SD1.5 frames
 * (scripts/generate_diffusion_frames.py); this lib is for the math figure.
 */
import { rng } from "./ml";

/** DDPM linear beta schedule: 1e-4 → 0.02 over T steps. */
export function betaSchedule(T: number): Float64Array {
  const betas = new Float64Array(T);
  for (let t = 0; t < T; t++) betas[t] = 1e-4 + (0.02 - 1e-4) * (T === 1 ? 0 : t / (T - 1));
  return betas;
}

/** ᾱ_t = Π (1 − β_i): the fraction of original signal surviving at step t. */
export function alphaBars(T: number): Float64Array {
  const betas = betaSchedule(T);
  const abars = new Float64Array(T);
  let p = 1;
  for (let t = 0; t < T; t++) {
    p *= 1 - betas[t];
    abars[t] = p;
  }
  return abars;
}

/** One pixel of the closed-form forward jump to noise level ᾱ. */
export function noisyMix(x0: number, eps: number, abar: number): number {
  return Math.sqrt(abar) * x0 + Math.sqrt(1 - abar) * eps;
}

/** Deterministic field of standard normals (Box–Muller over seeded rng). */
export function gaussianField(n: number, seed: number): Float64Array {
  const rand = rng(seed);
  const out = new Float64Array(n);
  for (let i = 0; i < n; i += 2) {
    const u = Math.max(rand(), 1e-12);
    const v = rand();
    const r = Math.sqrt(-2 * Math.log(u));
    out[i] = r * Math.cos(2 * Math.PI * v);
    if (i + 1 < n) out[i + 1] = r * Math.sin(2 * Math.PI * v);
  }
  return out;
}

/** Signal-to-noise ratio at ᾱ — the y-axis story of the schedule figure. */
export function snr(abar: number): number {
  return abar / Math.max(1 - abar, 1e-12);
}
