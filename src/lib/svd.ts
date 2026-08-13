/**
 * One-sided Jacobi SVD for small dense matrices — powers the LoRA rank
 * lab (ΔW ≈ A·B is exactly "keep the top-r singular directions").
 * Matrices are row-major number[][]; sizes here are ~16×16, so clarity
 * beats cleverness.
 */

export interface SVD {
  /** m×n left singular vectors (columns) */
  U: number[][];
  /** singular values, descending */
  S: number[];
  /** n×n right singular vectors (columns) */
  V: number[][];
}

export function svd(A: number[][]): SVD {
  const m = A.length;
  const n = A[0].length;
  const W = A.map((row) => [...row]);
  const V: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j): number => (i === j ? 1 : 0)),
  );

  const col = (M: number[][], j: number) => M.map((r) => r[j]);
  const dotCols = (M: number[][], p: number, q: number) => {
    let s = 0;
    for (let i = 0; i < M.length; i++) s += M[i][p] * M[i][q];
    return s;
  };

  for (let sweep = 0; sweep < 60; sweep++) {
    let off = 0;
    for (let p = 0; p < n - 1; p++) {
      for (let q = p + 1; q < n; q++) {
        const a = dotCols(W, p, p);
        const b = dotCols(W, q, q);
        const c = dotCols(W, p, q);
        off = Math.max(off, Math.abs(c) / Math.sqrt(Math.max(a * b, 1e-30)));
        if (Math.abs(c) < 1e-12) continue;
        const zeta = (b - a) / (2 * c);
        // sign(0) would skip the rotation entirely — equal-norm correlated
        // columns must still be rotated, so treat a tie as positive
        const sz = zeta >= 0 ? 1 : -1;
        const t = sz / (Math.abs(zeta) + Math.sqrt(1 + zeta * zeta));
        const cs = 1 / Math.sqrt(1 + t * t);
        const sn = cs * t;
        for (let i = 0; i < m; i++) {
          const wp = W[i][p];
          W[i][p] = cs * wp - sn * W[i][q];
          W[i][q] = sn * wp + cs * W[i][q];
        }
        for (let i = 0; i < n; i++) {
          const vp = V[i][p];
          V[i][p] = cs * vp - sn * V[i][q];
          V[i][q] = sn * vp + cs * V[i][q];
        }
      }
    }
    if (off < 1e-12) break;
  }

  // singular values = column norms of W; U = normalized columns
  const order = Array.from({ length: n }, (_, j) => j).sort(
    (a, b) => Math.hypot(...col(W, b)) - Math.hypot(...col(W, a)),
  );
  const S: number[] = [];
  const U = Array.from({ length: m }, () => Array(n).fill(0));
  const Vs = Array.from({ length: n }, () => Array(n).fill(0));
  order.forEach((j, k) => {
    const s = Math.hypot(...col(W, j));
    S.push(s);
    for (let i = 0; i < m; i++) U[i][k] = s > 1e-12 ? W[i][j] / s : 0;
    for (let i = 0; i < n; i++) Vs[i][k] = V[i][j];
  });
  return { U, S, V: Vs };
}

/** Rebuild A keeping only the top-r singular directions. */
export function lowRank(d: SVD, r: number): number[][] {
  const m = d.U.length;
  const n = d.V.length;
  const k = Math.min(r, d.S.length);
  const out = Array.from({ length: m }, () => Array(n).fill(0));
  for (let c = 0; c < k; c++) {
    for (let i = 0; i < m; i++) {
      const uis = d.U[i][c] * d.S[c];
      for (let j = 0; j < n; j++) out[i][j] += uis * d.V[j][c];
    }
  }
  return out;
}

/** Frobenius distance between two matrices (for the error readout). */
export function frob(A: number[][], B: number[][]): number {
  let s = 0;
  for (let i = 0; i < A.length; i++)
    for (let j = 0; j < A[0].length; j++) s += (A[i][j] - B[i][j]) ** 2;
  return Math.sqrt(s);
}
