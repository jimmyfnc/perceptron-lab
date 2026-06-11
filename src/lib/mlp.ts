/**
 * A tiny multilayer perceptron (2 → H → 1) with hand-written backprop,
 * plus the activation-function zoo for the gallery figure.
 * Points live in the unit square [0,1]² (same convention as ml.ts);
 * inputs are recentered to [-1,1] internally.
 */
import { rng, type Pt } from "./ml";

/* ------------------------------------------------------------------ */
/* Activations                                                         */
/* ------------------------------------------------------------------ */

export type ActKey = "relu" | "leaky" | "tanh" | "sigmoid";

export interface Activation {
  key: ActKey;
  name: string;
  note: string;
  f: (z: number) => number;
  /** derivative as a function of the pre-activation z */
  df: (z: number) => number;
}

const sig = (z: number) => 1 / (1 + Math.exp(-z));

export const ACTIVATIONS: Activation[] = [
  {
    key: "relu",
    name: "ReLU",
    note: "derivative is exactly 1 or exactly 0 — alive or dead, nothing between",
    f: (z) => Math.max(0, z),
    df: (z) => (z > 0 ? 1 : 0),
  },
  {
    key: "leaky",
    name: "Leaky ReLU",
    note: "same, but the dead side keeps a trickle (slope 0.1)",
    f: (z) => (z > 0 ? z : 0.1 * z),
    df: (z) => (z > 0 ? 1 : 0.1),
  },
  {
    key: "tanh",
    name: "tanh",
    note: "zero-centered, derivative peaks at 1 — fades in the tails",
    f: Math.tanh,
    df: (z) => 1 - Math.tanh(z) ** 2,
  },
  {
    key: "sigmoid",
    name: "sigmoid",
    note: "derivative never exceeds 0.25 — deep chains starve",
    f: sig,
    df: (z) => sig(z) * (1 - sig(z)),
  },
];

export function activation(key: ActKey): Activation {
  return ACTIVATIONS.find((a) => a.key === key)!;
}

/**
 * How much gradient survives a chain of `depth` single-neuron layers
 * (weights 1, biases 0) fed `x0`. Returns the cumulative |∂out/∂x0|
 * after each layer — the vanishing-gradient story in one array.
 */
export function chainGradient(key: ActKey, depth: number, x0: number): number[] {
  const a = activation(key);
  const out: number[] = [];
  let v = x0;
  let g = 1;
  for (let i = 0; i < depth; i++) {
    g *= Math.abs(a.df(v));
    v = a.f(v);
    out.push(g);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* The MLP                                                             */
/* ------------------------------------------------------------------ */

export interface MLP {
  hidden: number;
  act: ActKey;
  /** input→hidden weights, row-major [h][2] */
  W1: Float64Array;
  b1: Float64Array;
  /** hidden→output weights */
  W2: Float64Array;
  b2: number;
}

export function initMLP(hidden: number, act: ActKey, seed: number): MLP {
  const rand = rng(seed);
  // uniform(-s, s), s ~ 1/sqrt(fan-in)
  const u = (s: number) => (rand() * 2 - 1) * s;
  const W1 = new Float64Array(hidden * 2);
  const b1 = new Float64Array(hidden);
  const W2 = new Float64Array(hidden);
  for (let j = 0; j < hidden; j++) {
    W1[j * 2] = u(1.4);
    W1[j * 2 + 1] = u(1.4);
    b1[j] = u(0.5);
    W2[j] = u(1 / Math.sqrt(hidden)) * 2;
  }
  return { hidden, act, W1, b1, W2, b2: 0 };
}

const center = (v: number) => (v - 0.5) * 2;

/** P(label = 1) at a unit-square point. */
export function mlpProb(m: MLP, x: number, y: number): number {
  const a = activation(m.act);
  const u1 = center(x);
  const u2 = center(y);
  let o = m.b2;
  for (let j = 0; j < m.hidden; j++) {
    o += m.W2[j] * a.f(m.W1[j * 2] * u1 + m.W1[j * 2 + 1] * u2 + m.b1[j]);
  }
  return sig(o);
}

/**
 * One full-batch gradient step (in place, for the rAF training loop).
 * Returns the mean binary cross-entropy of the forward pass.
 */
export function trainEpoch(m: MLP, pts: Pt[], lr: number): number {
  const n = pts.length;
  if (n === 0) return 0;
  const a = activation(m.act);
  const h = m.hidden;
  const gW1 = new Float64Array(h * 2);
  const gb1 = new Float64Array(h);
  const gW2 = new Float64Array(h);
  let gb2 = 0;
  let loss = 0;
  const z = new Float64Array(h);
  const act_ = new Float64Array(h);

  for (const p of pts) {
    const u1 = center(p.x);
    const u2 = center(p.y);
    let o = m.b2;
    for (let j = 0; j < h; j++) {
      z[j] = m.W1[j * 2] * u1 + m.W1[j * 2 + 1] * u2 + m.b1[j];
      act_[j] = a.f(z[j]);
      o += m.W2[j] * act_[j];
    }
    const prob = sig(o);
    const t = p.label;
    loss -= t * Math.log(Math.max(prob, 1e-12)) + (1 - t) * Math.log(Math.max(1 - prob, 1e-12));
    const dout = prob - t; // dL/do for BCE-through-sigmoid
    gb2 += dout;
    for (let j = 0; j < h; j++) {
      gW2[j] += dout * act_[j];
      const dz = dout * m.W2[j] * a.df(z[j]);
      gW1[j * 2] += dz * u1;
      gW1[j * 2 + 1] += dz * u2;
      gb1[j] += dz;
    }
  }

  const k = lr / n;
  for (let i = 0; i < h * 2; i++) m.W1[i] -= k * gW1[i];
  for (let j = 0; j < h; j++) {
    m.b1[j] -= k * gb1[j];
    m.W2[j] -= k * gW2[j];
  }
  m.b2 -= k * gb2;
  return loss / n;
}

/** Fraction of points classified correctly at threshold 0.5. */
export function mlpAccuracy(m: MLP, pts: Pt[]): number {
  if (pts.length === 0) return 0;
  let ok = 0;
  for (const p of pts) if ((mlpProb(m, p.x, p.y) >= 0.5 ? 1 : 0) === p.label) ok++;
  return ok / pts.length;
}
