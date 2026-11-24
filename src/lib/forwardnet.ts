/**
 * The forward-pass figure's network: a fixed 2 → 4 → 4 → 1 MLP (tanh hidden,
 * sigmoid out) that exposes every intermediate value, so the 3D scene can
 * light each neuron and the caption can print each weighted sum.
 * Inputs live in [-1, 1]². Trained with Adam on the sign-agreement (XOR) task.
 */
import { rng } from "./ml";

export const LAYERS = [2, 4, 4, 1] as const;

/** display colors (hex — must be readable by both DOM and three.js);
    same amber/cyan class pair as the Boundary Lab and the MLP trainer */
export const POS_COLOR = "#eeb154";
export const NEG_COLOR = "#00d2d3";
export const IDLE_COLOR = "#23262e";

export interface ForwardNet {
  /** W[l][j][i]: weight from neuron i of layer l to neuron j of layer l+1 */
  W: number[][][];
  /** B[l][j]: bias of neuron j in layer l+1 */
  B: number[][];
  /** Adam moment estimates, same shapes as W and B */
  mW: number[][][];
  vW: number[][][];
  mB: number[][];
  vB: number[][];
  /** Adam step counter */
  t: number;
}

export interface Example {
  x: [number, number];
  y: 0 | 1;
}

const zerosW = (W: number[][][]) => W.map((l) => l.map((r) => r.map(() => 0)));
const zerosB = (B: number[][]) => B.map((l) => l.map(() => 0));

export function initNet(seed: number): ForwardNet {
  const rand = rng(seed);
  const u = (s: number) => (rand() * 2 - 1) * s;
  const W: number[][][] = [];
  const B: number[][] = [];
  for (let l = 0; l < LAYERS.length - 1; l++) {
    W[l] = [];
    B[l] = [];
    for (let j = 0; j < LAYERS[l + 1]; j++) {
      W[l][j] = [];
      for (let i = 0; i < LAYERS[l]; i++) W[l][j][i] = u(1.1);
      B[l][j] = u(0.3);
    }
  }
  return { W, B, mW: zerosW(W), vW: zerosW(W), mB: zerosB(B), vB: zerosB(B), t: 0 };
}

export interface Pass {
  /** acts[0] is the input; acts[l] the outputs of layer l */
  acts: number[][];
  /** zs[l][j]: the weighted sum (pre-activation) of neuron j in layer l+1 */
  zs: number[][];
}

export function forward(net: ForwardNet, x: readonly [number, number]): Pass {
  const acts: number[][] = [[x[0], x[1]]];
  const zs: number[][] = [];
  const last = LAYERS.length - 2;
  for (let l = 0; l <= last; l++) {
    const z: number[] = [];
    const a: number[] = [];
    for (let j = 0; j < LAYERS[l + 1]; j++) {
      let s = net.B[l][j];
      for (let i = 0; i < LAYERS[l]; i++) s += net.W[l][j][i] * acts[l][i];
      z[j] = s;
      a[j] = l < last ? Math.tanh(s) : 1 / (1 + Math.exp(-s));
    }
    zs.push(z);
    acts.push(a);
  }
  return { acts, zs };
}

/** The network's answer in (0, 1) for one input pair. */
export function predict(net: ForwardNet, x1: number, x2: number): number {
  return forward(net, [x1, x2]).acts[LAYERS.length - 1][0];
}

/**
 * The task: answer 1 when both inputs share a sign, 0 when they differ.
 * An 8×8 grid that never touches an axis, so every label is unambiguous.
 */
export function signExamples(): Example[] {
  const out: Example[] = [];
  for (let a = 0; a < 8; a++) {
    for (let b = 0; b < 8; b++) {
      const x1 = -0.875 + a * 0.25;
      const x2 = -0.875 + b * 0.25;
      out.push({ x: [x1, x2], y: x1 * x2 > 0 ? 1 : 0 });
    }
  }
  return out;
}

/** Mean binary cross-entropy and accuracy at threshold 0.5. */
export function evaluate(net: ForwardNet, data: Example[]): { loss: number; acc: number } {
  if (data.length === 0) return { loss: 0, acc: 0 };
  let loss = 0;
  let right = 0;
  for (const d of data) {
    const o = predict(net, d.x[0], d.x[1]);
    const p = Math.min(Math.max(o, 1e-7), 1 - 1e-7);
    loss -= d.y * Math.log(p) + (1 - d.y) * Math.log(1 - p);
    if ((o > 0.5 ? 1 : 0) === d.y) right++;
  }
  return { loss: loss / data.length, acc: right / data.length };
}

/** Full-batch gradient of the mean BCE loss with respect to every weight and bias. */
export function gradients(net: ForwardNet, data: Example[]): { gW: number[][][]; gB: number[][] } {
  const gW = zerosW(net.W);
  const gB = zerosB(net.B);
  const n = data.length;
  for (const d of data) {
    const { acts } = forward(net, d.x);
    // dL/dz at the output for BCE-through-sigmoid
    let delta = [acts[LAYERS.length - 1][0] - d.y];
    for (let l = LAYERS.length - 2; l >= 0; l--) {
      const prev: number[] = new Array(LAYERS[l]).fill(0);
      for (let j = 0; j < LAYERS[l + 1]; j++) {
        gB[l][j] += delta[j] / n;
        for (let i = 0; i < LAYERS[l]; i++) {
          gW[l][j][i] += (delta[j] * acts[l][i]) / n;
          prev[i] += net.W[l][j][i] * delta[j];
        }
      }
      // back through tanh; layer 0 is the raw input and has no activation
      if (l > 0) for (let i = 0; i < LAYERS[l]; i++) prev[i] *= 1 - acts[l][i] ** 2;
      delta = prev;
    }
  }
  return { gW, gB };
}

/** One Adam step over the whole dataset (in place, for the rAF loop). */
export function adamStep(net: ForwardNet, data: Example[], lr: number): void {
  if (data.length === 0) return;
  const { gW, gB } = gradients(net, data);
  net.t++;
  const b1 = 0.9;
  const b2 = 0.999;
  const c1 = 1 - b1 ** net.t;
  const c2 = 1 - b2 ** net.t;
  for (let l = 0; l < LAYERS.length - 1; l++) {
    for (let j = 0; j < LAYERS[l + 1]; j++) {
      for (let i = 0; i < LAYERS[l]; i++) {
        const g = gW[l][j][i];
        net.mW[l][j][i] = b1 * net.mW[l][j][i] + (1 - b1) * g;
        net.vW[l][j][i] = b2 * net.vW[l][j][i] + (1 - b2) * g * g;
        net.W[l][j][i] -= (lr * (net.mW[l][j][i] / c1)) / (Math.sqrt(net.vW[l][j][i] / c2) + 1e-8);
      }
      const g = gB[l][j];
      net.mB[l][j] = b1 * net.mB[l][j] + (1 - b1) * g;
      net.vB[l][j] = b2 * net.vB[l][j] + (1 - b2) * g * g;
      net.B[l][j] -= (lr * (net.mB[l][j] / c1)) / (Math.sqrt(net.vB[l][j] / c2) + 1e-8);
    }
  }
}

/**
 * A few random starts settle in a local minimum and never solve the task.
 * Returns the first seed at or after `from` that trains below `doneLoss`
 * within `maxSteps`, so a re-roll is always worth watching. Falls back to
 * the last seed tried.
 */
export function trainableSeed(
  from: number,
  data: Example[],
  lr: number,
  maxSteps: number,
  doneLoss: number,
  tries = 8,
): number {
  let seed = from;
  for (let k = 0; k < tries; k++) {
    seed = from + k;
    const trial = initNet(seed);
    for (let s = 0; s < maxSteps; s++) {
      adamStep(trial, data, lr);
      if (s % 20 === 19 && evaluate(trial, data).loss < doneLoss) return seed;
    }
  }
  return seed;
}
