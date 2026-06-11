/**
 * The forward process, computed live: x_t = √ᾱ_t·x₀ + √(1−ᾱ_t)·ε on a
 * little procedural seascape, with the ᾱ schedule plotted alongside.
 * This is the exact corruption a diffusion model is trained to undo.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { alphaBars, gaussianField, noisyMix } from "@/lib/diffusion";
import { InstrumentPanel } from "@/components/site/InstrumentPanel";

const N = 48; // image edge in "pixels"
const DISP = 240; // canvas css px
const T = 1000;

/** Tiny procedural dusk seascape (echoes the deck's lighthouse palette). */
function makeScene(): Float64Array {
  const img = new Float64Array(N * N * 3);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const i = (y * N + x) * 3;
      const v = y / N;
      // sky gradient → amber horizon
      let r = 0.16 + 0.55 * v;
      let g = 0.12 + 0.3 * v;
      let b = 0.22 + 0.1 * v;
      // sun
      const d = Math.hypot(x - 33, y - 16);
      if (d < 5.5) {
        r = 1;
        g = 0.82;
        b = 0.45;
      }
      // sea with light bands
      if (y > 30) {
        const band = Math.sin(y * 1.6 + x * 0.18) > 0.55 ? 0.16 : 0;
        r = 0.1 + band * 1.4;
        g = 0.16 + band;
        b = 0.24 + band * 0.5;
      }
      // cliff silhouette
      if (x < 14 - (y - 47) * 0.0 && y > 20 && x < Math.max(2, 16 - (y - 20) * 0.28)) {
        r = 0.07;
        g = 0.06;
        b = 0.08;
      }
      img[i] = r;
      img[i + 1] = g;
      img[i + 2] = b;
    }
  }
  return img;
}

export function NoiseSchedule() {
  const [t, setT] = useState(300);
  const abars = useMemo(() => alphaBars(T), []);
  const scene = useMemo(makeScene, []);
  const eps = useMemo(() => gaussianField(N * N * 3, 17), []);
  const abar = abars[t];

  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = N;
    canvas.height = N;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = ctx.createImageData(N, N);
    for (let i = 0; i < N * N * 3; i += 3) {
      const j = (i / 3) * 4;
      for (let c = 0; c < 3; c++) {
        // image lives in [0,1]; noise is ~N(0,1) scaled to match its range
        const v = noisyMix(scene[i + c] * 2 - 1, eps[i + c], abar);
        img.data[j + c] = Math.max(0, Math.min(255, (v / 2 + 0.5) * 255));
      }
      img.data[j + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, [scene, eps, abar]);

  /* ---- ᾱ curve ---- */
  const CW = 240;
  const CH = 150;
  const PAD = 16;
  const xOf = (tt: number) => PAD + (tt / (T - 1)) * (CW - 2 * PAD);
  const yOf = (a: number) => CH - PAD - a * (CH - 2 * PAD);
  const curve = useMemo(
    () =>
      Array.from({ length: 100 }, (_, i) => {
        const tt = Math.round((i / 99) * (T - 1));
        return `${i === 0 ? "M" : "L"}${xOf(tt).toFixed(1)},${yOf(abars[tt]).toFixed(1)}`;
      }).join(" "),
    [abars],
  );

  return (
    <InstrumentPanel
      label="The forward process — destruction on a schedule"
      readout={`t = ${t} · ᾱ = ${abar.toFixed(3)}`}
    >
      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
        <div>
          <canvas
            ref={canvasRef}
            style={{ width: DISP, height: DISP, imageRendering: "pixelated" }}
            className="block border border-border"
          />
          <p className="label-tech mt-2 text-center normal-case tracking-normal">
            x<sub>t</sub> = √ᾱ·x₀ + √(1−ᾱ)·ε — computed live, per pixel
          </p>
        </div>
        <div>
          <svg width={CW} height={CH} viewBox={`0 0 ${CW} ${CH}`} className="block max-w-full">
            <line x1={PAD} y1={CH - PAD} x2={CW - PAD} y2={CH - PAD} stroke="var(--color-border)" />
            <line x1={PAD} y1={PAD} x2={PAD} y2={CH - PAD} stroke="var(--color-border)" />
            <path d={curve} fill="none" stroke="var(--station)" strokeWidth={2} />
            <line
              x1={xOf(t)}
              y1={PAD}
              x2={xOf(t)}
              y2={CH - PAD}
              stroke="var(--station-dim)"
              strokeWidth={2}
            />
            <circle cx={xOf(t)} cy={yOf(abar)} r={4} fill="var(--station)" />
            <text
              x={PAD + 4}
              y={PAD + 8}
              fill="var(--color-muted-foreground)"
              style={{ font: "500 9px var(--font-mono)" }}
            >
              ᾱ (signal kept)
            </text>
            <text
              x={CW - PAD}
              y={CH - 4}
              textAnchor="end"
              fill="var(--color-muted-foreground)"
              style={{ font: "500 9px var(--font-mono)" }}
            >
              t →
            </text>
          </svg>
          <label className="label-tech mt-3 flex items-center gap-2">
            t
            <input
              type="range"
              min={0}
              max={T - 1}
              value={t}
              onChange={(e) => setT(Number(e.target.value))}
              style={{ accentColor: "var(--station)", width: 170 }}
            />
          </label>
        </div>
      </div>
      <p className="label-tech mt-3 text-center normal-case tracking-normal">
        same ε the whole way — drag t and watch structure drown gradually, not all at once
      </p>
    </InstrumentPanel>
  );
}
