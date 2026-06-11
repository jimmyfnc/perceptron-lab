/**
 * Image resampling for the interlude — the three classic interpolators,
 * implemented by hand over RGBA buffers so the differences are honest.
 */

export interface Rgba {
  width: number;
  height: number;
  /** RGBA, row-major, length = width*height*4 */
  data: Uint8ClampedArray;
}

export function makeImage(width: number, height: number): Rgba {
  return { width, height, data: new Uint8ClampedArray(width * height * 4) };
}

function px(img: Rgba, x: number, y: number, c: number): number {
  // clamp-to-edge addressing
  const cx = Math.min(img.width - 1, Math.max(0, x));
  const cy = Math.min(img.height - 1, Math.max(0, y));
  return img.data[(cy * img.width + cx) * 4 + c];
}

export type ResampleMethod = "nearest" | "bilinear" | "bicubic";

/** Each output pixel copies the single closest source pixel. */
export function scaleNearest(src: Rgba, ow: number, oh: number): Rgba {
  const out = makeImage(ow, oh);
  for (let y = 0; y < oh; y++) {
    for (let x = 0; x < ow; x++) {
      const sx = Math.min(src.width - 1, Math.floor(((x + 0.5) * src.width) / ow));
      const sy = Math.min(src.height - 1, Math.floor(((y + 0.5) * src.height) / oh));
      for (let c = 0; c < 4; c++) {
        out.data[(y * ow + x) * 4 + c] = px(src, sx, sy, c);
      }
    }
  }
  return out;
}

/** Weighted average of the 4 surrounding source pixels. */
export function scaleBilinear(src: Rgba, ow: number, oh: number): Rgba {
  const out = makeImage(ow, oh);
  for (let y = 0; y < oh; y++) {
    for (let x = 0; x < ow; x++) {
      const fx = ((x + 0.5) * src.width) / ow - 0.5;
      const fy = ((y + 0.5) * src.height) / oh - 0.5;
      const x0 = Math.floor(fx);
      const y0 = Math.floor(fy);
      const tx = fx - x0;
      const ty = fy - y0;
      for (let c = 0; c < 4; c++) {
        const a = px(src, x0, y0, c) * (1 - tx) + px(src, x0 + 1, y0, c) * tx;
        const b = px(src, x0, y0 + 1, c) * (1 - tx) + px(src, x0 + 1, y0 + 1, c) * tx;
        out.data[(y * ow + x) * 4 + c] = a * (1 - ty) + b * ty;
      }
    }
  }
  return out;
}

/** Catmull–Rom cubic kernel over a 4×4 source neighborhood. */
function cubic(p0: number, p1: number, p2: number, p3: number, t: number): number {
  return (
    p1 + 0.5 * t * (p2 - p0 + t * (2 * p0 - 5 * p1 + 4 * p2 - p3 + t * (3 * (p1 - p2) + p3 - p0)))
  );
}

export function scaleBicubic(src: Rgba, ow: number, oh: number): Rgba {
  const out = makeImage(ow, oh);
  for (let y = 0; y < oh; y++) {
    for (let x = 0; x < ow; x++) {
      const fx = ((x + 0.5) * src.width) / ow - 0.5;
      const fy = ((y + 0.5) * src.height) / oh - 0.5;
      const x1 = Math.floor(fx);
      const y1 = Math.floor(fy);
      const tx = fx - x1;
      const ty = fy - y1;
      for (let c = 0; c < 4; c++) {
        const rows: number[] = [];
        for (let r = -1; r <= 2; r++) {
          rows.push(
            cubic(
              px(src, x1 - 1, y1 + r, c),
              px(src, x1, y1 + r, c),
              px(src, x1 + 1, y1 + r, c),
              px(src, x1 + 2, y1 + r, c),
              tx,
            ),
          );
        }
        out.data[(y * ow + x) * 4 + c] = cubic(rows[0], rows[1], rows[2], rows[3], ty);
      }
    }
  }
  return out;
}

export function scale(src: Rgba, ow: number, oh: number, method: ResampleMethod): Rgba {
  if (method === "nearest") return scaleNearest(src, ow, oh);
  if (method === "bilinear") return scaleBilinear(src, ow, oh);
  return scaleBicubic(src, ow, oh);
}

/* ------------------------------------------------------------------ */
/* Sources                                                             */
/* ------------------------------------------------------------------ */

/** Parse palette-keyed ASCII art into an RGBA image. */
export function spriteImage(rows: string[], palette: Record<string, string>): Rgba {
  const h = rows.length;
  const w = rows[0].length;
  const img = makeImage(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const hex = palette[rows[y][x]];
      const i = (y * w + x) * 4;
      if (!hex) {
        img.data[i + 3] = 255; // background stays opaque dark
        img.data[i] = 24;
        img.data[i + 1] = 24;
        img.data[i + 2] = 30;
        continue;
      }
      img.data[i] = parseInt(hex.slice(1, 3), 16);
      img.data[i + 1] = parseInt(hex.slice(3, 5), 16);
      img.data[i + 2] = parseInt(hex.slice(5, 7), 16);
      img.data[i + 3] = 255;
    }
  }
  return img;
}

/** 16×16 mushroom sprite — hard edges, flat fills: pixel art's home turf. */
export const MUSHROOM: Rgba = spriteImage(
  [
    "................",
    ".....rrrrrr.....",
    "....rrwwrrrr....",
    "...rrwwrrrrrr...",
    "..rrrwwrrwwrrr..",
    "..rrrrrrrwwrrr..",
    ".rrwwrrrrrrrrr..",
    ".rrwwrrrrwwrrr..",
    ".rrrrrrrrwwrrrr.",
    "..rrrrrrrrrrrr..",
    "....cccccccc....",
    "....cccecccc....",
    "....cceeeccc....",
    "....cccecccc....",
    "....cccccccc....",
    "................",
  ],
  { r: "#c8385a", w: "#f2ead8", c: "#e0c9a0", e: "#7a5c44" },
);

/** Smooth procedural "photo" — gradients and a soft disc, interpolation's home turf. */
export function makePhoto(size = 16): Rgba {
  const img = makeImage(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const t = (x + y) / (2 * size - 2);
      const d = Math.hypot(x - size * 0.62, y - size * 0.38) / (size * 0.45);
      const disc = Math.max(0, 1 - d * d);
      img.data[i] = 30 + 140 * t + 80 * disc;
      img.data[i + 1] = 40 + 70 * t + 60 * disc;
      img.data[i + 2] = 90 + 90 * (1 - t) + 30 * disc;
      img.data[i + 3] = 255;
    }
  }
  return img;
}
