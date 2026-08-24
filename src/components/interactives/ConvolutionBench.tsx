import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  KERNELS,
  SPRITES,
  absMax,
  cloneGrid,
  convolve,
  divergingColor,
  gridSize,
  inkColor,
  macAt,
  makeGrid,
  maxPool,
  relu,
  type Grid,
} from "@/lib/conv";
import { InstrumentPanel } from "@/components/site/InstrumentPanel";

const IN = 16; // input side
const K = 3; // kernel side
const OUT = IN - K + 1; // 14
const CELL_IN = 21;
const CELL_OUT = 24;
const STATION_HUE = 305;

type CellRC = { y: number; x: number };

function useGridCanvas(
  draw: (ctx: CanvasRenderingContext2D, cssW: number, cssH: number) => void,
  logicalW?: number,
  logicalH?: number,
) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    if (canvas.width !== cssW * dpr || canvas.height !== cssH * dpr) {
      canvas.width = cssW * dpr;
      canvas.height = cssH * dpr;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // draw in logical coordinates even when the canvas is shrunk responsively
    const lw = logicalW ?? cssW;
    const lh = logicalH ?? cssH;
    ctx.setTransform((dpr * cssW) / lw, 0, 0, (dpr * cssH) / lh, 0, 0);
    draw(ctx, lw, lh);
  });
  return ref;
}

function cellFromEvent(
  e: React.PointerEvent<HTMLCanvasElement>,
  cell: number,
  side: number,
): CellRC | null {
  const rect = e.currentTarget.getBoundingClientRect();
  // normalize by the rendered size — the canvas may be shrunk on small screens
  const scale = (cell * side) / rect.width;
  const x = Math.floor(((e.clientX - rect.left) * scale) / cell);
  const y = Math.floor(((e.clientY - rect.top) * scale) / cell);
  if (x < 0 || y < 0 || x >= side || y >= side) return null;
  return { y, x };
}

const fmt = (v: number) => {
  const s = v.toFixed(2);
  return s === "-0.00" ? "0.00" : s;
};

export function ConvolutionBench() {
  const [input, setInput] = useState<Grid>(() => cloneGrid(SPRITES[0].grid));
  const [spriteKey, setSpriteKey] = useState<string>(SPRITES[0].key);
  const [kernelText, setKernelText] = useState<string[][]>(() =>
    KERNELS[1].k.map((r) => r.map((v) => String(Math.round(v * 100) / 100))),
  );
  const [kernelKey, setKernelKey] = useState<string>(KERNELS[1].key);
  const [brush, setBrush] = useState<"ink" | "erase">("ink");
  const [sweep, setSweep] = useState<{ playing: boolean; progress: number }>({
    playing: false,
    progress: OUT * OUT,
  });
  const [hoverOut, setHoverOut] = useState<CellRC | null>(null);
  const paintingRef = useRef(false);

  const kernel = useMemo<Grid>(
    () => kernelText.map((r) => r.map((s) => (Number.isFinite(parseFloat(s)) ? parseFloat(s) : 0))),
    [kernelText],
  );

  const output = useMemo(() => convolve(input, kernel), [input, kernel]);
  const reluOut = useMemo(() => relu(output), [output]);
  const pooled = useMemo(() => maxPool(reluOut, 2), [reluOut]);
  const outMax = useMemo(() => Math.max(absMax(output), 1e-9), [output]);

  /* ---- sweep animation ---- */
  useEffect(() => {
    if (!sweep.playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setSweep((s) => {
        if (!s.playing) return s;
        const next = s.progress + dt * 60; // 60 cells / second
        return next >= OUT * OUT
          ? { playing: false, progress: OUT * OUT }
          : { ...s, progress: next };
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [sweep.playing]);

  const revealed = Math.floor(sweep.progress);
  const sweeping = sweep.playing || revealed < OUT * OUT;
  const sweepCell: CellRC | null = sweeping
    ? {
        y: Math.floor(Math.min(revealed, OUT * OUT - 1) / OUT),
        x: Math.min(revealed, OUT * OUT - 1) % OUT,
      }
    : null;
  const activeCell = sweepCell ?? hoverOut;
  const mac = activeCell ? macAt(input, kernel, activeCell.y, activeCell.x) : null;

  /* ---- painting ---- */
  const paint = useCallback(
    (c: CellRC | null) => {
      if (!c) return;
      setInput((g) => {
        const v = brush === "ink" ? 1 : 0;
        if (g[c.y][c.x] === v) return g;
        const n = cloneGrid(g);
        n[c.y][c.x] = v;
        return n;
      });
      setSpriteKey("custom");
    },
    [brush],
  );

  /* ---- canvases ---- */
  const inputRef = useGridCanvas(
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      for (let y = 0; y < IN; y++) {
        for (let x = 0; x < IN; x++) {
          ctx.fillStyle = inkColor(input[y][x]);
          ctx.fillRect(x * CELL_IN + 1, y * CELL_IN + 1, CELL_IN - 2, CELL_IN - 2);
        }
      }
      if (activeCell) {
        ctx.strokeStyle = `oklch(0.74 0.165 ${STATION_HUE})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(
          activeCell.x * CELL_IN + 0.5,
          activeCell.y * CELL_IN + 0.5,
          K * CELL_IN - 1,
          K * CELL_IN - 1,
        );
      }
    },
    IN * CELL_IN,
    IN * CELL_IN,
  );

  const outputRef = useGridCanvas(
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      for (let y = 0; y < OUT; y++) {
        for (let x = 0; x < OUT; x++) {
          const i = y * OUT + x;
          if (i < revealed) {
            ctx.fillStyle = divergingColor(output[y][x], outMax, STATION_HUE);
            ctx.fillRect(x * CELL_OUT + 1, y * CELL_OUT + 1, CELL_OUT - 2, CELL_OUT - 2);
          } else {
            ctx.fillStyle = "oklch(0.17 0.005 265)";
            ctx.fillRect(x * CELL_OUT + 1, y * CELL_OUT + 1, CELL_OUT - 2, CELL_OUT - 2);
            ctx.fillStyle = "oklch(0.26 0.005 265)";
            ctx.fillRect(x * CELL_OUT + CELL_OUT / 2 - 1, y * CELL_OUT + CELL_OUT / 2 - 1, 2, 2);
          }
        }
      }
      if (activeCell) {
        ctx.strokeStyle = `oklch(0.74 0.165 ${STATION_HUE})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(
          activeCell.x * CELL_OUT + 0.5,
          activeCell.y * CELL_OUT + 0.5,
          CELL_OUT - 1,
          CELL_OUT - 1,
        );
      }
    },
    OUT * CELL_OUT,
    OUT * CELL_OUT,
  );

  const reluRef = useGridCanvas((ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const c = 12;
    const m = Math.max(absMax(reluOut), 1e-9);
    for (let y = 0; y < OUT; y++) {
      for (let x = 0; x < OUT; x++) {
        ctx.fillStyle = divergingColor(reluOut[y][x], m, STATION_HUE);
        ctx.fillRect(x * c + 0.5, y * c + 0.5, c - 1, c - 1);
      }
    }
  });

  const poolRef = useGridCanvas((ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const { h: ph, w: pw } = gridSize(pooled);
    const c = 24;
    const m = Math.max(absMax(pooled), 1e-9);
    for (let y = 0; y < ph; y++) {
      for (let x = 0; x < pw; x++) {
        ctx.fillStyle = divergingColor(pooled[y][x], m, STATION_HUE);
        ctx.fillRect(x * c + 1, y * c + 1, c - 2, c - 2);
      }
    }
  });

  const setPresetKernel = (key: string) => {
    const p = KERNELS.find((k) => k.key === key);
    if (!p) return;
    setKernelKey(key);
    setKernelText(p.k.map((r) => r.map((v) => String(Math.round(v * 1000) / 1000))));
  };

  const kernelNote = KERNELS.find((k) => k.key === kernelKey)?.note ?? "your own pattern detector";

  return (
    <div className="flex flex-col gap-4">
      {/* main bench: input -> kernel -> feature map */}
      <div className="grid gap-4 lg:grid-cols-[auto_auto_auto] lg:items-start lg:justify-center">
        <InstrumentPanel
          label="01 · Input"
          readout={`${IN}×${IN} px`}
          className="justify-self-center"
        >
          <canvas
            ref={inputRef}
            style={{
              width: IN * CELL_IN,
              maxWidth: "100%",
              height: "auto",
              aspectRatio: "1 / 1",
              touchAction: "none",
            }}
            className="cursor-crosshair"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              paintingRef.current = true;
              paint(cellFromEvent(e, CELL_IN, IN));
            }}
            onPointerMove={(e) => {
              if (paintingRef.current) paint(cellFromEvent(e, CELL_IN, IN));
            }}
            onPointerUp={() => (paintingRef.current = false)}
            onPointerCancel={() => (paintingRef.current = false)}
          />
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {SPRITES.map((s) => (
              <button
                key={s.key}
                className="btn-tech"
                data-active={spriteKey === s.key}
                onClick={() => {
                  setSpriteKey(s.key);
                  setInput(cloneGrid(s.grid));
                }}
              >
                {s.name.toLowerCase()}
              </button>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <button
              className="btn-tech"
              data-active={brush === "ink"}
              onClick={() => setBrush("ink")}
            >
              ink
            </button>
            <button
              className="btn-tech"
              data-active={brush === "erase"}
              onClick={() => setBrush("erase")}
            >
              erase
            </button>
            <button
              className="btn-tech"
              onClick={() => {
                setInput(makeGrid(IN, IN));
                setSpriteKey("custom");
              }}
            >
              clear
            </button>
          </div>
        </InstrumentPanel>

        <InstrumentPanel
          label="02 · Kernel 3×3"
          readout={kernelKey === "custom" ? "custom" : kernelKey}
          className="justify-self-center"
        >
          <div className="grid w-fit grid-cols-3 gap-1">
            {kernelText.map((row, y) =>
              row.map((val, x) => (
                <input
                  key={`${y}-${x}`}
                  value={val}
                  aria-label={`kernel weight row ${y + 1}, column ${x + 1}`}
                  inputMode="decimal"
                  onChange={(e) => {
                    const n = kernelText.map((r) => [...r]);
                    n[y][x] = e.target.value;
                    setKernelText(n);
                    setKernelKey("custom");
                  }}
                  className="readout h-12 w-14 border border-input bg-secondary text-center text-sm outline-none transition-colors focus:border-station"
                />
              )),
            )}
          </div>
          <p className="label-tech mt-3 max-w-[12rem] normal-case tracking-normal">{kernelNote}</p>
          <div className="mt-3 flex max-w-[13rem] flex-wrap gap-1.5">
            {KERNELS.map((k) => (
              <button
                key={k.key}
                className="btn-tech"
                data-active={kernelKey === k.key}
                onClick={() => setPresetKernel(k.key)}
              >
                {k.name.toLowerCase()}
              </button>
            ))}
          </div>
          {/* MAC readout */}
          <div className="mt-4 border-t border-border pt-3">
            <p className="label-tech">
              {activeCell ? `Σ w·x @ (${activeCell.y},${activeCell.x})` : "Σ w·x — hover the map"}
            </p>
            <div className="readout mt-2 grid w-fit grid-cols-3 gap-x-3 gap-y-0.5 text-[11px]">
              {(mac?.terms ?? Array.from({ length: 9 }, () => null)).map((t, i) => (
                <span
                  key={i}
                  className={
                    t == null || t.w * t.x === 0
                      ? "text-muted-foreground"
                      : t.w * t.x > 0
                        ? "text-station"
                        : "text-[oklch(0.78_0.13_205)]"
                  }
                >
                  {t == null ? "—" : fmt(t.w * t.x)}
                </span>
              ))}
            </div>
            <p className="readout mt-2 text-sm">
              = <span className="text-station">{mac ? fmt(mac.sum) : "—"}</span>
            </p>
          </div>
        </InstrumentPanel>

        <InstrumentPanel
          label="03 · Feature map"
          live={sweep.playing}
          readout={`${OUT}×${OUT} · max|v| ${fmt(outMax)}`}
          className="justify-self-center"
        >
          <canvas
            ref={outputRef}
            style={{
              width: OUT * CELL_OUT,
              maxWidth: "100%",
              height: "auto",
              aspectRatio: "1 / 1",
            }}
            className="cursor-crosshair"
            onPointerMove={(e) => setHoverOut(cellFromEvent(e, CELL_OUT, OUT))}
            onPointerLeave={() => setHoverOut(null)}
          />
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <button
              className="btn-tech"
              data-active={sweep.playing}
              onClick={() =>
                setSweep((s) =>
                  s.playing
                    ? { ...s, playing: false }
                    : { playing: true, progress: s.progress >= OUT * OUT ? 0 : s.progress },
                )
              }
            >
              {sweep.playing ? "pause" : "sweep"}
            </button>
            <button
              className="btn-tech"
              disabled={sweep.playing}
              onClick={() =>
                setSweep((s) => ({
                  playing: false,
                  progress:
                    s.progress >= OUT * OUT ? 1 : Math.min(OUT * OUT, Math.floor(s.progress) + 1),
                }))
              }
            >
              step
            </button>
            <button
              className="btn-tech"
              onClick={() => setSweep({ playing: false, progress: OUT * OUT })}
            >
              reveal all
            </button>
            <span className="readout ml-auto text-[11px] text-muted-foreground">
              {Math.min(revealed, OUT * OUT)}/{OUT * OUT}
            </span>
          </div>
          <p className="label-tech mt-3 max-w-[21rem] normal-case tracking-normal">
            <span className="text-station">violet</span> = positive response,{" "}
            <span className="text-[oklch(0.78_0.13_205)]">cyan</span> = negative
          </p>
        </InstrumentPanel>
      </div>

      {/* pipeline extension: relu -> pool */}
      <div className="grid gap-4 sm:grid-cols-2 lg:mx-auto lg:w-fit lg:grid-cols-[auto_auto]">
        <InstrumentPanel label="04 · ReLU — max(0, v)" readout="negatives → 0">
          <div className="flex items-center gap-4">
            <canvas ref={reluRef} style={{ width: OUT * 12, height: OUT * 12 }} />
            <p className="label-tech max-w-[11rem] normal-case tracking-normal">
              the nonlinearity: keep what fired, silence the rest
            </p>
          </div>
        </InstrumentPanel>
        <InstrumentPanel label="05 · Max pool 2×2" readout={`${OUT}×${OUT} → 7×7`}>
          <div className="flex items-center gap-4">
            <canvas ref={poolRef} style={{ width: 7 * 24, height: 7 * 24 }} />
            <p className="label-tech max-w-[11rem] normal-case tracking-normal">
              keep the strongest response in each window — same features, quarter the pixels
            </p>
          </div>
        </InstrumentPanel>
      </div>
    </div>
  );
}
