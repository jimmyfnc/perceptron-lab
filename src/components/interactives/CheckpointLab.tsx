/**
 * Checkpoint Lab (O2): a four-stage pipeline that occasionally breaks the
 * work, and ONE human you can wire in at any edge. Placement changes what
 * escapes and what rework costs — the human is a node with a budget, not a
 * vibe. Math in lib/graphsim (seeded, tested).
 */
import { useMemo, useState } from "react";
import { runCheckpoint, type CheckpointParams } from "@/lib/graphsim";
import { InstrumentPanel } from "@/components/site/InstrumentPanel";

const PARAMS: CheckpointParams = {
  stageDefect: [0.15, 0.1, 0.2, 0.1],
  catchProb: 0.9,
};
const STAGES = ["plan", "draft", "assemble", "polish"];
const TRIALS = 4000;

export function CheckpointLab() {
  const [slot, setSlot] = useState<number | null>(2);

  const results = useMemo(() => {
    const bySlot = [null, 0, 1, 2, 3].map((s) => ({
      slot: s as number | null,
      ...runCheckpoint(s as number | null, PARAMS, TRIALS, 41),
    }));
    return bySlot;
  }, []);
  const current = results.find((r) => r.slot === slot)!;
  const baseline = results.find((r) => r.slot === null)!;

  return (
    <InstrumentPanel
      label="checkpoint lab — one human, four possible gates"
      readout={`${TRIALS} runs · catches ${Math.round(PARAMS.catchProb * 100)}%`}
    >
      {/* the pipeline: click a gate between stages to station the human there */}
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {STAGES.map((s, i) => (
          <div key={s} className="flex items-center gap-1.5">
            <div className="border border-border bg-card px-3 py-2 text-center">
              <span className="label-tech block">{s}</span>
              <span className="readout text-[10px] text-muted-foreground">
                breaks {Math.round(PARAMS.stageDefect[i] * 100)}%
              </span>
            </div>
            <button
              onClick={() => setSlot(slot === i ? null : i)}
              aria-pressed={slot === i}
              title={`gate after ${s}`}
              className="flex h-9 w-9 items-center justify-center border transition-colors"
              style={{
                borderColor: slot === i ? "var(--station)" : "var(--color-border)",
                background: slot === i ? "var(--color-card)" : "transparent",
                color: slot === i ? "var(--station)" : "var(--color-muted-foreground)",
              }}
            >
              {slot === i ? "◉" : "○"}
            </button>
          </div>
        ))}
        <span className="label-tech">ship</span>
      </div>

      <div className="mx-auto mt-5 grid max-w-md grid-cols-2 gap-3">
        <div className="panel px-4 py-3 text-center">
          <p className="label-tech">defects shipped</p>
          <p className="readout mt-1 text-2xl text-station">
            {(current.escapedRate * 100).toFixed(1)}%
          </p>
          <p className="readout text-[10px] text-muted-foreground">
            {(baseline.escapedRate * 100).toFixed(1)}% with no gate
          </p>
        </div>
        <div className="panel px-4 py-3 text-center">
          <p className="label-tech">rework per run</p>
          <p className="readout mt-1 text-2xl text-station">{current.meanRework.toFixed(2)}</p>
          <p className="readout text-[10px] text-muted-foreground">stages redone on a catch</p>
        </div>
      </div>

      <div className="mx-auto mt-3 flex max-w-md flex-col gap-1">
        {results.map((r) => (
          <div
            key={String(r.slot)}
            className="grid grid-cols-[6.5rem_1fr_3.5rem] items-center gap-2"
          >
            <span
              className="label-tech"
              style={{ color: r.slot === slot ? "var(--station)" : undefined }}
            >
              {r.slot === null ? "no gate" : `after ${STAGES[r.slot]}`}
            </span>
            <span className="relative h-2.5 border border-border">
              <span
                className="absolute inset-y-0 left-0"
                style={{
                  width: `${(r.escapedRate / baseline.escapedRate) * 100}%`,
                  background: r.slot === slot ? "var(--station-dim)" : "var(--color-secondary)",
                }}
              />
            </span>
            <span className="readout text-[10px] text-muted-foreground">
              {(r.escapedRate * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>

      <p className="label-tech mt-4 text-center normal-case tracking-normal">
        the last gate ships the fewest defects but pays the most rework per catch — anything it
        finds means redoing every stage since the break. governance is a placement problem.
      </p>
    </InstrumentPanel>
  );
}
