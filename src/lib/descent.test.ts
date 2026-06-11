import { describe, expect, it } from "vitest";
import { OPTIMIZERS, SURFACES3, initOpt, runOpt, stepOpt, type OptimizerKey } from "./descent";

const surf = (key: string) => SURFACES3.find((s) => s.key === key)!;
const KEYS: OptimizerKey[] = ["sgd", "momentum", "adam"];

describe("surfaces", () => {
  it("gradients match finite differences", () => {
    const eps = 1e-5;
    for (const s of SURFACES3) {
      for (const [x, y] of [
        [0.7, -0.4],
        [-1.3, 0.9],
        [0.05, 0.05],
      ] as const) {
        const [gx, gy] = s.grad(x, y);
        expect(gx).toBeCloseTo((s.f(x + eps, y) - s.f(x - eps, y)) / (2 * eps), 4);
        expect(gy).toBeCloseTo((s.f(x, y + eps) - s.f(x, y - eps)) / (2 * eps), 4);
      }
    }
  });

  it("starts sit inside the plot window", () => {
    for (const s of SURFACES3) {
      const [x0, x1, y0, y1] = s.window;
      expect(s.start[0]).toBeGreaterThan(x0);
      expect(s.start[0]).toBeLessThan(x1);
      expect(s.start[1]).toBeGreaterThan(y0);
      expect(s.start[1]).toBeLessThan(y1);
    }
  });

  it("registry has three optimizers with distinct colors", () => {
    expect(OPTIMIZERS.map((o) => o.key)).toEqual(KEYS);
    expect(new Set(OPTIMIZERS.map((o) => o.color)).size).toBe(3);
  });
});

describe("optimizer steps", () => {
  it("sgd steps exactly down the gradient", () => {
    const s = surf("bowl");
    const st = stepOpt("sgd", s, initOpt([1, -1]), 0.1);
    const [gx, gy] = s.grad(1, -1);
    expect(st.x).toBeCloseTo(1 - 0.1 * gx, 10);
    expect(st.y).toBeCloseTo(-1 - 0.1 * gy, 10);
  });

  it("does not mutate the input state", () => {
    const s = surf("bowl");
    const st = initOpt([1, 1]);
    for (const k of KEYS) stepOpt(k, s, st, 0.1);
    expect(st).toEqual(initOpt([1, 1]));
  });

  it("adam's first step has magnitude ≈ lr per axis (bias correction)", () => {
    const s = surf("bowl");
    const st = stepOpt("adam", s, initOpt([1, -1]), 0.05);
    expect(Math.abs(st.x - 1)).toBeCloseTo(0.05, 3);
    expect(Math.abs(st.y + 1)).toBeCloseTo(0.05, 3);
  });
});

describe("races", () => {
  it("all three optimizers converge on the bowl", () => {
    const s = surf("bowl");
    for (const k of KEYS) {
      const run = runOpt(k, s, s.start, 0.05, 400);
      expect(run.diverged).toBe(false);
      const [, , loss] = run.path[run.path.length - 1];
      expect(loss).toBeLessThan(0.01);
    }
  });

  it("adam escapes the saddle plateau long before sgd", () => {
    const s = surf("saddle");
    const at = (k: OptimizerKey, n: number) => {
      const run = runOpt(k, s, s.start, 0.02, n);
      return Math.abs(run.path[run.path.length - 1][1]); // |y| → 1 once escaped
    };
    expect(at("adam", 100)).toBeGreaterThan(0.5);
    expect(at("sgd", 100)).toBeLessThan(0.2);
  });

  it("sgd with a too-large lr diverges on the ravine", () => {
    const s = surf("ravine");
    const run = runOpt("sgd", s, s.start, 0.2, 200);
    expect(run.diverged).toBe(true);
  });

  it("paths start at the start and carry the surface height", () => {
    const s = surf("pits");
    const run = runOpt("momentum", s, s.start, 0.03, 50);
    expect(run.path[0][0]).toBe(s.start[0]);
    expect(run.path[0][2]).toBeCloseTo(s.f(s.start[0], s.start[1]), 10);
    expect(run.path).toHaveLength(51);
  });
});
