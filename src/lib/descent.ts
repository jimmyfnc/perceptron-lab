/**
 * Loss surfaces and optimizers for the Neural Networks module.
 * Surfaces are analytic f(x, y) with hand-derived gradients; the 3D scene
 * renders height = f and the racers walk the (x, y) plane.
 */

export interface Surface3 {
  key: string;
  name: string;
  note: string;
  f: (x: number, y: number) => number;
  grad: (x: number, y: number) => [number, number];
  /** plot window [xmin, xmax, ymin, ymax] */
  window: [number, number, number, number];
  start: [number, number];
}

export const SURFACES3: Surface3[] = [
  {
    key: "ravine",
    name: "Ravine",
    note: "steep across, shallow along — SGD zigzags, Adam rescales each axis",
    f: (x, y) => 0.4 * x * x + 6 * y * y,
    grad: (x, y) => [0.8 * x, 12 * y],
    window: [-2.2, 2.2, -1.2, 1.2],
    start: [-1.9, 0.95],
  },
  {
    key: "bowl",
    name: "Bowl",
    note: "convex and friendly — everyone wins, some win sooner",
    f: (x, y) => 0.6 * (x * x + y * y),
    grad: (x, y) => [1.2 * x, 1.2 * y],
    window: [-2, 2, -2, 2],
    start: [-1.55, 1.3],
  },
  {
    key: "saddle",
    name: "Saddle",
    note: "a flat ridge with almost no slope off it — plain SGD crawls",
    f: (x, y) => 0.5 * x * x + 0.25 * (y * y - 1) ** 2,
    grad: (x, y) => [x, y * y * y - y],
    window: [-2.2, 2.2, -1.7, 1.7],
    start: [-1.85, 0.02],
  },
  {
    key: "pits",
    name: "Egg crate",
    note: "many local minima — where you land depends on how you roll",
    f: (x, y) => 0.22 * (x * x + y * y) + 0.55 * (Math.cos(2.4 * x) + Math.cos(2.4 * y)) + 1.12,
    grad: (x, y) => [0.44 * x - 1.32 * Math.sin(2.4 * x), 0.44 * y - 1.32 * Math.sin(2.4 * y)],
    window: [-3, 3, -3, 3],
    start: [-2.55, 2.15],
  },
];

/* ------------------------------------------------------------------ */
/* Optimizers                                                          */
/* ------------------------------------------------------------------ */

export type OptimizerKey = "sgd" | "momentum" | "adam";

export interface Optimizer {
  key: OptimizerKey;
  name: string;
  note: string;
  /** display color (hex — must be readable by both DOM and three.js) */
  color: string;
}

export const OPTIMIZERS: Optimizer[] = [
  { key: "sgd", name: "SGD", note: "step straight down the gradient", color: "#e8e3d4" },
  { key: "momentum", name: "Momentum", note: "keep 90% of last step's velocity", color: "#56c8e8" },
  { key: "adam", name: "Adam", note: "momentum + per-axis step rescaling", color: "#7d9eff" },
];

const BETA = 0.9; // momentum
const B1 = 0.9; // adam first moment
const B2 = 0.999; // adam second moment
const EPS = 1e-8;

export interface OptState {
  x: number;
  y: number;
  /** momentum velocity */
  vx: number;
  vy: number;
  /** adam moments */
  mx: number;
  my: number;
  sx: number;
  sy: number;
  /** adam timestep (for bias correction) */
  t: number;
}

export function initOpt(start: [number, number]): OptState {
  return { x: start[0], y: start[1], vx: 0, vy: 0, mx: 0, my: 0, sx: 0, sy: 0, t: 0 };
}

/** One optimizer update; returns a new state (input untouched). */
export function stepOpt(key: OptimizerKey, s: Surface3, st: OptState, lr: number): OptState {
  const [gx, gy] = s.grad(st.x, st.y);
  const n = { ...st };
  if (key === "sgd") {
    n.x -= lr * gx;
    n.y -= lr * gy;
  } else if (key === "momentum") {
    n.vx = BETA * st.vx - lr * gx;
    n.vy = BETA * st.vy - lr * gy;
    n.x += n.vx;
    n.y += n.vy;
  } else {
    n.t = st.t + 1;
    n.mx = B1 * st.mx + (1 - B1) * gx;
    n.my = B1 * st.my + (1 - B1) * gy;
    n.sx = B2 * st.sx + (1 - B2) * gx * gx;
    n.sy = B2 * st.sy + (1 - B2) * gy * gy;
    const c1 = 1 - B1 ** n.t;
    const c2 = 1 - B2 ** n.t;
    n.x -= (lr * (n.mx / c1)) / (Math.sqrt(n.sx / c2) + EPS);
    n.y -= (lr * (n.my / c1)) / (Math.sqrt(n.sy / c2) + EPS);
  }
  return n;
}

export interface Run3 {
  /** visited points as [x, y, f(x,y)] — first entry is the start */
  path: [number, number, number][];
  diverged: boolean;
}

/** Run one optimizer for `steps` updates (stops early on divergence). */
export function runOpt(
  key: OptimizerKey,
  s: Surface3,
  start: [number, number],
  lr: number,
  steps: number,
  bail = 50,
): Run3 {
  let st = initOpt(start);
  const path: [number, number, number][] = [[st.x, st.y, s.f(st.x, st.y)]];
  for (let i = 0; i < steps; i++) {
    st = stepOpt(key, s, st, lr);
    path.push([st.x, st.y, s.f(st.x, st.y)]);
    if (
      !Number.isFinite(st.x) ||
      !Number.isFinite(st.y) ||
      Math.abs(st.x) > bail ||
      Math.abs(st.y) > bail
    ) {
      return { path, diverged: true };
    }
  }
  return { path, diverged: false };
}
