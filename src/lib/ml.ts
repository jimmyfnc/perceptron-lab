/**
 * Classical-ML math for the Foundations module's interactives.
 * Coordinates live in the unit square [0,1]² unless noted.
 */

export interface Pt {
  x: number;
  y: number;
  /** class label */
  label: 0 | 1;
}

/* ------------------------------------------------------------------ */
/* Seeded RNG (mulberry32) — presets must be deterministic             */
/* ------------------------------------------------------------------ */

export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box–Muller gaussian from a uniform source */
function gauss(rand: () => number): number {
  const u = Math.max(rand(), 1e-12);
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/* ------------------------------------------------------------------ */
/* Dataset generators                                                  */
/* ------------------------------------------------------------------ */

export type DatasetKey = "moons" | "blobs" | "checker";

const clamp01 = (v: number) => Math.min(0.98, Math.max(0.02, v));

/** Two interleaved half-circles */
function moons(n: number, noise: number, rand: () => number): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const label = (i % 2) as 0 | 1;
    const t = rand() * Math.PI;
    const cx = label === 0 ? 0.4 : 0.6;
    const cy = label === 0 ? 0.45 : 0.55;
    const r = 0.28;
    const sign = label === 0 ? 1 : -1;
    pts.push({
      x: clamp01(cx + sign * r * Math.cos(t) + gauss(rand) * noise * 0.08),
      y: clamp01(cy - sign * r * Math.sin(t) + sign * 0.1 + gauss(rand) * noise * 0.08),
      label,
    });
  }
  return pts;
}

/** Two gaussian blobs */
function blobs(n: number, noise: number, rand: () => number): Pt[] {
  const pts: Pt[] = [];
  const centers = [
    { x: 0.33, y: 0.36 },
    { x: 0.67, y: 0.64 },
  ];
  for (let i = 0; i < n; i++) {
    const label = (i % 2) as 0 | 1;
    const c = centers[label];
    const s = 0.07 + noise * 0.09;
    pts.push({
      x: clamp01(c.x + gauss(rand) * s),
      y: clamp01(c.y + gauss(rand) * s),
      label,
    });
  }
  return pts;
}

/** 2×2 XOR checkerboard */
function checker(n: number, noise: number, rand: () => number): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const qx = rand() < 0.5 ? 0 : 1;
    const qy = rand() < 0.5 ? 0 : 1;
    const label = ((qx + qy) % 2) as 0 | 1;
    pts.push({
      x: clamp01(0.25 + qx * 0.5 + gauss(rand) * (0.07 + noise * 0.07)),
      y: clamp01(0.25 + qy * 0.5 + gauss(rand) * (0.07 + noise * 0.07)),
      label,
    });
  }
  return pts;
}

export function makeDataset(key: DatasetKey, n: number, noise: number, seed: number): Pt[] {
  const rand = rng(seed);
  if (key === "moons") return moons(n, noise, rand);
  if (key === "blobs") return blobs(n, noise, rand);
  return checker(n, noise, rand);
}

/* ------------------------------------------------------------------ */
/* K-nearest-neighbors                                                 */
/* ------------------------------------------------------------------ */

/** Majority vote of the k nearest training points (ties → class 1). */
export function knnPredict(train: Pt[], x: number, y: number, k: number): 0 | 1 {
  const kk = Math.min(k, train.length);
  if (kk === 0) return 0;
  // partial selection of k smallest distances
  const d2 = train.map((p, i) => {
    const dx = p.x - x;
    const dy = p.y - y;
    return { d: dx * dx + dy * dy, i };
  });
  d2.sort((a, b) => a.d - b.d);
  let votes = 0;
  for (let j = 0; j < kk; j++) votes += train[d2[j].i].label;
  return votes * 2 >= kk ? 1 : 0;
}

/** Fraction of `eval_` points misclassified by KNN fit on `train`. */
export function knnError(train: Pt[], eval_: Pt[], k: number): number {
  if (eval_.length === 0) return 0;
  let wrong = 0;
  for (const p of eval_) if (knnPredict(train, p.x, p.y, k) !== p.label) wrong++;
  return wrong / eval_.length;
}

export interface ErrorPoint {
  k: number;
  train: number;
  test: number;
}

/** Train/test error across a sweep of odd k values. */
export function knnErrorCurve(train: Pt[], test: Pt[], ks: number[]): ErrorPoint[] {
  return ks.map((k) => ({
    k,
    train: knnError(train, train, k),
    test: knnError(train, test, k),
  }));
}

/* ------------------------------------------------------------------ */
/* k-means                                                             */
/* ------------------------------------------------------------------ */

export interface XY {
  x: number;
  y: number;
}

export function assignClusters(points: XY[], centroids: XY[]): number[] {
  return points.map((p) => {
    let best = 0;
    let bestD = Infinity;
    centroids.forEach((c, i) => {
      const d = (p.x - c.x) ** 2 + (p.y - c.y) ** 2;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    return best;
  });
}

/** New centroid = mean of its assigned points (unchanged if empty). */
export function updateCentroids(points: XY[], assign: number[], centroids: XY[]): XY[] {
  return centroids.map((c, i) => {
    const mine = points.filter((_, j) => assign[j] === i);
    if (mine.length === 0) return c;
    return {
      x: mine.reduce((s, p) => s + p.x, 0) / mine.length,
      y: mine.reduce((s, p) => s + p.y, 0) / mine.length,
    };
  });
}

/** Total within-cluster squared distance. */
export function inertia(points: XY[], assign: number[], centroids: XY[]): number {
  return points.reduce((s, p, i) => {
    const c = centroids[assign[i]];
    return s + (p.x - c.x) ** 2 + (p.y - c.y) ** 2;
  }, 0);
}

/* ------------------------------------------------------------------ */
/* Polynomial ridge regression (1-D)                                   */
/* ------------------------------------------------------------------ */

/** Solve A·w = b by Gaussian elimination with partial pivoting. */
function solve(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r;
    [M[col], M[piv]] = [M[piv], M[col]];
    const p = M[col][col];
    if (Math.abs(p) < 1e-12) continue;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = M[r][col] / p;
      for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c];
    }
  }
  return M.map((row, i) => (Math.abs(row[i]) < 1e-12 ? 0 : row[n] / row[i]));
}

/**
 * Fit y ≈ Σ wᵢ·xⁱ by ridge regression: w = (XᵀX + λI)⁻¹ Xᵀy.
 * x should be roughly in [-1, 1] for numerical sanity.
 */
export function polyRidgeFit(xs: number[], ys: number[], degree: number, lambda: number): number[] {
  const m = degree + 1;
  const X = xs.map((x) => Array.from({ length: m }, (_, j) => x ** j));
  const A: number[][] = Array.from({ length: m }, () => Array(m).fill(0));
  const b: number[] = Array(m).fill(0);
  for (let i = 0; i < xs.length; i++) {
    for (let r = 0; r < m; r++) {
      b[r] += X[i][r] * ys[i];
      for (let c = 0; c < m; c++) A[r][c] += X[i][r] * X[i][c];
    }
  }
  // don't regularize the intercept
  for (let j = 1; j < m; j++) A[j][j] += lambda;
  return solve(A, b);
}

export function polyEval(w: number[], x: number): number {
  let y = 0;
  let p = 1;
  for (const wi of w) {
    y += wi * p;
    p *= x;
  }
  return y;
}

export function mse(xs: number[], ys: number[], w: number[]): number {
  if (xs.length === 0) return 0;
  let s = 0;
  for (let i = 0; i < xs.length; i++) s += (polyEval(w, xs[i]) - ys[i]) ** 2;
  return s / xs.length;
}

/* ------------------------------------------------------------------ */
/* Gradient descent on 2-D surfaces                                    */
/* ------------------------------------------------------------------ */

export interface Surface {
  key: string;
  name: string;
  note: string;
  f: (x: number, y: number) => number;
  grad: (x: number, y: number) => [number, number];
  /** plot window [xmin, xmax, ymin, ymax] */
  window: [number, number, number, number];
  start: [number, number];
}

export const SURFACES: Surface[] = [
  {
    key: "ravine",
    name: "Ravine",
    note: "steep one way, shallow the other — the classic LR dilemma",
    f: (x, y) => 0.5 * x * x + 6 * y * y,
    grad: (x, y) => [x, 12 * y],
    window: [-2.2, 2.2, -1.4, 1.4],
    start: [-1.9, 1.05],
  },
  {
    key: "bowl",
    name: "Bowl",
    note: "convex and friendly — everything converges",
    f: (x, y) => x * x + y * y,
    grad: (x, y) => [2 * x, 2 * y],
    window: [-2, 2, -1.3, 1.3],
    start: [-1.6, 1.0],
  },
  {
    key: "pits",
    name: "Twin pits",
    note: "two minima — where you start decides where you land",
    f: (x, y) => 0.25 * (x * x - 1.7) ** 2 + 2 * y * y,
    grad: (x, y) => [x * (x * x - 1.7), 4 * y],
    window: [-2.4, 2.4, -1.4, 1.4],
    start: [-0.12, 1.1],
  },
];

/**
 * Run plain gradient descent; returns the visited points (first = start).
 * Stops early on convergence or divergence (|coord| > bail).
 */
export function descend(
  s: Surface,
  start: [number, number],
  lr: number,
  steps: number,
  bail = 50,
): { path: [number, number][]; diverged: boolean } {
  const path: [number, number][] = [start];
  let [x, y] = start;
  for (let i = 0; i < steps; i++) {
    const [gx, gy] = s.grad(x, y);
    x -= lr * gx;
    y -= lr * gy;
    path.push([x, y]);
    if (!Number.isFinite(x) || !Number.isFinite(y) || Math.abs(x) > bail || Math.abs(y) > bail) {
      return { path, diverged: true };
    }
    if (gx * gx + gy * gy < 1e-10) break;
  }
  return { path, diverged: false };
}
