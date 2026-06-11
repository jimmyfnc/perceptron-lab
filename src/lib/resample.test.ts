import { describe, expect, it } from "vitest";
import {
  MUSHROOM,
  makeImage,
  makePhoto,
  scale,
  scaleBilinear,
  scaleNearest,
  spriteImage,
} from "./resample";

function checker2(): ReturnType<typeof makeImage> {
  // 2×2: black / white on the diagonal
  const img = makeImage(2, 2);
  const set = (x: number, y: number, v: number) => {
    const i = (y * 2 + x) * 4;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  };
  set(0, 0, 0);
  set(1, 0, 255);
  set(0, 1, 255);
  set(1, 1, 0);
  return img;
}

describe("scaleNearest", () => {
  it("integer upscale replicates pixels exactly — no new colors", () => {
    const out = scaleNearest(checker2(), 4, 4);
    const values = new Set<number>();
    for (let i = 0; i < out.data.length; i += 4) values.add(out.data[i]);
    expect([...values].sort((a, b) => a - b)).toEqual([0, 255]);
    // top-left 2×2 block is all source pixel (0,0)
    for (const [x, y] of [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ]) {
      expect(out.data[(y * 4 + x) * 4]).toBe(0);
    }
  });
});

describe("scaleBilinear", () => {
  it("invents intermediate values on hard edges (the blur)", () => {
    const out = scaleBilinear(checker2(), 4, 4);
    const values = new Set<number>();
    for (let i = 0; i < out.data.length; i += 4) values.add(out.data[i]);
    expect(values.size).toBeGreaterThan(2);
  });

  it("uniform image stays uniform", () => {
    const img = makeImage(3, 3);
    img.data.fill(128);
    const out = scaleBilinear(img, 9, 9);
    for (let i = 0; i < out.data.length; i++) expect(out.data[i]).toBe(128);
  });
});

describe("scale dispatch and dimensions", () => {
  it("all methods produce the requested dimensions", () => {
    for (const m of ["nearest", "bilinear", "bicubic"] as const) {
      const out = scale(MUSHROOM, 48, 48, m);
      expect(out.width).toBe(48);
      expect(out.height).toBe(48);
      expect(out.data.length).toBe(48 * 48 * 4);
    }
  });

  it("bicubic output is clamped to valid bytes", () => {
    const out = scale(checker2(), 8, 8, "bicubic");
    for (let i = 0; i < out.data.length; i++) {
      expect(out.data[i]).toBeGreaterThanOrEqual(0);
      expect(out.data[i]).toBeLessThanOrEqual(255);
    }
  });
});

describe("sources", () => {
  it("sprite parser maps palette chars and fills background", () => {
    const img = spriteImage(["a.", ".a"], { a: "#ff0000" });
    expect(img.data[0]).toBe(255); // (0,0) red
    expect(img.data[4]).toBe(24); // (1,0) background
    expect(img.data[3]).toBe(255); // opaque everywhere
  });

  it("MUSHROOM is 16×16; photo source is smooth", () => {
    expect(MUSHROOM.width).toBe(16);
    expect(MUSHROOM.height).toBe(16);
    const photo = makePhoto(16);
    // neighboring pixels differ gently, not by hard steps
    const a = photo.data[(8 * 16 + 7) * 4];
    const b = photo.data[(8 * 16 + 8) * 4];
    expect(Math.abs(a - b)).toBeLessThan(40);
  });
});
