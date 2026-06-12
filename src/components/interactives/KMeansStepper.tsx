import { useMemo, useState } from "react";
import { assignClusters, inertia, rng, updateCentroids, type XY } from "@/lib/ml";
import { InstrumentPanel } from "@/components/site/InstrumentPanel";

const W = 460;
const H = 280;
const K = 3;
const HUES = [195, 305, 75];
const color = (i: number, a = 1) => `oklch(0.76 0.14 ${HUES[i]} / ${a})`;

function makePoints(seed: number): XY[] {
  const rand = rng(seed);
  const centers = [
    { x: 0.22, y: 0.3 },
    { x: 0.55, y: 0.75 },
    { x: 0.8, y: 0.28 },
  ];
  const pts: XY[] = [];
  for (let i = 0; i < 66; i++) {
    const c = centers[i % 3];
    const u = rand() * 2 * Math.PI;
    const r = rand() * 0.13;
    pts.push({ x: c.x + Math.cos(u) * r, y: c.y + Math.sin(u) * r * 0.9 });
  }
  return pts;
}

function randomCentroids(seed: number): XY[] {
  const rand = rng(seed);
  return Array.from({ length: K }, () => ({ x: 0.15 + rand() * 0.7, y: 0.15 + rand() * 0.7 }));
}

export function KMeansStepper() {
  const [seed, setSeed] = useState(5);
  const points = useMemo(() => makePoints(2), []);
  const [trail, setTrail] = useState<XY[][]>(() => [randomCentroids(5)]);
  const [phase, setPhase] = useState<"assign" | "update">("assign");
  const [assign, setAssign] = useState<number[] | null>(null);

  const centroids = trail[trail.length - 1];
  const score = assign ? inertia(points, assign, centroids) : null;

  const step = () => {
    if (phase === "assign") {
      setAssign(assignClusters(points, centroids));
      setPhase("update");
    } else if (assign) {
      setTrail((t) => [...t, updateCentroids(points, assign, centroids)]);
      setPhase("assign");
    }
  };

  const reset = () => {
    const s = seed + 1;
    setSeed(s);
    setTrail([randomCentroids(s)]);
    setAssign(null);
    setPhase("assign");
  };

  return (
    <InstrumentPanel
      label="k-means — assign, average, repeat"
      readout={score != null ? `inertia ${score.toFixed(3)}` : `iteration 0`}
    >
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        className="mx-auto block h-auto max-w-full"
      >
        {/* assignment links while updating */}
        {assign &&
          points.map((p, i) => (
            <line
              key={`l${i}`}
              x1={p.x * W}
              y1={p.y * H}
              x2={centroids[assign[i]].x * W}
              y2={centroids[assign[i]].y * H}
              stroke={color(assign[i], 0.12)}
            />
          ))}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x * W}
            cy={p.y * H}
            r={4}
            fill={assign ? color(assign[i]) : "oklch(0.5 0.01 265)"}
            style={{ transition: "fill 200ms ease" }}
          />
        ))}
        {/* centroid trails */}
        {Array.from({ length: K }, (_, i) => (
          <polyline
            key={`t${i}`}
            points={trail.map((c) => `${c[i].x * W},${c[i].y * H}`).join(" ")}
            fill="none"
            stroke={color(i, 0.45)}
            strokeWidth={1.5}
            strokeDasharray="3 3"
          />
        ))}
        {centroids.map((c, i) => (
          <g
            key={`c${i}`}
            style={{ transition: "transform 350ms ease" }}
            transform={`translate(${c.x * W}, ${c.y * H})`}
          >
            <rect
              x={-6}
              y={-6}
              width={12}
              height={12}
              transform="rotate(45)"
              fill={color(i)}
              stroke="oklch(0.14 0.008 265)"
              strokeWidth={1.5}
            />
          </g>
        ))}
      </svg>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
        <button className="btn-tech" data-active={true} onClick={step}>
          {phase === "assign"
            ? "assign points to nearest centroid"
            : "move centroids to their means"}
        </button>
        <button className="btn-tech" onClick={reset}>
          reshuffle centroids
        </button>
        <span className="readout ml-2 text-[11px] text-muted-foreground">
          iter {trail.length - 1}
        </span>
      </div>
    </InstrumentPanel>
  );
}
