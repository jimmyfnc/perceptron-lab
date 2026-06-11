/**
 * A tiny MLP (2 → H → 1) training live in the browser, full-batch backprop
 * every frame. Same datasets and class colors as station 01's Boundary Lab —
 * the point is watching the boundary bend where KNN had to memorize.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { makeDataset, type DatasetKey } from "@/lib/ml";
import { initMLP, mlpAccuracy, mlpProb, trainEpoch, type ActKey, type MLP } from "@/lib/mlp";
import { InstrumentPanel } from "@/components/site/InstrumentPanel";

const SIZE = 340; // arena css px
const FIELD = 72; // probability-field resolution
const LR = 0.5;
const EPOCHS_PER_FRAME = 12;
const AUTO_PAUSE_AT = 8000;

const COLOR_A = "oklch(0.78 0.14 195)"; // class 0 — cyan (station 01 convention)
const COLOR_B = "oklch(0.8 0.13 75)"; // class 1 — amber
const REGION_A: [number, number, number] = [62, 134, 156];
const REGION_B: [number, number, number] = [160, 128, 52];

const DATASETS: { key: DatasetKey; name: string }[] = [
  { key: "checker", name: "checker" },
  { key: "moons", name: "moons" },
  { key: "blobs", name: "blobs" },
];

export function MLPTrainer() {
  const [preset, setPreset] = useState<DatasetKey>("checker");
  const [hidden, setHidden] = useState(4);
  const [act, setAct] = useState<ActKey>("tanh");
  const [running, setRunning] = useState(true);
  const [seed, setSeed] = useState(1);
  const [, setTick] = useState(0);

  const pts = useMemo(() => makeDataset(preset, 90, 0.35, seed * 100 + 3), [preset, seed]);

  const mlp = useRef<MLP | null>(null);
  const epoch = useRef(0);
  const lossHist = useRef<number[]>([]);

  // (re)wire the network whenever an architecture dial moves
  useEffect(() => {
    mlp.current = initMLP(hidden, act, seed * 7 + hidden);
    epoch.current = 0;
    lossHist.current = [];
    setRunning(true);
    setTick((t) => t + 1);
  }, [hidden, act, seed, preset]);

  // the training loop
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    const tick = () => {
      const m = mlp.current;
      if (!m) return;
      let loss = 0;
      for (let i = 0; i < EPOCHS_PER_FRAME; i++) loss = trainEpoch(m, pts, LR);
      epoch.current += EPOCHS_PER_FRAME;
      lossHist.current.push(loss);
      if (lossHist.current.length > 220) lossHist.current.shift();
      setTick((t) => t + 1);
      if (epoch.current >= AUTO_PAUSE_AT) {
        setRunning(false);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, pts]);

  /* ---- arena canvas: probability field + points ---- */
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const m = mlp.current;
    if (!canvas || !m) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, SIZE, SIZE);

    // alpha tracks confidence, so the decision boundary shows as a dark seam
    const img = new ImageData(FIELD, FIELD);
    for (let gy = 0; gy < FIELD; gy++) {
      for (let gx = 0; gx < FIELD; gx++) {
        const p = mlpProb(m, (gx + 0.5) / FIELD, (gy + 0.5) / FIELD);
        const [r, g, b] = p < 0.5 ? REGION_A : REGION_B;
        const i = gy * FIELD + gx;
        img.data[i * 4] = r;
        img.data[i * 4 + 1] = g;
        img.data[i * 4 + 2] = b;
        img.data[i * 4 + 3] = Math.round(Math.abs(p - 0.5) * 2 * 88);
      }
    }
    const off = document.createElement("canvas");
    off.width = FIELD;
    off.height = FIELD;
    off.getContext("2d")!.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(off, 0, 0, SIZE, SIZE);

    for (const p of pts) {
      ctx.beginPath();
      ctx.arc(p.x * SIZE, p.y * SIZE, 4, 0, Math.PI * 2);
      ctx.fillStyle = p.label === 0 ? COLOR_A : COLOR_B;
      ctx.fill();
      ctx.strokeStyle = "oklch(0.14 0.008 265)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  });

  /* ---- loss sparkline ---- */
  const SW = 296;
  const SH = 54;
  const hist = lossHist.current;
  const lossMax = Math.max(0.75, ...hist);
  const sparkline = hist
    .map(
      (v, i) =>
        `${i === 0 ? "M" : "L"}${((i / Math.max(1, hist.length - 1)) * SW).toFixed(1)},${(
          SH -
          4 -
          (v / lossMax) * (SH - 8)
        ).toFixed(1)}`,
    )
    .join(" ");

  const m = mlp.current;
  const loss = hist.length ? hist[hist.length - 1] : NaN;
  const acc = m ? mlpAccuracy(m, pts) : 0;

  return (
    <InstrumentPanel
      label="Live training — watch the boundary bend"
      live={running}
      readout={
        m
          ? `epoch ${epoch.current} · loss ${Number.isFinite(loss) ? loss.toFixed(3) : "—"} · acc ${Math.round(acc * 100)}%`
          : "—"
      }
    >
      <div className="flex flex-wrap items-start justify-center gap-4">
        <canvas ref={canvasRef} style={{ width: SIZE, height: SIZE }} className="block" />
        <div className="flex w-[296px] max-w-full flex-col gap-3">
          <div>
            <p className="label-tech mb-1.5">dataset</p>
            <div className="flex flex-wrap gap-1.5">
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
            </div>
          </div>
          <div>
            <p className="label-tech mb-1.5">hidden neurons</p>
            <div className="flex gap-1.5">
              {[2, 4, 8].map((h) => (
                <button
                  key={h}
                  className="btn-tech"
                  data-active={hidden === h}
                  onClick={() => setHidden(h)}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="label-tech mb-1.5">activation</p>
            <div className="flex gap-1.5">
              {(["tanh", "relu"] as const).map((a) => (
                <button
                  key={a}
                  className="btn-tech"
                  data-active={act === a}
                  onClick={() => setAct(a)}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="label-tech mb-1.5">loss</p>
            <svg
              width={SW}
              height={SH}
              viewBox={`0 0 ${SW} ${SH}`}
              className="block max-w-full border border-border bg-background/40"
            >
              {hist.length > 1 && (
                <path d={sparkline} fill="none" stroke="var(--station)" strokeWidth={1.5} />
              )}
            </svg>
          </div>
          <div className="flex gap-1.5">
            <button
              className="btn-tech"
              onClick={() => {
                if (!running && epoch.current >= AUTO_PAUSE_AT) {
                  epoch.current = 0; // give a finished run another lap
                }
                setRunning((r) => !r);
              }}
            >
              {running ? "pause" : "resume"}
            </button>
            <button className="btn-tech" onClick={() => setSeed((s) => s + 1)}>
              re-roll weights
            </button>
          </div>
        </div>
      </div>
      <p className="label-tech mt-3 text-center normal-case tracking-normal">
        checker is the XOR problem — try 2 hidden neurons and watch it struggle; if relu stalls
        flat, you&rsquo;ve met a dead neuron (re-roll)
      </p>
    </InstrumentPanel>
  );
}
