import { describe, expect, it } from "vitest";
import {
  attend,
  dot,
  expandTri,
  findHead,
  firstTokenScore,
  prevTokenScore,
  rowEntropy,
  sharpnessScore,
  softmax,
  type AttnSentence,
} from "./attention";

describe("softmax", () => {
  it("sums to 1 and preserves order", () => {
    const w = softmax([1, 3, 2]);
    expect(w.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
    expect(w[1]).toBeGreaterThan(w[2]);
    expect(w[2]).toBeGreaterThan(w[0]);
  });

  it("is stable for large inputs", () => {
    const w = softmax([1000, 1001]);
    expect(w[0]).toBeCloseTo(1 / (1 + Math.E), 6);
    expect(Number.isFinite(w[0])).toBe(true);
  });

  it("uniform input → uniform weights", () => {
    expect(softmax([5, 5, 5, 5])).toEqual([0.25, 0.25, 0.25, 0.25]);
  });
});

describe("attend", () => {
  const keys = [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
  ];
  const values = [
    { x: 10, y: 0 },
    { x: 0, y: 10 },
  ];

  it("query aligned with a key shifts weight and output toward its value", () => {
    const { weights, output } = attend({ x: 3, y: 0 }, keys, values);
    expect(weights[0]).toBeGreaterThan(0.8);
    expect(output.x).toBeGreaterThan(8);
    expect(output.y).toBeLessThan(2);
  });

  it("orthogonal-ish query splits evenly", () => {
    const { weights } = attend({ x: 1, y: 1 }, keys, values);
    expect(weights[0]).toBeCloseTo(0.5, 10);
  });

  it("larger scale flattens the weights (the √d story)", () => {
    const q = { x: 3, y: 0 };
    const sharp = attend(q, keys, values, 1).weights[0];
    const flat = attend(q, keys, values, 10).weights[0];
    expect(sharp).toBeGreaterThan(flat);
    expect(flat).toBeGreaterThan(0.5);
  });

  it("dot is the plain dot product", () => {
    expect(dot({ x: 2, y: 3 }, { x: 4, y: -1 })).toBe(5);
  });
});

describe("triangular matrices", () => {
  it("expandTri zero-fills the upper triangle", () => {
    expect(expandTri([[1], [0.4, 0.6]])).toEqual([
      [1, 0],
      [0.4, 0.6],
    ]);
  });

  it("rowEntropy: one-hot is 0, uniform is log n", () => {
    expect(rowEntropy([1, 0, 0])).toBe(0);
    expect(rowEntropy([0.25, 0.25, 0.25, 0.25])).toBeCloseTo(Math.log(4), 10);
  });
});

describe("head finders", () => {
  // two layers × two heads of a 3-token sentence
  const prevHead = [[1], [1, 0], [0, 1, 0]]; // attends i-1
  const sinkHead = [[1], [1, 0], [1, 0, 0]]; // attends token 0
  const diffuse = [[1], [0.5, 0.5], [0.34, 0.33, 0.33]];
  const s = {
    attn: [
      [prevHead, diffuse],
      [diffuse, sinkHead],
    ],
  } as unknown as AttnSentence;

  it("locates the previous-token head", () => {
    expect(findHead(s, prevTokenScore)).toEqual({ layer: 0, head: 0 });
  });

  it("locates the attention sink", () => {
    expect(findHead(s, firstTokenScore)).toEqual({ layer: 1, head: 1 });
  });

  it("sharpness prefers one-hot heads over diffuse ones", () => {
    expect(sharpnessScore(prevHead)).toBeGreaterThan(sharpnessScore(diffuse));
  });
});
