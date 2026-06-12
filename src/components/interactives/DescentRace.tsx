/**
 * Signature interactive for the Neural Networks station: SGD, momentum,
 * and Adam race down a 3D loss surface. Math is precomputed in
 * src/lib/descent.ts; the three.js scene lazy-loads in its own chunk.
 */
import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { OPTIMIZERS, SURFACES3, runOpt, type OptimizerKey, type Run3 } from "@/lib/descent";
import { InstrumentPanel } from "@/components/site/InstrumentPanel";

const Scene = lazy(() => import("./DescentRaceScene"));

const STEPS = 360;
const STEPS_PER_SEC = 26;

function ScenePlaceholder() {
  return (
    <div className="flex h-[340px] w-full items-center justify-center md:h-[400px]">
      <p className="label-tech">
        <span className="led led-pulse mr-2 inline-block align-middle" />
        warming up the 3d instrument…
      </p>
    </div>
  );
}

export function DescentRace() {
  const [surfKey, setSurfKey] = useState("ravine");
  const surf = SURFACES3.find((s) => s.key === surfKey)!;
  const [lrExp, setLrExp] = useState(-1.4); // lr = 10^lrExp
  const lr = 10 ** lrExp;
  const [start, setStart] = useState<[number, number] | null>(null);
  const [replay, setReplay] = useState(0);
  const s0 = start ?? surf.start;

  const runs = useMemo<Record<OptimizerKey, Run3>>(
    () => ({
      sgd: runOpt("sgd", surf, s0, lr, STEPS),
      momentum: runOpt("momentum", surf, s0, lr, STEPS),
      adam: runOpt("adam", surf, s0, lr, STEPS),
    }),
    [surf, s0, lr],
  );
  const maxLen = Math.max(...OPTIMIZERS.map((o) => runs[o.key].path.length));

  // animated reveal of the precomputed trajectories
  const [step, setStep] = useState(0);
  useEffect(() => {
    setStep(0);
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const tick = (now: number) => {
      // rAF timestamps are vsync-aligned and can sit BEFORE the
      // performance.now() captured at effect setup (negative delta), and
      // jump by seconds when the tab was backgrounded — clamp both ways.
      const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
      acc += dt * STEPS_PER_SEC;
      last = now;
      if (acc >= maxLen - 1) {
        setStep(maxLen - 1);
        return;
      }
      setStep(Math.floor(acc));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [runs, maxLen, replay]);

  // never render the 3D chunk during SSR
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const racing = step < maxLen - 1;

  return (
    <InstrumentPanel
      label="Optimizer race — three solvers, one landscape"
      live={racing}
      readout={`step ${Math.min(step, maxLen - 1)} / ${maxLen - 1}`}
    >
      {mounted ? (
        <Suspense fallback={<ScenePlaceholder />}>
          <Scene
            surface={surf}
            runs={runs}
            step={step}
            onPlace={(p) => {
              setStart(p);
              setReplay((n) => n + 1);
            }}
          />
        </Suspense>
      ) : (
        <ScenePlaceholder />
      )}

      {/* legend with live per-optimizer losses */}
      <div className="mt-1 flex flex-wrap items-center justify-center gap-x-5 gap-y-1">
        {OPTIMIZERS.map((o) => {
          const run = runs[o.key];
          const i = Math.max(0, Math.min(step, run.path.length - 1));
          const dead = run.diverged && step >= run.path.length - 1;
          return (
            <span key={o.key} className="readout text-[11px] text-muted-foreground">
              <span
                aria-hidden
                className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle"
                style={{ backgroundColor: o.color, boxShadow: `0 0 5px ${o.color}66` }}
              />
              {o.name.toLowerCase()}{" "}
              {dead ? (
                <span className="text-destructive">diverged</span>
              ) : (
                run.path[i][2].toFixed(3)
              )}
            </span>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
        {SURFACES3.map((s) => (
          <button
            key={s.key}
            className="btn-tech"
            data-active={surfKey === s.key}
            onClick={() => {
              setSurfKey(s.key);
              setStart(null);
            }}
          >
            {s.name.toLowerCase()}
          </button>
        ))}
        <label className="label-tech ml-3 flex items-center gap-2">
          lr 10^
          <input
            type="range"
            min={-2.2}
            max={-0.7}
            step={0.05}
            value={lrExp}
            onChange={(e) => setLrExp(Number(e.target.value))}
            style={{ accentColor: "var(--station)", width: 120 }}
          />
          <span className="readout">{lr.toFixed(3)}</span>
        </label>
        <button className="btn-tech" onClick={() => setReplay((n) => n + 1)}>
          replay
        </button>
      </div>
      <p className="label-tech mt-3 text-center normal-case tracking-normal">
        {surf.note} — drag to orbit · click the surface to re-drop all three
      </p>
    </InstrumentPanel>
  );
}
