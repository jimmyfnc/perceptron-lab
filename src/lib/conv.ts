/**
 * Convolution math for the CNN module's interactives.
 * Grids are row-major number[][]; input pixels live in [0, 1].
 */

export type Grid = number[][];

export function gridSize(g: Grid): { h: number; w: number } {
  return { h: g.length, w: g[0]?.length ?? 0 };
}

export function makeGrid(h: number, w: number, fill = 0): Grid {
  return Array.from({ length: h }, () => Array<number>(w).fill(fill));
}

export function cloneGrid(g: Grid): Grid {
  return g.map((row) => [...row]);
}

/** Valid (no-padding) 2D cross-correlation — what DL frameworks call convolution. */
export function convolve(input: Grid, kernel: Grid): Grid {
  const { h, w } = gridSize(input);
  const { h: kh, w: kw } = gridSize(kernel);
  const oh = h - kh + 1;
  const ow = w - kw + 1;
  const out = makeGrid(oh, ow);
  for (let y = 0; y < oh; y++) {
    for (let x = 0; x < ow; x++) {
      let acc = 0;
      for (let ky = 0; ky < kh; ky++) {
        for (let kx = 0; kx < kw; kx++) {
          acc += input[y + ky][x + kx] * kernel[ky][kx];
        }
      }
      out[y][x] = acc;
    }
  }
  return out;
}

/** The multiply–accumulate terms at one output position (for the live readout). */
export function macAt(
  input: Grid,
  kernel: Grid,
  oy: number,
  ox: number,
): { sum: number; terms: { w: number; x: number }[] } {
  const { h: kh, w: kw } = gridSize(kernel);
  const terms: { w: number; x: number }[] = [];
  let sum = 0;
  for (let ky = 0; ky < kh; ky++) {
    for (let kx = 0; kx < kw; kx++) {
      const wgt = kernel[ky][kx];
      const px = input[oy + ky][ox + kx];
      terms.push({ w: wgt, x: px });
      sum += wgt * px;
    }
  }
  return { sum, terms };
}

export function relu(g: Grid): Grid {
  return g.map((row) => row.map((v) => Math.max(0, v)));
}

export function maxPool(g: Grid, size = 2): Grid {
  const { h, w } = gridSize(g);
  const oh = Math.floor(h / size);
  const ow = Math.floor(w / size);
  const out = makeGrid(oh, ow);
  for (let y = 0; y < oh; y++) {
    for (let x = 0; x < ow; x++) {
      let m = -Infinity;
      for (let dy = 0; dy < size; dy++) {
        for (let dx = 0; dx < size; dx++) {
          m = Math.max(m, g[y * size + dy][x * size + dx]);
        }
      }
      out[y][x] = m;
    }
  }
  return out;
}

export function avgPool(g: Grid, size = 2): Grid {
  const { h, w } = gridSize(g);
  const oh = Math.floor(h / size);
  const ow = Math.floor(w / size);
  const out = makeGrid(oh, ow);
  for (let y = 0; y < oh; y++) {
    for (let x = 0; x < ow; x++) {
      let s = 0;
      for (let dy = 0; dy < size; dy++) {
        for (let dx = 0; dx < size; dx++) {
          s += g[y * size + dy][x * size + dx];
        }
      }
      out[y][x] = s / (size * size);
    }
  }
  return out;
}

export function absMax(g: Grid): number {
  let m = 0;
  for (const row of g) for (const v of row) m = Math.max(m, Math.abs(v));
  return m;
}

/* ------------------------------------------------------------------ */
/* Kernel presets                                                      */
/* ------------------------------------------------------------------ */

export interface KernelPreset {
  key: string;
  name: string;
  /** What this kernel teaches, one short clause */
  note: string;
  k: Grid;
}

export const KERNELS: KernelPreset[] = [
  {
    key: "identity",
    name: "Identity",
    note: "passes the pixel through untouched",
    k: [
      [0, 0, 0],
      [0, 1, 0],
      [0, 0, 0],
    ],
  },
  {
    key: "sobel-x",
    name: "Sobel X",
    note: "fires on vertical edges (left↔right change)",
    k: [
      [-1, 0, 1],
      [-2, 0, 2],
      [-1, 0, 1],
    ],
  },
  {
    key: "sobel-y",
    name: "Sobel Y",
    note: "fires on horizontal edges (top↕bottom change)",
    k: [
      [-1, -2, -1],
      [0, 0, 0],
      [1, 2, 1],
    ],
  },
  {
    key: "laplacian",
    name: "Outline",
    note: "fires on any edge, any direction",
    k: [
      [-1, -1, -1],
      [-1, 8, -1],
      [-1, -1, -1],
    ],
  },
  {
    key: "sharpen",
    name: "Sharpen",
    note: "amplifies the center against its neighbors",
    k: [
      [0, -1, 0],
      [-1, 5, -1],
      [0, -1, 0],
    ],
  },
  {
    key: "blur",
    name: "Gaussian Blur",
    note: "averages neighbors — smooths everything",
    k: [
      [1 / 16, 2 / 16, 1 / 16],
      [2 / 16, 4 / 16, 2 / 16],
      [1 / 16, 2 / 16, 1 / 16],
    ],
  },
  {
    key: "emboss",
    name: "Emboss",
    note: "diagonal gradient — fakes a light source",
    k: [
      [-2, -1, 0],
      [-1, 1, 1],
      [0, 1, 2],
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Sprite presets (16×16) — '#' = 1, '+' = 0.55, '.' = 0               */
/* ------------------------------------------------------------------ */

function parseSprite(rows: string[]): Grid {
  return rows.map((r) => [...r].map((c) => (c === "#" ? 1 : c === "+" ? 0.55 : 0)));
}

export interface SpritePreset {
  key: string;
  name: string;
  grid: Grid;
}

export const SPRITES: SpritePreset[] = [
  {
    key: "bolt",
    name: "Bolt",
    grid: parseSprite([
      "................",
      ".......+##......",
      "......###.......",
      ".....###........",
      "....###.........",
      "...####+........",
      "...######+......",
      "....+######.....",
      "......+####.....",
      ".......###......",
      "......###.......",
      ".....###........",
      "....##+.........",
      "...##...........",
      "...#............",
      "................",
    ]),
  },
  {
    key: "heart",
    name: "Heart",
    grid: parseSprite([
      "................",
      "................",
      "...++....++.....",
      "..####..####....",
      ".############...",
      ".############...",
      ".############...",
      "..##########....",
      "...########.....",
      "....######......",
      ".....####.......",
      "......##........",
      "................",
      "................",
      "................",
      "................",
    ]),
  },
  {
    key: "ring",
    name: "Ring",
    grid: parseSprite([
      "................",
      "................",
      ".....+####+.....",
      "....##....##....",
      "...##......##...",
      "...#........#...",
      "...#........#...",
      "...#........#...",
      "...#........#...",
      "...##......##...",
      "....##....##....",
      ".....+####+.....",
      "................",
      "................",
      "................",
      "................",
    ]),
  },
  {
    key: "stripes",
    name: "Stripes",
    grid: parseSprite([
      "#...#...#...#...",
      "#...#...#...#...",
      "#...#...#...#...",
      "#...#...#...#...",
      "#...#...#...#...",
      "#...#...#...#...",
      "#...#...#...#...",
      "#...#...#...#...",
      "#...#...#...#...",
      "#...#...#...#...",
      "#...#...#...#...",
      "#...#...#...#...",
      "#...#...#...#...",
      "#...#...#...#...",
      "#...#...#...#...",
      "#...#...#...#...",
    ]),
  },
  {
    key: "cross",
    name: "Cross",
    grid: parseSprite([
      "................",
      "..##........##..",
      "..###......###..",
      "...###....###...",
      "....###..###....",
      ".....######.....",
      "......####......",
      "......####......",
      ".....######.....",
      "....###..###....",
      "...###....###...",
      "..###......###..",
      "..##........##..",
      "................",
      "................",
      "................",
    ]),
  },
];

/* ------------------------------------------------------------------ */
/* Colors                                                              */
/* ------------------------------------------------------------------ */

/**
 * Diverging colormap for feature maps: negative → cyan, positive → station
 * accent, magnitude → lightness/alpha. Returns a CSS oklch() string
 * (canvas2d accepts CSS color strings in all modern browsers).
 */
export function divergingColor(v: number, max: number, stationHue: number): string {
  if (max <= 0) return "oklch(0.2 0.005 265)";
  const t = Math.min(1, Math.abs(v) / max);
  if (t < 0.02) return "oklch(0.2 0.005 265)";
  const hue = v >= 0 ? stationHue : 205;
  const l = 0.2 + 0.62 * t;
  const c = 0.04 + 0.15 * t;
  return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${hue})`;
}

/** Grayscale for input pixels (warm ivory ink on graphite). */
export function inkColor(v: number): string {
  const t = Math.min(1, Math.max(0, v));
  const l = 0.17 + 0.75 * t;
  return `oklch(${l.toFixed(3)} ${(0.012 * t).toFixed(3)} 85)`;
}
