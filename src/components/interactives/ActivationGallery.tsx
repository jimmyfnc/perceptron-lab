/**
 * The activation zoo: each function plotted with its derivative, plus a
 * "gradient survival" meter — how much gradient makes it back through a
 * chain of eight layers. Drag the input below 0 to kill a ReLU live.
 */
import { useMemo, useState } from "react";
import { ACTIVATIONS, activation, chainGradient, type ActKey } from "@/lib/mlp";
import { InstrumentPanel } from "@/components/site/InstrumentPanel";

const PW = 320;
const PH = 180;
const PAD = 14;
const XR = 4; // plot x ∈ [-4, 4]
const YR = 1.6; // plot y ∈ [-1.6, 1.6]
const DEPTH = 8;

const CYAN = "oklch(0.78 0.14 205)"; // derivative — site-wide "second trace" color

const px = (x: number) => PAD + ((x + XR) / (2 * XR)) * (PW - 2 * PAD);
const py = (y: number) =>
  PH - PAD - ((Math.max(-YR, Math.min(YR, y)) + YR) / (2 * YR)) * (PH - 2 * PAD);

function tracePath(f: (z: number) => number): string {
  const parts: string[] = [];
  for (let i = 0; i <= 160; i++) {
    const x = -XR + (2 * XR * i) / 160;
    parts.push(`${i === 0 ? "M" : "L"}${px(x).toFixed(1)},${py(f(x)).toFixed(1)}`);
  }
  return parts.join(" ");
}

/** log-scale bar height: 1 → full, 1e-6 → zero */
const barH = (g: number, max: number) =>
  g <= 0 ? 0 : Math.max(0.02, (Math.log10(g) + 6) / 6) * max;

const sci = (g: number) => {
  if (g === 0) return "0";
  if (g >= 0.01) return g.toFixed(2);
  return g.toExponential(0).replace("e-", "e-");
};

export function ActivationGallery() {
  const [key, setKey] = useState<ActKey>("relu");
  const [x0, setX0] = useState(1);
  const a = activation(key);

  const fPath = useMemo(() => tracePath(a.f), [a]);
  const dPath = useMemo(() => tracePath(a.df), [a]);
  const chain = useMemo(() => chainGradient(key, DEPTH, x0), [key, x0]);
  const survived = chain[DEPTH - 1];

  /* gradient-survival bars */
  const BW = 220;
  const BH = 140;
  const bw = BW / DEPTH;

  return (
    <InstrumentPanel
      label="Activation gallery — the function, its derivative, and what survives"
      readout={`after ${DEPTH} layers: ×${sci(survived)}`}
    >
      <div className="flex flex-wrap items-end justify-center gap-x-8 gap-y-4">
        {/* function + derivative plot */}
        <div>
          <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`} className="block max-w-full">
            <line x1={px(-XR)} y1={py(0)} x2={px(XR)} y2={py(0)} stroke="var(--color-border)" />
            <line x1={px(0)} y1={PAD} x2={px(0)} y2={PH - PAD} stroke="var(--color-border)" />
            {/* input marker */}
            <line
              x1={px(x0)}
              y1={PAD}
              x2={px(x0)}
              y2={PH - PAD}
              stroke="var(--station-dim)"
              strokeWidth={2}
            />
            <path d={dPath} fill="none" stroke={CYAN} strokeWidth={1.5} strokeDasharray="4 3" />
            <path d={fPath} fill="none" stroke="var(--station)" strokeWidth={2} />
            <circle cx={px(x0)} cy={py(a.f(x0))} r={3.5} fill="var(--station)" />
            <circle cx={px(x0)} cy={py(a.df(x0))} r={3} fill="none" stroke={CYAN} />
          </svg>
          <p className="label-tech mt-1 text-center normal-case tracking-normal">
            <span className="text-station">solid</span> = f(z) ·{" "}
            <span style={{ color: CYAN }}>dashed</span> = f′(z)
          </p>
        </div>

        {/* gradient survival through depth */}
        <div>
          <svg width={BW} height={BH} viewBox={`0 0 ${BW} ${BH}`} className="block max-w-full">
            {chain.map((g, i) => {
              const h = barH(g, BH - 26);
              return (
                <g key={i}>
                  <rect
                    x={i * bw + 3}
                    y={BH - 14 - h}
                    width={bw - 6}
                    height={Math.max(h, 1)}
                    fill={g === 0 ? "var(--color-destructive)" : "var(--station)"}
                    opacity={g === 0 ? 0.55 : 0.4 + 0.6 * (h / (BH - 26))}
                  />
                  <text
                    x={i * bw + bw / 2}
                    y={BH - 3}
                    textAnchor="middle"
                    fill="var(--color-muted-foreground)"
                    style={{ font: "500 8px var(--font-mono)" }}
                  >
                    {i + 1}
                  </text>
                </g>
              );
            })}
          </svg>
          <p className="label-tech mt-1 text-center normal-case tracking-normal">
            gradient left after each layer (log scale)
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
        {ACTIVATIONS.map((act) => (
          <button
            key={act.key}
            className="btn-tech"
            data-active={key === act.key}
            onClick={() => setKey(act.key)}
          >
            {act.name.toLowerCase()}
          </button>
        ))}
        <label className="label-tech ml-3 flex items-center gap-2">
          input z
          <input
            type="range"
            min={-2}
            max={2}
            step={0.1}
            value={x0}
            onChange={(e) => setX0(Number(e.target.value))}
            style={{ accentColor: "var(--station)", width: 120 }}
          />
          <span className="readout">{x0.toFixed(1)}</span>
        </label>
      </div>
      <p className="label-tech mt-3 text-center normal-case tracking-normal">
        {a.note} — drag the input negative on relu to watch every layer die
      </p>
    </InstrumentPanel>
  );
}
