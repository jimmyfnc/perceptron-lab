import { describe, expect, it } from "vitest";
import { applyTopK, applyTopP, entropy, reshape, sampleIndex, softmax } from "./sampling";

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

describe("softmax", () => {
  it("sums to 1 and preserves order", () => {
    const p = softmax([2, 1, 0.5, -3]);
    expect(sum(p)).toBeCloseTo(1, 10);
    expect(p[0]).toBeGreaterThan(p[1]);
    expect(p[1]).toBeGreaterThan(p[2]);
    expect(p[2]).toBeGreaterThan(p[3]);
  });

  it("high temperature flattens, low temperature sharpens", () => {
    const logits = [3, 1, 0];
    const hot = softmax(logits, 5);
    const cold = softmax(logits, 0.2);
    expect(hot[0]).toBeLessThan(cold[0]);
    expect(hot[2]).toBeGreaterThan(cold[2]);
  });

  it("T→0 is greedy argmax", () => {
    expect(softmax([1, 4, 2], 0)).toEqual([0, 1, 0]);
  });

  it("is numerically stable for large logits", () => {
    const p = softmax([1000, 999], 1);
    expect(sum(p)).toBeCloseTo(1, 10);
    expect(p[0]).toBeGreaterThan(p[1]);
  });
});

describe("applyTopK", () => {
  it("keeps exactly k entries, renormalized", () => {
    const p = applyTopK([0.5, 0.3, 0.15, 0.05], 2);
    expect(p.filter((x) => x > 0)).toHaveLength(2);
    expect(sum(p)).toBeCloseTo(1, 10);
    expect(p[0]).toBeCloseTo(0.5 / 0.8, 10);
  });

  it("k=0 or k>=n is a no-op", () => {
    const probs = [0.6, 0.4];
    expect(applyTopK(probs, 0)).toEqual(probs);
    expect(applyTopK(probs, 5)).toEqual(probs);
  });
});

describe("applyTopP", () => {
  it("keeps the smallest set crossing the mass boundary", () => {
    // sorted mass: 0.5, then 0.8 — the 0.3 token crosses p=0.7 and stays
    const p = applyTopP([0.5, 0.3, 0.15, 0.05], 0.7);
    expect(p.filter((x) => x > 0)).toHaveLength(2);
    expect(sum(p)).toBeCloseTo(1, 10);
  });

  it("p=1 is a no-op; tiny p keeps only the head", () => {
    const probs = [0.5, 0.3, 0.2];
    expect(applyTopP(probs, 1)).toEqual(probs);
    expect(applyTopP(probs, 0.01).filter((x) => x > 0)).toHaveLength(1);
  });
});

describe("reshape + sampleIndex", () => {
  it("composes the pipeline and still sums to 1", () => {
    const p = reshape([2, 1.5, 1, 0.2, -1], { temperature: 0.8, topK: 4, topP: 0.9 });
    expect(sum(p)).toBeCloseTo(1, 10);
    expect(p[4]).toBe(0); // cut by top-k
  });

  it("sampleIndex walks the CDF and never lands on zero-mass entries", () => {
    const probs = [0, 0.5, 0, 0.5];
    expect(sampleIndex(probs, 0.25)).toBe(1);
    expect(sampleIndex(probs, 0.75)).toBe(3);
    expect(probs[sampleIndex(probs, 0.999999)]).toBeGreaterThan(0);
  });
});

describe("entropy", () => {
  it("uniform is log n, one-hot is 0", () => {
    expect(entropy([0.25, 0.25, 0.25, 0.25])).toBeCloseTo(Math.log(4), 10);
    expect(entropy([1, 0, 0])).toBe(0);
  });
});
