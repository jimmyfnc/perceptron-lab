/**
 * Wiring Loom (O2): the same noisy workers and judges, four wirings.
 * Nothing about the parts changes — only the topology — and the quality /
 * cost / latency readouts move. Math in lib/graphsim (seeded, tested).
 */
import { useMemo, useState } from "react";
import { TOPOLOGIES, summarizeTopology, type LoomParams, type TopologyId } from "@/lib/graphsim";
import { InstrumentPanel } from "@/components/site/InstrumentPanel";

const TRIALS = 600;

/* ---- tiny node-and-edge diagrams, one per topology ---- */

function Node({ x, y, w = 62, label }: { x: number; y: number; w?: number; label: string }) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={24}
        fill="var(--color-card)"
        stroke="var(--color-border)"
      />
      <text
        x={x + w / 2}
        y={y + 16}
        textAnchor="middle"
        fill="var(--color-foreground)"
        style={{ font: "10px 'Spline Sans Mono', monospace", letterSpacing: "0.08em" }}
      >
        {label}
      </text>
    </g>
  );
}

function Edge({ d, accent = false }: { d: string; accent?: boolean }) {
  return (
    <path
      d={d}
      fill="none"
      stroke={accent ? "var(--station)" : "var(--color-border)"}
      strokeWidth={accent ? 1.5 : 1}
      markerEnd="url(#loom-arrow)"
    />
  );
}

function Diagram({ id }: { id: TopologyId }) {
  return (
    <svg viewBox="0 0 320 120" className="h-auto w-full max-w-[320px]">
      <defs>
        <marker
          id="loom-arrow"
          viewBox="0 0 8 8"
          refX={7}
          refY={4}
          markerWidth={7}
          markerHeight={7}
          orient="auto"
        >
          <path d="M0 0 L8 4 L0 8 z" fill="var(--station-dim)" />
        </marker>
      </defs>
      {id === "solo" && (
        <>
          <Node x={30} y={48} label="task" />
          <Edge d="M92 60 H 128" accent />
          <Node x={130} y={48} label="worker" />
          <Edge d="M192 60 H 228" accent />
          <Node x={230} y={48} label="ship" />
        </>
      )}
      {id === "pipeline" && (
        <>
          <Node x={4} y={48} w={54} label="task" />
          <Edge d="M58 60 H 76" accent />
          <Node x={78} y={48} w={58} label="draft" />
          <Edge d="M136 60 H 154" accent />
          <Node x={156} y={48} w={58} label="revise" />
          <Edge d="M214 60 H 232" accent />
          <Node x={234} y={48} w={58} label="revise" />
          <Edge d="M292 60 H 306" accent />
        </>
      )}
      {id === "bestOf" && (
        <>
          <Node x={10} y={48} w={54} label="task" />
          <Edge d="M64 56 C 90 30, 100 24, 124 24" />
          <Edge d="M64 60 H 124" />
          <Edge d="M64 64 C 90 90, 100 96, 124 96" />
          <Node x={126} y={12} w={58} label="worker" />
          <Node x={126} y={48} w={58} label="worker" />
          <Node x={126} y={84} w={58} label="worker" />
          <Edge d="M184 24 C 208 24, 214 50, 232 56" accent />
          <Edge d="M184 60 H 232" accent />
          <Edge d="M184 96 C 208 96, 214 70, 232 64" accent />
          <Node x={234} y={48} w={58} label="judge" />
          <Edge d="M292 60 H 308" accent />
        </>
      )}
      {id === "reviewLoop" && (
        <>
          <Node x={16} y={48} w={54} label="task" />
          <Edge d="M70 60 H 104" accent />
          <Node x={106} y={48} w={62} label="worker" />
          <Edge d="M168 54 C 190 40, 204 40, 226 54" accent />
          <Edge d="M226 66 C 204 80, 190 80, 168 66" accent />
          <Node x={228} y={48} w={66} label="reviewer" />
          <Edge d="M294 60 H 310" accent />
        </>
      )}
    </svg>
  );
}

/* ---- readout row per topology ---- */

function TopoRow({
  id,
  title,
  blurb,
  meanQ,
  meanCalls,
  meanDepth,
  active,
  onPick,
}: {
  id: TopologyId;
  title: string;
  blurb: string;
  meanQ: number;
  meanCalls: number;
  meanDepth: number;
  active: boolean;
  onPick: (id: TopologyId) => void;
}) {
  return (
    <button
      onClick={() => onPick(id)}
      className="grid w-full grid-cols-[7.5rem_1fr_3.4rem_3.4rem] items-center gap-2 border px-3 py-2 text-left transition-colors"
      style={{
        borderColor: active ? "var(--station-dim)" : "var(--color-border)",
        background: active ? "var(--color-card)" : "transparent",
      }}
    >
      <span>
        <span className="label-tech block" style={{ color: active ? "var(--station)" : undefined }}>
          {title}
        </span>
        <span className="readout text-[10px] text-muted-foreground">{blurb}</span>
      </span>
      <span className="relative h-3 border border-border">
        <span
          className="absolute inset-y-0 left-0 transition-all duration-200"
          style={{ width: `${meanQ * 100}%`, background: "var(--station-dim)" }}
        />
        <span className="readout absolute inset-y-0 right-1 text-[10px] leading-3 text-foreground">
          {(meanQ * 100).toFixed(0)}%
        </span>
      </span>
      <span className="readout text-[11px] text-muted-foreground">{meanCalls.toFixed(1)}×</span>
      <span className="readout text-[11px] text-muted-foreground">{meanDepth.toFixed(1)}</span>
    </button>
  );
}

export function WiringLoom() {
  const [workerNoise, setWorkerNoise] = useState(0.25);
  const [judgeNoise, setJudgeNoise] = useState(0.15);
  const [picked, setPicked] = useState<TopologyId>("bestOf");

  const params: LoomParams = useMemo(
    () => ({ workerNoise, judgeNoise }),
    [workerNoise, judgeNoise],
  );
  const rows = useMemo(
    () => TOPOLOGIES.map((t, i) => ({ ...t, ...summarizeTopology(t.id, params, TRIALS, 31 + i) })),
    [params],
  );

  return (
    <InstrumentPanel
      label="wiring loom — same parts, four wirings"
      readout={`${TRIALS} trials each`}
    >
      <div className="grid items-center gap-4 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="flex flex-col items-center gap-3">
          <Diagram id={picked} />
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <label className="label-tech block">
              worker luck ±{workerNoise.toFixed(2)}
              <input
                type="range"
                min={0.05}
                max={0.4}
                step={0.05}
                value={workerNoise}
                onChange={(e) => setWorkerNoise(Number(e.target.value))}
                className="mt-2 block"
                style={{ accentColor: "var(--station)", width: 130 }}
              />
            </label>
            <label className="label-tech block">
              judge noise ±{judgeNoise.toFixed(2)}
              <input
                type="range"
                min={0}
                max={0.4}
                step={0.05}
                value={judgeNoise}
                onChange={(e) => setJudgeNoise(Number(e.target.value))}
                className="mt-2 block"
                style={{ accentColor: "var(--station)", width: 130 }}
              />
            </label>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="grid grid-cols-[7.5rem_1fr_3.4rem_3.4rem] gap-2 px-3">
            <span className="label-tech">topology</span>
            <span className="label-tech">quality</span>
            <span className="label-tech" title="model calls per task (cost)">
              calls
            </span>
            <span className="label-tech" title="longest dependency chain (latency)">
              depth
            </span>
          </div>
          {rows.map((r) => (
            <TopoRow key={r.id} {...r} active={picked === r.id} onPick={setPicked} />
          ))}
        </div>
      </div>
      <p className="label-tech mt-4 text-center normal-case tracking-normal">
        crank judge noise and watch best-of-3 fall back to the pack — fan-out only pays if the judge
        can see. workers and judges never change; only the wiring does.
      </p>
    </InstrumentPanel>
  );
}
