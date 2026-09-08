import { convolve, KERNELS, type Grid } from "./conv";

export type EdgeDirection = "vertical" | "horizontal" | "both";
export type VisionScene = "square" | "solid";

const verticalKernel = KERNELS.find((kernel) => kernel.key === "sobel-x")!.k;
const horizontalKernel = KERNELS.find((kernel) => kernel.key === "sobel-y")!.k;

/** Keep the movable square inside the area covered by valid 3×3 convolution. */
export function visionScene(scene: VisionScene, offset = 0): Grid {
  const shift = Math.max(-2, Math.min(2, Math.round(offset)));
  return Array.from({ length: 12 }, (_, y) =>
    Array.from({ length: 12 }, (_, x) =>
      scene === "solid" || (y >= 4 && y < 8 && x >= 4 + shift && x < 8 + shift) ? 1 : 0,
    ),
  );
}

/**
 * Sobel response strength. Absolute values retain both light-to-dark and
 * dark-to-light edges; the combined view uses gradient magnitude.
 * A fixed display scale (4 = a full-contrast straight edge) preserves comparisons.
 */
export function edgeStrength(input: Grid, direction: EdgeDirection): Grid {
  const vertical = convolve(input, verticalKernel);
  const horizontal = convolve(input, horizontalKernel);
  return vertical.map((row, y) =>
    row.map((value, x) => {
      const strength =
        direction === "vertical"
          ? Math.abs(value)
          : direction === "horizontal"
            ? Math.abs(horizontal[y][x])
            : Math.hypot(value, horizontal[y][x]);
      return Math.min(1, strength / 4);
    }),
  );
}
