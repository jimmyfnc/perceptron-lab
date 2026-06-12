import { useEffect, useMemo, useRef, useState } from "react";
import { SURFACES, descend, type Surface } from "@/lib/ml";
import { InstrumentPanel } from "@/components/site/InstrumentPanel";

const W = 460;
const H = 280;

function toPx(s: Surface, x: number, y: number): [number, number] {
  const [x0, x1, y0, y1] = s.window;
  return [((x - x0) / (x1 - x0)) * W, ((y - y0) / (y1 - y0)) * H];
}

function fromPx(s: Surface, px: number, py: number): [number, number] {
  const [x0, x1, y0, y1] = s.window;
  return [x0 + (px / W) * (x1 - x0), y0 + (py / H) * (y1 - y0)];
}

export function DescentContours() {
  const [surfKey, setSurfKey] = useState("ravine");
  const [lrExp, setLrExp] = useState(-1.3); // lr = 10^lrExp
  const lr = 10 ** lrExp;
  const surf = SURFACES.find((s) => s.key === surfKey)!;
  const [start, setStart] = useState<[number, number]>(surf.start);
  const [shown, setShown] = useState(0); // animated reveal of the path

  const run = useMemo(() => descend(surf, start, lr, 120), [surf, start, lr]);

  // animate the ball along the precomputed trajectory
  useEffect(() => {
    setShown(1);
    let raf = 0;
    let last = performance.now();
    let n = 1;
    const tick = (now: number) => {
      n += (now - last) / 40; // ~25 steps/s
      last = now;
      if (n >= run.path.length) {
        setShown(run.path.length);
        return;
      }
      setShown(Math.floor(n));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run]);

  /* ---- contour-banded background ---- */
  const bgRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = bgRef.current;
    if (!canvas) return;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    const img = ctx.createImageData(W, H);
    let fMax = 0;
    const vals = new Float32Array(W * H);
    for (let py = 0; py < H; py++) {
      for (let px = 0; px < W; px++) {
        const [x, y] = fromPx(surf, px, py);
        const v = surf.f(x, y);
        vals[py * W + px] = v;
        if (v > fMax) fMax = v;
      }
    }
    for (let i = 0; i < vals.length; i++) {
      const t = Math.sqrt(vals[i] / fMax); // sqrt spreads detail near the minimum
      const band = Math.floor(t * 14) / 14; // quantize → contour bands
      const l = 34 + band * 44;
      img.data[i * 4] = l;
      img.data[i * 4 + 1] = l + 4;
      img.data[i * 4 + 2] = l + 12;
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, [surf]);

  const path = run.path.slice(0, Math.max(1, shown));
  const ball = path[path.length - 1];
  const loss = surf.f(ball[0], ball[1]);

  return (
    <InstrumentPanel
      label="Gradient descent — drop a ball, pick a step size"
      live={shown < run.path.length}
      readout={
        run.diverged && shown >= run.path.length
          ? "DIVERGED — lr too high"
          : `step ${path.length - 1} · loss ${loss < 1e4 ? loss.toFixed(3) : "∞"}`
      }
    >
      <div className="relative mx-auto w-fit">
        <canvas
          ref={bgRef}
          style={{ width: W, maxWidth: "100%", height: "auto", aspectRatio: `${W} / ${H}` }}
          className="block cursor-crosshair"
          onPointerDown={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            // map from the (possibly shrunk) rendered size back to W x H space
            setStart(
              fromPx(
                surf,
                ((e.clientX - rect.left) * W) / rect.width,
                ((e.clientY - rect.top) * H) / rect.height,
              ),
            );
          }}
        />
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="pointer-events-none absolute inset-0 h-full w-full"
        >
          <polyline
            points={path.map(([x, y]) => toPx(surf, x, y).join(",")).join(" ")}
            fill="none"
            stroke="var(--station)"
            strokeWidth={1.5}
            opacity={0.8}
          />
          {(() => {
            const [bx, by] = toPx(surf, ball[0], ball[1]);
            if (bx < -20 || bx > W + 20 || by < -20 || by > H + 20) return null;
            return (
              <circle
                cx={bx}
                cy={by}
                r={5}
                fill="var(--station)"
                stroke="oklch(0.14 0.008 265)"
                strokeWidth={1.5}
              />
            );
          })()}
        </svg>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
        {SURFACES.map((s) => (
          <button
            key={s.key}
            className="btn-tech"
            data-active={surfKey === s.key}
            onClick={() => {
              setSurfKey(s.key);
              setStart(s.start);
            }}
          >
            {s.name.toLowerCase()}
          </button>
        ))}
        <label className="label-tech ml-3 flex items-center gap-2">
          lr 10^
          <input
            type="range"
            min={-2.5}
            max={-0.4}
            step={0.1}
            value={lrExp}
            onChange={(e) => setLrExp(Number(e.target.value))}
            style={{ accentColor: "var(--station)", width: 120 }}
          />
          <span className="readout">{lr.toFixed(3)}</span>
        </label>
        <button className="btn-tech" onClick={() => setStart([...start])}>
          re-drop
        </button>
      </div>
      <p className="label-tech mt-3 text-center normal-case tracking-normal">
        {surf.note} — click anywhere to drop the ball
      </p>
    </InstrumentPanel>
  );
}
