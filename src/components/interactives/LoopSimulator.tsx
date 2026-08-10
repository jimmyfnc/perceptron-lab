/**
 * Loop Simulator (Feedback Bench): a toy refinement loop with no LLM in it.
 * Drafts start mediocre; each revision closes part of the quality gap; the
 * only experimental variable is WHO reads the stop signal — an external
 * judge that sees true quality, or the worker's own noisy self-estimate.
 * Early stops and wasted rounds fall out of the estimate alone.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { runBatch, summarize, type SimParams } from "@/lib/loopsim";
import { InstrumentPanel } from "@/components/site/InstrumentPanel";

const W = 640;
const H = 300;
const PAD = { l: 40, r: 14, t: 14, b: 30 };
const TRIALS = 300;
const FAINT_TRACES = 26;

const COL_EXTERNAL = "oklch(0.74 0.165 145)"; // station green: you close the loop
const COL_SELF = "oklch(0.74 0.12 205)"; // convention cyan: the model closes it
const COL_ONESHOT = "oklch(0.62 0.02 260)";

const BASE: Omit<SimParams, "evalNoise" | "threshold"> = {
  gain: 0.35,
  reviseNoise: 0.05,
  maxSteps: 12,
};

export function LoopSimulator() {
  const [evalNoise, setEvalNoise] = useState(0.25);
  const [threshold, setThreshold] = useState(0.9);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const params: SimParams = useMemo(
    () => ({ ...BASE, evalNoise, threshold }),
    [evalNoise, threshold],
  );

  const sim = useMemo(() => {
    const oneshot = summarize(runBatch("oneshot", params, TRIALS, 21), params.maxSteps);
    const external = summarize(runBatch("external", params, TRIALS, 22), params.maxSteps);
    const selfTrials = runBatch("self", params, TRIALS, 23);
    return { oneshot, external, self: summarize(selfTrials, params.maxSteps), selfTrials };
  }, [params]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const px = (step: number) => PAD.l + (step / params.maxSteps) * (W - PAD.l - PAD.r);
    const py = (q: number) => H - PAD.b - q * (H - PAD.t - PAD.b);

    // frame + gridlines
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    for (const q of [0, 0.25, 0.5, 0.75, 1]) {
      ctx.beginPath();
      ctx.moveTo(PAD.l, py(q));
      ctx.lineTo(W - PAD.r, py(q));
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.font = "10px 'Spline Sans Mono', monospace";
    ctx.textAlign = "right";
    for (const q of [0, 0.5, 1]) ctx.fillText(q.toFixed(1), PAD.l - 6, py(q) + 3);
    ctx.textAlign = "center";
    for (let s = 0; s <= params.maxSteps; s += 3) ctx.fillText(String(s), px(s), H - PAD.b + 16);
    ctx.fillText("revision round", (PAD.l + W - PAD.r) / 2, H - 4);

    // the bar to clear
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(PAD.l, py(threshold));
    ctx.lineTo(W - PAD.r, py(threshold));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.textAlign = "left";
    ctx.fillText("target", PAD.l + 4, py(threshold) - 5);

    // faint individual self-mode trials: the variance IS the story
    ctx.lineWidth = 1;
    for (let i = 0; i < FAINT_TRACES; i++) {
      const t = sim.selfTrials[i];
      ctx.strokeStyle =
        t.stop === "early" ? "oklch(0.6 0.12 205 / 0.35)" : "oklch(0.6 0.12 205 / 0.14)";
      ctx.beginPath();
      t.steps.forEach((s, j) =>
        j === 0 ? ctx.moveTo(px(j), py(s.q)) : ctx.lineTo(px(j), py(s.q)),
      );
      ctx.stroke();
      const last = t.steps.length - 1;
      if (t.stop === "early") {
        ctx.fillStyle = "oklch(0.7 0.14 205 / 0.6)";
        ctx.beginPath();
        ctx.arc(px(last), py(t.steps[last].q), 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const curve = (qs: number[], color: string, dash: number[] = []) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash(dash);
      ctx.beginPath();
      qs.forEach((q, i) => (i === 0 ? ctx.moveTo(px(i), py(q)) : ctx.lineTo(px(i), py(q))));
      ctx.stroke();
      ctx.setLineDash([]);
    };
    curve(
      sim.oneshot.meanCurve.map(() => sim.oneshot.meanFinal),
      COL_ONESHOT,
      [3, 4],
    );
    curve(sim.self.meanCurve, COL_SELF);
    curve(sim.external.meanCurve, COL_EXTERNAL);
  }, [sim, params.maxSteps, threshold]);

  const pct = (x: number) => `${Math.round(x * 100)}%`;

  return (
    <InstrumentPanel
      label="loop simulator — who closes the loop?"
      readout={`${TRIALS} trials · ${BASE.maxSteps} rounds max`}
    >
      <div className="flex flex-col gap-4">
        <canvas
          ref={canvasRef}
          style={{ width: "100%", maxWidth: W, aspectRatio: `${W}/${H}` }}
          className="mx-auto block"
          aria-label="Mean quality per revision round for one-shot, externally-judged, and self-judged loops"
        />
        <div className="flex flex-wrap items-end justify-center gap-x-8 gap-y-3">
          <label className="label-tech block">
            self-eval noise ±{evalNoise.toFixed(2)}
            <input
              type="range"
              min={0}
              max={0.5}
              step={0.05}
              value={evalNoise}
              onChange={(e) => setEvalNoise(Number(e.target.value))}
              className="mt-2 block"
              style={{ accentColor: "var(--station)", width: 150 }}
            />
          </label>
          <label className="label-tech block">
            quality bar {threshold.toFixed(2)}
            <input
              type="range"
              min={0.6}
              max={0.98}
              step={0.02}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="mt-2 block"
              style={{ accentColor: "var(--station)", width: 150 }}
            />
          </label>
          <div className="readout flex flex-col gap-1 text-[11px]">
            <span style={{ color: COL_ONESHOT }}>
              ―· one-shot · final {pct(sim.oneshot.meanFinal)}
            </span>
            <span style={{ color: COL_EXTERNAL }}>
              ― external judge · final {pct(sim.external.meanFinal)}
            </span>
            <span style={{ color: COL_SELF }}>
              ― self-judged · final {pct(sim.self.meanFinal)} · stops early{" "}
              {pct(sim.self.earlyRate)}
            </span>
          </div>
        </div>
        <p className="label-tech text-center normal-case tracking-normal">
          same drafts, same revisions — the only difference is whether the stop signal reads the
          truth or the worker&rsquo;s own estimate. dots mark trials that quit below the bar.
        </p>
      </div>
    </InstrumentPanel>
  );
}
