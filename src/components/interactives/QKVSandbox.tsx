/**
 * Toy scaled-dot-product attention in 2D: drag one query, three keys, and
 * three values; the softmax weights and the output vector update live.
 * All the math is src/lib/attention.ts — this file is only handles + SVG.
 */
import { useRef, useState } from "react";
import { attend, dot, type Vec2 } from "@/lib/attention";
import { InstrumentPanel } from "@/components/site/InstrumentPanel";

const S = 330; // svg css px
const R = 1.25; // coordinate range [-R, R]

const CYAN = "oklch(0.78 0.14 205)"; // keys
const AMBER = "oklch(0.8 0.13 75)"; // values

const px = (v: number) => ((v + R) / (2 * R)) * S;
const un = (p: number) => (p / S) * 2 * R - R;
const clamp = (v: number) => Math.max(-R + 0.05, Math.min(R - 0.05, v));

type Handle = { kind: "q" | "k" | "v"; idx: number } | null;

function Arrow({ v, color, width = 2 }: { v: Vec2; color: string; width?: number }) {
  const tipX = px(v.x);
  const tipY = px(-v.y);
  const ang = Math.atan2(px(0) - tipY, tipX - px(0));
  const a1 = ang + 2.6;
  const a2 = ang - 2.6;
  return (
    <g>
      <line x1={px(0)} y1={px(0)} x2={tipX} y2={tipY} stroke={color} strokeWidth={width} />
      <path
        d={`M${tipX},${tipY} L${tipX + Math.cos(a1) * 9},${tipY - Math.sin(a1) * 9} L${tipX + Math.cos(a2) * 9},${tipY - Math.sin(a2) * 9} Z`}
        fill={color}
      />
    </g>
  );
}

export function QKVSandbox() {
  const [q, setQ] = useState<Vec2>({ x: 0.85, y: 0.55 });
  const [keys, setKeys] = useState<Vec2[]>([
    { x: 1.0, y: 0.25 },
    { x: -0.4, y: 0.95 },
    { x: -0.75, y: -0.7 },
  ]);
  const [values, setValues] = useState<Vec2[]>([
    { x: 0.55, y: -0.85 },
    { x: 0.9, y: 0.9 },
    { x: -1.0, y: 0.15 },
  ]);
  const [scale, setScale] = useState(Math.SQRT2);
  const drag = useRef<Handle>(null);

  const { weights, output } = attend(q, keys, values, scale);

  const move = (e: React.PointerEvent<SVGSVGElement>) => {
    const h = drag.current;
    if (!h) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = clamp(un(((e.clientX - rect.left) / rect.width) * S));
    const y = clamp(-un(((e.clientY - rect.top) / rect.height) * S));
    if (h.kind === "q") setQ({ x, y });
    if (h.kind === "k") setKeys((ks) => ks.map((k, i) => (i === h.idx ? { x, y } : k)));
    if (h.kind === "v") setValues((vs) => vs.map((v, i) => (i === h.idx ? { x, y } : v)));
  };

  const grab = (kind: "q" | "k" | "v", idx: number) => (e: React.PointerEvent) => {
    drag.current = { kind, idx };
    (e.currentTarget.closest("svg") as SVGSVGElement).setPointerCapture(e.pointerId);
  };

  return (
    <InstrumentPanel
      label="Q·K·V sandbox — attention with three tokens"
      readout={`weights ${weights.map((w) => w.toFixed(2)).join(" / ")}`}
    >
      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
        <svg
          width={S}
          height={S}
          viewBox={`0 0 ${S} ${S}`}
          className="block h-auto max-w-full touch-none select-none border border-border bg-background/40"
          onPointerMove={move}
          onPointerUp={() => (drag.current = null)}
          onPointerCancel={() => (drag.current = null)}
        >
          {/* axes */}
          <line x1={0} y1={px(0)} x2={S} y2={px(0)} stroke="var(--color-border)" />
          <line x1={px(0)} y1={0} x2={px(0)} y2={S} stroke="var(--color-border)" />

          {/* keys + their values, tinted by current weight */}
          {keys.map((k, i) => (
            <g key={i}>
              <Arrow v={k} color={CYAN} width={1.5 + 3.5 * weights[i]} />
              <line
                x1={px(k.x)}
                y1={px(-k.y)}
                x2={px(values[i].x)}
                y2={px(-values[i].y)}
                stroke="var(--color-border)"
                strokeDasharray="3 4"
              />
              <circle
                cx={px(k.x)}
                cy={px(-k.y)}
                r={11}
                fill="transparent"
                className="cursor-grab"
                onPointerDown={grab("k", i)}
              />
              <text
                x={px(k.x) + (k.x >= 0 ? 10 : -10)}
                y={px(-k.y) - 8}
                textAnchor={k.x >= 0 ? "start" : "end"}
                fill={CYAN}
                style={{ font: "500 11px var(--font-mono)" }}
              >
                k{i + 1}
              </text>
              <rect
                x={px(values[i].x) - 5}
                y={px(-values[i].y) - 5}
                width={10}
                height={10}
                transform={`rotate(45 ${px(values[i].x)} ${px(-values[i].y)})`}
                fill={AMBER}
                opacity={0.35 + 0.65 * weights[i]}
                className="cursor-grab"
                onPointerDown={grab("v", i)}
              />
              <text
                x={px(values[i].x) + 10}
                y={px(-values[i].y) + 4}
                fill={AMBER}
                style={{ font: "500 11px var(--font-mono)" }}
              >
                v{i + 1}
              </text>
            </g>
          ))}

          {/* output = weighted mix of values */}
          <circle
            cx={px(output.x)}
            cy={px(-output.y)}
            r={7}
            fill="none"
            stroke="var(--color-foreground)"
            strokeWidth={2}
          />
          <text
            x={px(output.x) + 11}
            y={px(-output.y) + 4}
            fill="var(--color-foreground)"
            style={{ font: "500 11px var(--font-mono)" }}
          >
            out
          </text>

          {/* the query on top so it stays grabbable */}
          <Arrow v={q} color="var(--station)" width={2.5} />
          <circle
            cx={px(q.x)}
            cy={px(-q.y)}
            r={12}
            fill="transparent"
            className="cursor-grab"
            onPointerDown={grab("q", 0)}
          />
          <text
            x={px(q.x) + (q.x >= 0 ? 12 : -12)}
            y={px(-q.y) + 4}
            textAnchor={q.x >= 0 ? "start" : "end"}
            fill="var(--station)"
            style={{ font: "600 12px var(--font-mono)" }}
          >
            q
          </text>
        </svg>

        {/* scores → weights table + bars */}
        <div className="w-[250px] max-w-full">
          <p className="label-tech mb-2">softmax(q·k / scale)</p>
          {keys.map((k, i) => (
            <div key={i} className="mb-2">
              <div className="readout flex justify-between text-[11px] text-muted-foreground">
                <span style={{ color: CYAN }}>k{i + 1}</span>
                <span>q·k = {dot(q, k).toFixed(2)}</span>
                <span className="text-station">w = {weights[i].toFixed(2)}</span>
              </div>
              <div className="mt-1 h-2 border border-border">
                <div
                  className="h-full"
                  style={{ width: `${weights[i] * 100}%`, backgroundColor: "var(--station)" }}
                />
              </div>
            </div>
          ))}
          <label className="label-tech mt-4 flex items-center gap-2">
            scale
            <input
              type="range"
              min={0.4}
              max={8}
              step={0.1}
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              style={{ accentColor: "var(--station)", width: 110 }}
            />
            <span className="readout">{scale.toFixed(1)}</span>
          </label>
          <p className="label-tech mt-2 normal-case tracking-normal">
            √d = 1.4 here — small scale sharpens toward one-hot, large scale flattens toward average
          </p>
        </div>
      </div>
      <p className="label-tech mt-3 text-center normal-case tracking-normal">
        drag q, the keys, or the diamond values — out is the weighted mix Σ wᵢvᵢ the next layer
        receives
      </p>
    </InstrumentPanel>
  );
}
