import { describe, expect, it } from "vitest";
import {
  KERNELS,
  SPRITES,
  absMax,
  avgPool,
  convolve,
  divergingColor,
  gridSize,
  inkColor,
  macAt,
  makeGrid,
  maxPool,
  relu,
  type Grid,
} from "./conv";

describe("convolve", () => {
  it("produces valid (no-padding) output dimensions", () => {
    const out = convolve(makeGrid(16, 16), KERNELS[0].k);
    expect(gridSize(out)).toEqual({ h: 14, w: 14 });
  });

  it("identity kernel reproduces the input interior", () => {
    const input: Grid = [
      [1, 2, 3, 4],
      [5, 6, 7, 8],
      [9, 10, 11, 12],
      [13, 14, 15, 16],
    ];
    const identity = KERNELS.find((k) => k.key === "identity")!.k;
    expect(convolve(input, identity)).toEqual([
      [6, 7],
      [10, 11],
    ]);
  });

  it("edge-detecting kernels are silent on uniform input", () => {
    const flat = makeGrid(8, 8, 0.5);
    for (const key of ["sobel-x", "sobel-y", "laplacian"]) {
      const k = KERNELS.find((p) => p.key === key)!.k;
      for (const row of convolve(flat, k)) {
        for (const v of row) expect(v).toBeCloseTo(0, 10);
      }
    }
  });

  it("sobel-x responds to a vertical edge but not a horizontal one", () => {
    const vEdge: Grid = Array.from({ length: 5 }, () => [0, 0, 1, 1, 1]);
    const hEdge: Grid = Array.from({ length: 5 }, (_, y) => Array(5).fill(y < 2 ? 0 : 1));
    const sobelX = KERNELS.find((k) => k.key === "sobel-x")!.k;
    expect(absMax(convolve(vEdge, sobelX))).toBeGreaterThan(0);
    expect(absMax(convolve(hEdge, sobelX))).toBeCloseTo(0, 10);
  });
});

describe("macAt", () => {
  it("matches the convolution output at every position", () => {
    const input = SPRITES[0].grid;
    const kernel = KERNELS.find((k) => k.key === "sobel-x")!.k;
    const out = convolve(input, kernel);
    for (const [y, x] of [
      [0, 0],
      [3, 7],
      [13, 13],
    ] as const) {
      const { sum, terms } = macAt(input, kernel, y, x);
      expect(sum).toBeCloseTo(out[y][x], 10);
      expect(terms).toHaveLength(9);
    }
  });
});

describe("relu and pooling", () => {
  const g: Grid = [
    [-1, 2, 0, -3],
    [4, -5, 6, 7],
    [0, 1, -2, 3],
    [8, -9, 10, -11],
  ];

  it("relu zeroes negatives and keeps positives", () => {
    expect(relu(g)).toEqual([
      [0, 2, 0, 0],
      [4, 0, 6, 7],
      [0, 1, 0, 3],
      [8, 0, 10, 0],
    ]);
  });

  it("maxPool 2×2 keeps the strongest value per window", () => {
    expect(maxPool(g, 2)).toEqual([
      [4, 7],
      [8, 10],
    ]);
  });

  it("avgPool 2×2 averages each window", () => {
    expect(avgPool(g, 2)).toEqual([
      [0, 2.5],
      [0, 0],
    ]);
  });

  it("pooling floors odd dimensions", () => {
    expect(gridSize(maxPool(makeGrid(5, 5), 2))).toEqual({ h: 2, w: 2 });
  });
});

describe("presets", () => {
  it("all kernels are 3×3", () => {
    for (const k of KERNELS) expect(gridSize(k.k)).toEqual({ h: 3, w: 3 });
  });

  it("all sprites are 16×16 with values in [0, 1]", () => {
    for (const s of SPRITES) {
      expect(gridSize(s.grid)).toEqual({ h: 16, w: 16 });
      for (const row of s.grid) for (const v of row) expect(v).toBeGreaterThanOrEqual(0);
      for (const row of s.grid) for (const v of row) expect(v).toBeLessThanOrEqual(1);
    }
  });

  it("kernel and sprite keys are unique", () => {
    expect(new Set(KERNELS.map((k) => k.key)).size).toBe(KERNELS.length);
    expect(new Set(SPRITES.map((s) => s.key)).size).toBe(SPRITES.length);
  });

  it("gaussian blur weights sum to 1", () => {
    const blur = KERNELS.find((k) => k.key === "blur")!.k;
    expect(blur.flat().reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
  });
});

describe("colors", () => {
  it("divergingColor maps sign to hue and zero to the ground color", () => {
    expect(divergingColor(2, 2, 305)).toContain("305");
    expect(divergingColor(-2, 2, 305)).toContain("205");
    expect(divergingColor(0, 2, 305)).toBe("oklch(0.2 0.005 265)");
  });

  it("inkColor clamps out-of-range values", () => {
    expect(inkColor(-1)).toBe(inkColor(0));
    expect(inkColor(2)).toBe(inkColor(1));
  });
});
