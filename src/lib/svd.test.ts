import { describe, expect, it } from "vitest";
import { frob, lowRank, svd } from "./svd";
import { rng } from "./ml";

function randomMatrix(m: number, n: number, seed: number): number[][] {
  const rand = rng(seed);
  return Array.from({ length: m }, () => Array.from({ length: n }, () => rand() * 2 - 1));
}

describe("svd", () => {
  it("full-rank reconstruction recovers the matrix", () => {
    const A = randomMatrix(8, 8, 1);
    const d = svd(A);
    expect(frob(lowRank(d, 8), A)).toBeLessThan(1e-8);
  });

  it("singular values are sorted descending and non-negative", () => {
    const d = svd(randomMatrix(10, 6, 2));
    for (let i = 1; i < d.S.length; i++) {
      expect(d.S[i]).toBeLessThanOrEqual(d.S[i - 1] + 1e-12);
      expect(d.S[i]).toBeGreaterThanOrEqual(0);
    }
  });

  it("a rank-1 matrix has one dominant singular value", () => {
    const u = [1, 2, 3, 4];
    const v = [0.5, -1, 2];
    const A = u.map((ui) => v.map((vj) => ui * vj));
    const d = svd(A);
    expect(d.S[0]).toBeGreaterThan(1);
    expect(d.S[1]).toBeLessThan(1e-8);
    expect(frob(lowRank(d, 1), A)).toBeLessThan(1e-8);
  });

  it("reconstruction error shrinks as rank grows", () => {
    const A = randomMatrix(12, 12, 3);
    const d = svd(A);
    let prev = Infinity;
    for (const r of [1, 3, 6, 12]) {
      const err = frob(lowRank(d, r), A);
      expect(err).toBeLessThanOrEqual(prev + 1e-12);
      prev = err;
    }
  });

  it("handles equal-norm correlated columns (the sign(0) Jacobi tie)", () => {
    const A = [
      [1, 1, 0],
      [1, 1, 1],
      [0, 0, 1],
    ];
    const d = svd(A);
    expect(frob(lowRank(d, 3), A)).toBeLessThan(1e-8);
    expect(d.S[2]).toBeLessThan(1e-8); // true rank is 2
  });

  it("U and V columns are orthonormal", () => {
    const d = svd(randomMatrix(9, 5, 4));
    for (let a = 0; a < 5; a++) {
      for (let b = 0; b < 5; b++) {
        let uu = 0;
        let vv = 0;
        for (let i = 0; i < 9; i++) uu += d.U[i][a] * d.U[i][b];
        for (let i = 0; i < 5; i++) vv += d.V[i][a] * d.V[i][b];
        const want = a === b ? 1 : 0;
        expect(uu).toBeCloseTo(want, 6);
        expect(vv).toBeCloseTo(want, 6);
      }
    }
  });
});
