/**
 * Attention math for the Transformers module: softmax + scaled dot-product
 * for the toy Q·K·V sandbox, and types/helpers for the real GPT-2 weights
 * extracted offline by scripts/extract_attention.py.
 */

export interface Vec2 {
  x: number;
  y: number;
}

export const dot = (a: Vec2, b: Vec2) => a.x * b.x + a.y * b.y;

/** Numerically-stable softmax. */
export function softmax(xs: number[]): number[] {
  if (xs.length === 0) return [];
  const m = Math.max(...xs);
  const es = xs.map((x) => Math.exp(x - m));
  const s = es.reduce((a, b) => a + b, 0);
  return es.map((e) => e / s);
}

/**
 * Scaled dot-product attention for one 2-D query over n keys/values:
 * weights = softmax(q·kᵢ / scale), output = Σ wᵢ·vᵢ.
 * `scale` defaults to √d = √2 — the transformer's temperature.
 */
export function attend(
  q: Vec2,
  keys: Vec2[],
  values: Vec2[],
  scale = Math.SQRT2,
): { weights: number[]; output: Vec2 } {
  const weights = softmax(keys.map((k) => dot(q, k) / scale));
  const output = values.reduce(
    (acc, v, i) => ({ x: acc.x + weights[i] * v.x, y: acc.y + weights[i] * v.y }),
    { x: 0, y: 0 },
  );
  return { weights, output };
}

/* ------------------------------------------------------------------ */
/* Real GPT-2 attention data (public/data/attention.json)              */
/* ------------------------------------------------------------------ */

export interface AttnSentence {
  id: string;
  label: string;
  text: string;
  /** display tokens (BPE "Ġ" stripped) */
  tokens: string[];
  /** true where a token begins a new word */
  starts: boolean[];
  /** [layer][head] → lower-triangular rows (row i has i+1 weights) */
  attn: number[][][][];
}

export interface AttnData {
  model: string;
  layers: number;
  heads: number;
  sentences: AttnSentence[];
}

/** Lower-triangular rows → full square matrix (upper triangle zero). */
export function expandTri(rows: number[][]): number[][] {
  const n = rows.length;
  return rows.map((r, i) => [...r, ...Array(n - 1 - i).fill(0)]);
}

/** Shannon entropy of one attention row (how spread out it is). */
export function rowEntropy(row: number[]): number {
  let h = 0;
  for (const p of row) if (p > 1e-9) h -= p * Math.log(p);
  return h;
}

export interface HeadRef {
  layer: number;
  head: number;
}

/**
 * Data-driven head finders — real GPT-2 small reliably grows these
 * specialists, but WHERE they live varies, so locate them per sentence
 * instead of hardcoding folklore coordinates.
 */
export function findHead(s: AttnSentence, score: (rows: number[][]) => number): HeadRef {
  let best: HeadRef = { layer: 0, head: 0 };
  let bestScore = -Infinity;
  s.attn.forEach((heads, layer) =>
    heads.forEach((rows, head) => {
      const v = score(rows);
      if (v > bestScore) {
        bestScore = v;
        best = { layer, head };
      }
    }),
  );
  return best;
}

/** Mean weight on the immediately-previous token (skip row 0). */
export function prevTokenScore(rows: number[][]): number {
  let s = 0;
  for (let i = 1; i < rows.length; i++) s += rows[i][i - 1];
  return rows.length > 1 ? s / (rows.length - 1) : 0;
}

/** Mean weight parked on token 0 — the "attention sink". */
export function firstTokenScore(rows: number[][]): number {
  let s = 0;
  for (let i = 1; i < rows.length; i++) s += rows[i][0];
  return rows.length > 1 ? s / (rows.length - 1) : 0;
}

/** Negative mean entropy — higher = sharpest, most decisive head. */
export function sharpnessScore(rows: number[][]): number {
  let h = 0;
  for (let i = 1; i < rows.length; i++) h += rowEntropy(rows[i]);
  return rows.length > 1 ? -h / (rows.length - 1) : 0;
}
