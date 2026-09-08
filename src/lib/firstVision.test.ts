import { describe, expect, it } from "vitest";
import { edgeStrength, visionScene } from "./firstVision";

describe("guided edge experiment", () => {
  it("finds no edges in a constant bright image", () => {
    for (const direction of ["vertical", "horizontal", "both"] as const) {
      expect(
        edgeStrength(visionScene("solid"), direction)
          .flat()
          .every((v) => v === 0),
      ).toBe(true);
    }
  });

  it("distinguishes edge orientation and keeps both brightness transitions", () => {
    const stripe = Array.from({ length: 12 }, () =>
      Array.from({ length: 12 }, (_, x) => (x >= 4 && x < 8 ? 1 : 0)),
    );
    const vertical = edgeStrength(stripe, "vertical");
    expect(vertical[4][2]).toBe(1);
    expect(vertical[4][7]).toBe(1);
    expect(vertical[4][5]).toBe(0);
    expect(
      edgeStrength(stripe, "horizontal")
        .flat()
        .every((v) => v === 0),
    ).toBe(true);
    const rotated = stripe[0].map((_, x) => stripe.map((row) => row[x]));
    expect(edgeStrength(rotated, "horizontal")[2][4]).toBe(1);
    expect(
      edgeStrength(rotated, "vertical")
        .flat()
        .every((v) => v === 0),
    ).toBe(true);
  });

  it("moves the response with the square without changing its strength", () => {
    const centered = edgeStrength(visionScene("square"), "both");
    for (const offset of [-2, -1, 1, 2]) {
      const moved = edgeStrength(visionScene("square", offset), "both");
      centered.forEach((row, y) => {
        row.forEach((value, x) => {
          if (x + offset >= 0 && x + offset < 10) expect(moved[y][x + offset]).toBe(value);
          else expect(value).toBe(0);
        });
      });
    }
  });
});
