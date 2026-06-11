import { describe, expect, it } from "vitest";
import { makeDataset } from "./ml";
import {
  ACTIVATIONS,
  activation,
  chainGradient,
  initMLP,
  mlpAccuracy,
  mlpProb,
  trainEpoch,
} from "./mlp";

describe("activations", () => {
  it("derivatives match finite differences", () => {
    const eps = 1e-6;
    for (const a of ACTIVATIONS) {
      for (const z of [-1.7, -0.3, 0.4, 2.1]) {
        expect(a.df(z)).toBeCloseTo((a.f(z + eps) - a.f(z - eps)) / (2 * eps), 4);
      }
    }
  });

  it("relu is dead left of zero, alive right of it", () => {
    const r = activation("relu");
    expect(r.df(-0.01)).toBe(0);
    expect(r.df(0.5)).toBe(1);
  });

  it("sigmoid derivative never exceeds 0.25", () => {
    const s = activation("sigmoid");
    for (let z = -6; z <= 6; z += 0.1) expect(s.df(z)).toBeLessThanOrEqual(0.25);
  });
});

describe("chainGradient", () => {
  it("relu passes gradient untouched for positive input", () => {
    expect(chainGradient("relu", 8, 1)).toEqual(Array(8).fill(1));
  });

  it("relu kills the gradient instantly for negative input (dead relu)", () => {
    expect(chainGradient("relu", 8, -0.5)).toEqual(Array(8).fill(0));
  });

  it("sigmoid gradient vanishes exponentially with depth", () => {
    const g = chainGradient("sigmoid", 8, 1);
    for (let i = 1; i < g.length; i++) expect(g[i]).toBeLessThan(g[i - 1]);
    expect(g[7]).toBeLessThan(1e-4);
  });

  it("tanh fades far slower than sigmoid", () => {
    expect(chainGradient("tanh", 8, 1)[7]).toBeGreaterThan(chainGradient("sigmoid", 8, 1)[7] * 100);
  });
});

describe("MLP", () => {
  it("init is deterministic per seed and outputs are probabilities", () => {
    const a = initMLP(8, "tanh", 3);
    const b = initMLP(8, "tanh", 3);
    expect(Array.from(a.W1)).toEqual(Array.from(b.W1));
    const p = mlpProb(a, 0.3, 0.7);
    expect(p).toBeGreaterThan(0);
    expect(p).toBeLessThan(1);
  });

  it("loss decreases under training", () => {
    const pts = makeDataset("moons", 80, 0.4, 7);
    const m = initMLP(8, "tanh", 1);
    const first = trainEpoch(m, pts, 0.5);
    let last = first;
    for (let e = 0; e < 300; e++) last = trainEpoch(m, pts, 0.5);
    expect(last).toBeLessThan(first * 0.6);
  });

  it("learns XOR (checker) — a single line cannot, the MLP must bend", () => {
    const pts = makeDataset("checker", 80, 0.3, 5);
    const m = initMLP(8, "tanh", 2);
    for (let e = 0; e < 2500; e++) trainEpoch(m, pts, 0.8);
    expect(mlpAccuracy(m, pts)).toBeGreaterThan(0.9);
  });
});
