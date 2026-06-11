import { describe, expect, it } from "vitest";
import {
  SURFACES,
  assignClusters,
  descend,
  inertia,
  knnError,
  knnErrorCurve,
  knnPredict,
  makeDataset,
  mse,
  polyEval,
  polyRidgeFit,
  rng,
  updateCentroids,
  type Pt,
} from "./ml";

describe("rng", () => {
  it("is deterministic per seed", () => {
    const a = rng(42);
    const b = rng(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it("emits values in [0, 1)", () => {
    const r = rng(7);
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe("datasets", () => {
  it("generates the requested size, balanced-ish, inside the unit square", () => {
    for (const key of ["moons", "blobs", "checker"] as const) {
      const pts = makeDataset(key, 80, 0.5, 1);
      expect(pts).toHaveLength(80);
      for (const p of pts) {
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThanOrEqual(1);
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeLessThanOrEqual(1);
      }
      const ones = pts.filter((p) => p.label === 1).length;
      expect(ones).toBeGreaterThan(10);
      expect(ones).toBeLessThan(70);
    }
  });

  it("same seed → same dataset", () => {
    expect(makeDataset("moons", 30, 0.4, 9)).toEqual(makeDataset("moons", 30, 0.4, 9));
  });
});

describe("knn", () => {
  const train: Pt[] = [
    { x: 0.1, y: 0.1, label: 0 },
    { x: 0.15, y: 0.12, label: 0 },
    { x: 0.9, y: 0.9, label: 1 },
    { x: 0.85, y: 0.88, label: 1 },
  ];

  it("k=1 returns the closest point's label", () => {
    expect(knnPredict(train, 0.12, 0.11, 1)).toBe(0);
    expect(knnPredict(train, 0.88, 0.9, 1)).toBe(1);
  });

  it("k=1 train error is zero (memorization)", () => {
    expect(knnError(train, train, 1)).toBe(0);
  });

  it("k equal to n predicts the majority everywhere", () => {
    const skewed: Pt[] = [...train, { x: 0.5, y: 0.5, label: 1 }];
    expect(knnPredict(skewed, 0.1, 0.1, 5)).toBe(1);
  });

  it("error curve covers requested ks with values in [0,1]", () => {
    const test = makeDataset("blobs", 40, 0.5, 3);
    const curve = knnErrorCurve(makeDataset("blobs", 60, 0.5, 2), test, [1, 3, 5]);
    expect(curve.map((c) => c.k)).toEqual([1, 3, 5]);
    for (const c of curve) {
      expect(c.train).toBeGreaterThanOrEqual(0);
      expect(c.test).toBeLessThanOrEqual(1);
    }
  });
});

describe("k-means", () => {
  const points = [
    { x: 0, y: 0 },
    { x: 0.1, y: 0 },
    { x: 1, y: 1 },
    { x: 0.9, y: 1 },
  ];
  const centroids = [
    { x: 0, y: 0.1 },
    { x: 1, y: 0.9 },
  ];

  it("assigns points to the nearest centroid", () => {
    expect(assignClusters(points, centroids)).toEqual([0, 0, 1, 1]);
  });

  it("moves centroids to cluster means and reduces inertia", () => {
    const assign = assignClusters(points, centroids);
    const before = inertia(points, assign, centroids);
    const updated = updateCentroids(points, assign, centroids);
    expect(updated[0]).toEqual({ x: 0.05, y: 0 });
    expect(inertia(points, assign, updated)).toBeLessThan(before);
  });

  it("keeps a centroid in place when its cluster is empty", () => {
    const lonely = [{ x: 5, y: 5 }, ...centroids];
    const assign = assignClusters(points, lonely).map(() => 1);
    expect(updateCentroids(points, assign, lonely)[0]).toEqual({ x: 5, y: 5 });
  });
});

describe("polynomial ridge regression", () => {
  it("recovers a line exactly with λ=0", () => {
    const xs = [-1, -0.5, 0, 0.5, 1];
    const ys = xs.map((x) => 2 + 3 * x);
    const w = polyRidgeFit(xs, ys, 1, 0);
    expect(w[0]).toBeCloseTo(2, 6);
    expect(w[1]).toBeCloseTo(3, 6);
    expect(mse(xs, ys, w)).toBeCloseTo(0, 10);
  });

  it("high λ shrinks slope toward zero", () => {
    const xs = [-1, -0.5, 0, 0.5, 1];
    const ys = xs.map((x) => 3 * x);
    const free = polyRidgeFit(xs, ys, 1, 0);
    const ridged = polyRidgeFit(xs, ys, 1, 100);
    expect(Math.abs(ridged[1])).toBeLessThan(Math.abs(free[1]));
  });

  it("polyEval evaluates the basis correctly", () => {
    expect(polyEval([1, 2, 3], 2)).toBe(1 + 4 + 12);
  });
});

describe("gradient descent", () => {
  it("converges to the minimum on every surface at a sane LR", () => {
    for (const s of SURFACES) {
      const { path, diverged } = descend(s, s.start, 0.05, 400);
      expect(diverged).toBe(false);
      const [x, y] = path.at(-1)!;
      const startLoss = s.f(...s.start);
      expect(s.f(x, y)).toBeLessThan(startLoss * 0.05);
    }
  });

  it("diverges on the ravine when the LR is too high", () => {
    const ravine = SURFACES.find((s) => s.key === "ravine")!;
    expect(descend(ravine, ravine.start, 0.2, 200).diverged).toBe(true);
  });

  it("loss is monotonically non-increasing at a small LR", () => {
    const bowl = SURFACES.find((s) => s.key === "bowl")!;
    const { path } = descend(bowl, bowl.start, 0.01, 100);
    for (let i = 1; i < path.length; i++) {
      expect(bowl.f(...path[i])).toBeLessThanOrEqual(bowl.f(...path[i - 1]) + 1e-12);
    }
  });
});
