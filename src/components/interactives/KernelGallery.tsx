import { useEffect, useMemo, useRef, useState } from "react";
import { KERNELS, convolve, absMax, type Grid } from "@/lib/conv";
import { InstrumentPanel } from "@/components/site/InstrumentPanel";

const SIZE = 160;
const SCALE = 2; // css pixels per image pixel

/**
 * Procedural "test card" — a calibration-pattern image (circle, wedge
 * stripes, gradient, checker) so each kernel's behavior is unmistakable.
 */
function makeTestCard(): Grid {
  const g: Grid = Array.from({ length: SIZE }, () => Array<number>(SIZE).fill(0));
  const cx = 52,
    cy = 60,
    r = 34;
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      // base: gentle diagonal gradient
      let v = 0.15 + 0.25 * ((x + y) / (2 * SIZE));
      // filled disc with bright rim
      const d = Math.hypot(x - cx, y - cy);
      if (d < r) v = 0.75 - 0.3 * (d / r);
      if (Math.abs(d - r) < 1.6) v = 1;
      // diagonal stripes, top right
      if (x > 96 && y < 72 && ((x + y) >> 2) % 2 === 0) v = 0.9;
      // checkerboard, bottom right
      if (x > 96 && y > 88 && ((x >> 3) + (y >> 3)) % 2 === 0) v = 0.85;
      // horizontal bars, bottom left
      if (x < 80 && y > 110 && (y >> 2) % 2 === 0) v = 0.8;
      g[y][x] = v;
    }
  }
  return g;
}

function drawGray(canvas: HTMLCanvasElement, img: Grid, normalize: boolean) {
  const h = img.length,
    w = img[0].length;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = w * SCALE * dpr;
  canvas.height = h * SCALE * dpr;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.imageSmoothingEnabled = false;
  const off = document.createElement("canvas");
  off.width = w;
  off.height = h;
  const octx = off.getContext("2d")!;
  const data = octx.createImageData(w, h);
  const m = normalize ? Math.max(absMax(img), 1e-9) : 1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const raw = normalize ? Math.abs(img[y][x]) / m : img[y][x];
      const v = Math.round(255 * Math.min(1, Math.max(0, raw)));
      const i = (y * w + x) * 4;
      // tint toward warm ivory rather than pure white
      data.data[i] = v;
      data.data[i + 1] = Math.round(v * 0.97);
      data.data[i + 2] = Math.round(v * 0.9);
      data.data[i + 3] = 255;
    }
  }
  octx.putImageData(data, 0, 0);
  ctx.drawImage(off, 0, 0, w * SCALE * dpr, h * SCALE * dpr);
}

export function KernelGallery() {
  const card = useMemo(makeTestCard, []);
  const [kernelKey, setKernelKey] = useState("sobel-x");
  const preset = KERNELS.find((k) => k.key === kernelKey) ?? KERNELS[1];
  const filtered = useMemo(() => convolve(card, preset.k), [card, preset]);
  // edge-style kernels (weights sum ≈ 0) read better as magnitude maps
  const kernelSum = preset.k.flat().reduce((a, b) => a + b, 0);
  const normalize = Math.abs(kernelSum) < 0.5;

  const srcRef = useRef<HTMLCanvasElement>(null);
  const outRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (srcRef.current) drawGray(srcRef.current, card, false);
  }, [card]);
  useEffect(() => {
    if (outRef.current) drawGray(outRef.current, filtered, normalize);
  }, [filtered, normalize]);

  return (
    <InstrumentPanel
      label="Kernel gallery — same image, different weights"
      readout={preset.name.toLowerCase()}
    >
      <div className="flex flex-wrap items-start justify-center gap-5">
        <figure>
          <canvas ref={srcRef} style={{ width: SIZE * SCALE, height: SIZE * SCALE }} />
          <figcaption className="label-tech mt-2 text-center">test card · input</figcaption>
        </figure>
        <figure>
          <canvas ref={outRef} style={{ width: (SIZE - 2) * SCALE, height: (SIZE - 2) * SCALE }} />
          <figcaption className="label-tech mt-2 text-center">
            after {preset.name.toLowerCase()} {normalize ? "· |response|" : ""}
          </figcaption>
        </figure>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
        {KERNELS.map((k) => (
          <button
            key={k.key}
            className="btn-tech"
            data-active={kernelKey === k.key}
            onClick={() => setKernelKey(k.key)}
          >
            {k.name.toLowerCase()}
          </button>
        ))}
      </div>
      <p className="label-tech mt-3 text-center normal-case tracking-normal">{preset.note}</p>
    </InstrumentPanel>
  );
}
