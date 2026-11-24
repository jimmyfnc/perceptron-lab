import { describe, expect, it } from "vitest";
import {
  LAYERS,
  adamStep,
  evaluate,
  forward,
  gradients,
  initNet,
  predict,
  signExamples,
  trainableSeed,
} from "./forwardnet";

const LR = 0.01;

describe("forward", () => {
  it("returns one activation array per layer, in range", () => {
    const { acts, zs } = forward(initNet(3), [0.4, -0.7]);
    expect(acts.map((a) => a.length)).toEqual([...LAYERS]);
    expect(zs.map((z) => z.length)).toEqual(LAYERS.slice(1));
    expect(acts[0]).toEqual([0.4, -0.7]);
    for (const a of [...acts[1], ...acts[2]]) expect(Math.abs(a)).toBeLessThanOrEqual(1);
    expect(acts[3][0]).toBeGreaterThan(0);
    expect(acts[3][0]).toBeLessThan(1);
  });

  it("is deterministic for a given seed", () => {
    expect(predict(initNet(5), 0.2, 0.9)).toBe(predict(initNet(5), 0.2, 0.9));
    expect(predict(initNet(5), 0.2, 0.9)).not.toBe(predict(initNet(6), 0.2, 0.9));
  });
});

describe("signExamples", () => {
  it("is 64 balanced examples that never sit on an axis", () => {
    const data = signExamples();
    expect(data).toHaveLength(64);
    expect(data.filter((d) => d.y === 1)).toHaveLength(32);
    for (const d of data) expect(d.x[0] * d.x[1]).not.toBe(0);
  });
});

describe("gradients", () => {
  it("match finite differences of the loss", () => {
    const data = signExamples();
    const net = initNet(11);
    const { gW, gB } = gradients(net, data);
    const eps = 1e-5;
    for (const [l, j, i] of [
      [0, 0, 1],
      [0, 3, 0],
      [1, 2, 3],
      [2, 0, 1],
    ]) {
      const w = net.W[l][j][i];
      net.W[l][j][i] = w + eps;
      const up = evaluate(net, data).loss;
      net.W[l][j][i] = w - eps;
      const down = evaluate(net, data).loss;
      net.W[l][j][i] = w;
      expect(gW[l][j][i]).toBeCloseTo((up - down) / (2 * eps), 5);
    }
    const b = net.B[1][1];
    net.B[1][1] = b + eps;
    const up = evaluate(net, data).loss;
    net.B[1][1] = b - eps;
    const down = evaluate(net, data).loss;
    net.B[1][1] = b;
    expect(gB[1][1]).toBeCloseTo((up - down) / (2 * eps), 5);
  });
});

describe("training", () => {
  it("a single step lowers the loss", () => {
    const data = signExamples();
    const net = initNet(2);
    const before = evaluate(net, data).loss;
    for (let s = 0; s < 5; s++) adamStep(net, data, LR);
    expect(evaluate(net, data).loss).toBeLessThan(before);
  });

  it("solves the sign task from a trainable seed, and stays finite", () => {
    const data = signExamples();
    const seed = trainableSeed(1, data, LR, 1200, 0.03);
    const net = initNet(seed);
    for (let s = 0; s < 1200; s++) adamStep(net, data, LR);
    const { loss, acc } = evaluate(net, data);
    expect(Number.isFinite(loss)).toBe(true);
    expect(loss).toBeLessThan(0.03);
    expect(acc).toBe(1);
    // the whole point: same sign → high, different signs → low
    expect(predict(net, 0.6, 0.7)).toBeGreaterThan(0.9);
    expect(predict(net, -0.6, 0.7)).toBeLessThan(0.1);
  });
});
