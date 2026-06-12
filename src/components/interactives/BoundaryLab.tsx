import { useEffect, useMemo, useRef, useState } from "react";
import { knnErrorCurve, knnPredict, makeDataset, type DatasetKey, type Pt } from "@/lib/ml";
import { InstrumentPanel } from "@/components/site/InstrumentPanel";

const SIZE = 440; // arena css px
const FIELD = 96; // decision-field resolution
const KS = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25];

const COLOR_A = "oklch(0.78 0.14 195)"; // class 0 — cyan
const COLOR_B = "oklch(0.8 0.13 75)"; // class 1 — amber
const REGION_A: [number, number, number] = [62, 134, 156];
const REGION_B: [number, number, number] = [160, 128, 52];

type Tool = "a" | "b" | "move" | "erase";

const DATASETS: { key: DatasetKey; name: string }[] = [
  { key: "moons", name: "moons" },
  { key: "blobs", name: "blobs" },
  { key: "checker", name: "checker" },
];

const pct = (v: number) => `${Math.round(v * 100)}%`;

export function BoundaryLab() {
  const [preset, setPreset] = useState<DatasetKey>("moons");
  const [noise, setNoise] = useState(0.5);
  const [seed, setSeed] = useState(1);
  const [k, setK] = useState(5);
  const [tool, setTool] = useState<Tool>("move");
  const [showTest, setShowTest] = useState(false);
  const [train, setTrain] = useState<Pt[]>(() => makeDataset("moons", 80, 0.5, 11));
  const dragIdx = useRef<number | null>(null);

  const test = useMemo(
    () => makeDataset(preset, 50, noise, seed * 1000 + 7),
    [preset, noise, seed],
  );

  // regenerate the editable training set when the data dials change
  useEffect(() => {
    setTrain(makeDataset(preset, 80, noise, seed * 1000 + 11));
  }, [preset, noise, seed]);

  const curve = useMemo(() => knnErrorCurve(train, test, KS), [train, test]);
  const at = curve.find((c) => c.k === k) ?? curve[0];

  /* ---- decision field (labels only — ImageData is built in the effect,
          since this memo also runs during SSR where ImageData doesn't exist) ---- */
  const field = useMemo(() => {
    const labels = new Uint8Array(FIELD * FIELD);
    for (let gy = 0; gy < FIELD; gy++) {
      for (let gx = 0; gx < FIELD; gx++) {
        labels[gy * FIELD + gx] = knnPredict(train, (gx + 0.5) / FIELD, (gy + 0.5) / FIELD, k);
      }
    }
    return labels;
  }, [train, k]);

  /* ---- arena canvas ---- */
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, SIZE, SIZE);

    // soft decision regions
    const img = new ImageData(FIELD, FIELD);
    for (let i = 0; i < field.length; i++) {
      const [r, g, b] = field[i] === 0 ? REGION_A : REGION_B;
      img.data[i * 4] = r;
      img.data[i * 4 + 1] = g;
      img.data[i * 4 + 2] = b;
      img.data[i * 4 + 3] = 64;
    }
    const off = document.createElement("canvas");
    off.width = FIELD;
    off.height = FIELD;
    off.getContext("2d")!.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(off, 0, 0, SIZE, SIZE);

    if (showTest) {
      for (const p of test) {
        ctx.beginPath();
        ctx.arc(p.x * SIZE, p.y * SIZE, 3.5, 0, Math.PI * 2);
        ctx.strokeStyle = p.label === 0 ? COLOR_A : COLOR_B;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        if (knnPredict(train, p.x, p.y, k) !== p.label) {
          ctx.beginPath();
          ctx.moveTo(p.x * SIZE - 6, p.y * SIZE - 6);
          ctx.lineTo(p.x * SIZE + 6, p.y * SIZE + 6);
          ctx.moveTo(p.x * SIZE + 6, p.y * SIZE - 6);
          ctx.lineTo(p.x * SIZE - 6, p.y * SIZE + 6);
          ctx.strokeStyle = "oklch(0.62 0.2 25 / 70%)";
          ctx.stroke();
        }
      }
    }

    for (const p of train) {
      ctx.beginPath();
      ctx.arc(p.x * SIZE, p.y * SIZE, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = p.label === 0 ? COLOR_A : COLOR_B;
      ctx.fill();
      ctx.strokeStyle = "oklch(0.14 0.008 265)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }, [field, train, test, showTest, k]);

  /* ---- pointer tools ---- */
  const toUnit = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
    };
  };

  const nearestIdx = (x: number, y: number, maxD = 0.035) => {
    let best = -1;
    let bestD = maxD * maxD;
    train.forEach((p, i) => {
      const d = (p.x - x) ** 2 + (p.y - y) ** 2;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    return best;
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const { x, y } = toUnit(e);
    if (tool === "a" || tool === "b") {
      setTrain((t) => [...t, { x, y, label: tool === "a" ? 0 : 1 }]);
    } else if (tool === "erase") {
      const i = nearestIdx(x, y);
      if (i >= 0) setTrain((t) => t.filter((_, j) => j !== i));
    } else {
      dragIdx.current = nearestIdx(x, y, 0.05);
    }
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (tool === "move" && dragIdx.current != null && dragIdx.current >= 0) {
      const { x, y } = toUnit(e);
      const i = dragIdx.current;
      setTrain((t) => t.map((p, j) => (j === i ? { ...p, x, y } : p)));
    } else if (tool === "erase" && e.buttons > 0) {
      const { x, y } = toUnit(e);
      const i = nearestIdx(x, y);
      if (i >= 0) setTrain((t) => t.filter((_, j) => j !== i));
    }
  };

  /* ---- error chart ---- */
  const CW = 296;
  const CH = 168;
  const PAD = { l: 30, r: 8, t: 10, b: 26 };
  const yMax = Math.max(0.4, ...curve.map((c) => Math.max(c.train, c.test))) * 1.1;
  const xOf = (kk: number) => PAD.l + ((kk - 1) / 24) * (CW - PAD.l - PAD.r);
  const yOf = (v: number) => CH - PAD.b - (v / yMax) * (CH - PAD.t - PAD.b);
  const lineOf = (sel: (c: (typeof curve)[number]) => number) =>
    curve
      .map((c, i) => `${i === 0 ? "M" : "L"}${xOf(c.k).toFixed(1)},${yOf(sel(c)).toFixed(1)}`)
      .join(" ");

  const pickK = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.buttons === 0 && e.type !== "pointerdown") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const fx = ((e.clientX - rect.left) / rect.width) * CW;
    const kk = 1 + Math.round(((fx - PAD.l) / (CW - PAD.l - PAD.r)) * 12) * 2;
    setK(Math.min(25, Math.max(1, kk)));
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[auto_minmax(0,1fr)] lg:justify-center">
      <InstrumentPanel
        label="01 · Arena"
        live
        readout={`${train.length} pts · k=${k} · train ${pct(at.train)} · test ${pct(at.test)}`}
        className="justify-self-center"
      >
        <canvas
          ref={canvasRef}
          style={{
            width: SIZE,
            maxWidth: "100%",
            height: "auto",
            aspectRatio: "1 / 1",
            touchAction: "none",
          }}
          className="cursor-crosshair"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={() => (dragIdx.current = null)}
          onPointerCancel={() => (dragIdx.current = null)}
        />
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <button
            className="btn-tech"
            data-active={tool === "move"}
            onClick={() => setTool("move")}
          >
            drag
          </button>
          <button
            className="btn-tech"
            data-active={tool === "a"}
            style={{ color: tool === "a" ? COLOR_A : undefined }}
            onClick={() => setTool("a")}
          >
            + cyan
          </button>
          <button
            className="btn-tech"
            data-active={tool === "b"}
            style={{ color: tool === "b" ? COLOR_B : undefined }}
            onClick={() => setTool("b")}
          >
            + amber
          </button>
          <button
            className="btn-tech"
            data-active={tool === "erase"}
            onClick={() => setTool("erase")}
          >
            erase
          </button>
          <span className="mx-1 h-4 w-px bg-border" />
          {DATASETS.map((d) => (
            <button
              key={d.key}
              className="btn-tech"
              data-active={preset === d.key}
              onClick={() => setPreset(d.key)}
            >
              {d.name}
            </button>
          ))}
          <button className="btn-tech" onClick={() => setSeed((s) => s + 1)}>
            reshuffle
          </button>
        </div>
      </InstrumentPanel>

      <div className="flex w-full max-w-sm flex-col gap-4 justify-self-center">
        <InstrumentPanel label="02 · Dials" readout={`k=${k} · noise ${noise.toFixed(1)}`}>
          <label className="label-tech block">
            k — neighbors voting
            <input
              type="range"
              min={1}
              max={25}
              step={2}
              value={k}
              onChange={(e) => setK(Number(e.target.value))}
              className="mt-2 block w-full"
              style={{ accentColor: "var(--station)" }}
            />
            <span className="readout mt-1 flex justify-between text-[10px] text-muted-foreground">
              <span>1 · memorize</span>
              <span>25 · generalize</span>
            </span>
          </label>
          <label className="label-tech mt-5 block">
            noise — class overlap
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={noise}
              onChange={(e) => setNoise(Number(e.target.value))}
              className="mt-2 block w-full"
              style={{ accentColor: "var(--station)" }}
            />
          </label>
          <button
            className="btn-tech mt-5"
            data-active={showTest}
            onClick={() => setShowTest((s) => !s)}
          >
            {showTest ? "hide" : "reveal"} held-out test points
          </button>
          {showTest && (
            <p className="label-tech mt-2 normal-case tracking-normal">
              hollow rings = test set · red × = misclassified at current k
            </p>
          )}
        </InstrumentPanel>

        <InstrumentPanel label="03 · Error vs k" readout="click the chart to set k">
          <svg
            width={CW}
            height={CH}
            viewBox={`0 0 ${CW} ${CH}`}
            className="mx-auto block max-w-full cursor-crosshair"
            onPointerDown={pickK}
            onPointerMove={pickK}
          >
            {/* axes */}
            <line
              x1={PAD.l}
              y1={CH - PAD.b}
              x2={CW - PAD.r}
              y2={CH - PAD.b}
              stroke="var(--color-border)"
            />
            <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={CH - PAD.b} stroke="var(--color-border)" />
            {[0, 0.2, 0.4].map(
              (v) =>
                v <= yMax && (
                  <g key={v}>
                    <line
                      x1={PAD.l}
                      y1={yOf(v)}
                      x2={CW - PAD.r}
                      y2={yOf(v)}
                      stroke="var(--color-border)"
                      strokeDasharray="2 4"
                    />
                    <text
                      x={PAD.l - 4}
                      y={yOf(v) + 3}
                      textAnchor="end"
                      fill="var(--color-muted-foreground)"
                      style={{ font: "500 8px var(--font-mono)" }}
                    >
                      {pct(v)}
                    </text>
                  </g>
                ),
            )}
            {/* current k marker */}
            <line
              x1={xOf(k)}
              y1={PAD.t}
              x2={xOf(k)}
              y2={CH - PAD.b}
              stroke="var(--station-dim)"
              strokeWidth={2}
            />
            {/* curves */}
            <path
              d={lineOf((c) => c.train)}
              fill="none"
              stroke="var(--color-muted-foreground)"
              strokeWidth={1.5}
              strokeDasharray="3 3"
            />
            <path d={lineOf((c) => c.test)} fill="none" stroke="var(--station)" strokeWidth={2} />
            <circle cx={xOf(k)} cy={yOf(at.test)} r={3.5} fill="var(--station)" />
            <circle
              cx={xOf(k)}
              cy={yOf(at.train)}
              r={3}
              fill="none"
              stroke="var(--color-muted-foreground)"
            />
            {/* labels */}
            <text
              x={PAD.l}
              y={CH - 8}
              fill="var(--color-muted-foreground)"
              style={{ font: "500 8px var(--font-mono)", letterSpacing: "0.1em" }}
            >
              ← OVERFIT
            </text>
            <text
              x={CW - PAD.r}
              y={CH - 8}
              textAnchor="end"
              fill="var(--color-muted-foreground)"
              style={{ font: "500 8px var(--font-mono)", letterSpacing: "0.1em" }}
            >
              UNDERFIT →
            </text>
          </svg>
          <p className="label-tech mt-2 normal-case tracking-normal">
            <span className="text-station">solid</span> = test error ·{" "}
            <span className="text-muted-foreground">dashed</span> = train error — the gap between
            them is overfitting
          </p>
        </InstrumentPanel>
      </div>
    </div>
  );
}
