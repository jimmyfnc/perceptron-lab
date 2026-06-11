import { useMemo, useState } from "react";
import { mse, polyEval, polyRidgeFit, rng } from "@/lib/ml";
import { InstrumentPanel } from "@/components/site/InstrumentPanel";

const W = 560;
const H = 280;
const PAD = 18;
const N = 22;

const truth = (x: number) => 0.6 * Math.sin(2.6 * x) + 0.25 * x;

function sample(seed: number) {
  const rand = rng(seed);
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i < N; i++) {
    const x = -1 + 2 * rand();
    xs.push(x);
    ys.push(truth(x) + (rand() - 0.5) * 0.34);
  }
  return { xs, ys };
}

const X = (x: number) => PAD + ((x + 1) / 2) * (W - 2 * PAD);
const Y = (y: number) => H / 2 - y * (H / 2.6);

export function PolyFit() {
  const train = useMemo(() => sample(3), []);
  const test = useMemo(() => sample(8), []);
  const [degree, setDegree] = useState(11);
  const [lamExp, setLamExp] = useState(-8); // λ = 10^lamExp, -8 → ~0
  const lambda = lamExp <= -8 ? 0 : 10 ** lamExp;

  const w = useMemo(
    () => polyRidgeFit(train.xs, train.ys, degree, lambda),
    [train, degree, lambda],
  );
  const trainMse = mse(train.xs, train.ys, w);
  const testMse = mse(test.xs, test.ys, w);

  const curve = (f: (x: number) => number) => {
    const parts: string[] = [];
    for (let i = 0; i <= 160; i++) {
      const x = -1 + (2 * i) / 160;
      const y = Math.max(-1.6, Math.min(1.6, f(x)));
      parts.push(`${i === 0 ? "M" : "L"}${X(x).toFixed(1)},${Y(y).toFixed(1)}`);
    }
    return parts.join(" ");
  };

  return (
    <InstrumentPanel
      label="Polynomial fit — capacity vs restraint"
      readout={`deg ${degree} · λ ${lambda === 0 ? "0" : `1e${lamExp}`} · train ${trainMse.toFixed(3)} · test ${testMse.toFixed(3)}`}
    >
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="mx-auto block max-w-full">
        <path
          d={curve(truth)}
          fill="none"
          stroke="var(--color-muted-foreground)"
          strokeWidth={1}
          strokeDasharray="4 4"
          opacity={0.6}
        />
        <path
          d={curve((x) => polyEval(w, x))}
          fill="none"
          stroke="var(--station)"
          strokeWidth={2}
        />
        {test.xs.map((x, i) => (
          <circle
            key={`t${i}`}
            cx={X(x)}
            cy={Y(test.ys[i])}
            r={3}
            fill="none"
            stroke="oklch(0.8 0.13 75)"
            strokeWidth={1.5}
          />
        ))}
        {train.xs.map((x, i) => (
          <circle key={`p${i}`} cx={X(x)} cy={Y(train.ys[i])} r={3.5} fill="oklch(0.78 0.14 195)" />
        ))}
      </svg>
      <div className="mx-auto mt-3 grid max-w-md grid-cols-2 gap-6">
        <label className="label-tech block">
          degree — model capacity
          <input
            type="range"
            min={1}
            max={15}
            step={1}
            value={degree}
            onChange={(e) => setDegree(Number(e.target.value))}
            className="mt-2 block w-full"
            style={{ accentColor: "var(--station)" }}
          />
        </label>
        <label className="label-tech block">
          λ — ridge penalty (L2)
          <input
            type="range"
            min={-8}
            max={1}
            step={0.5}
            value={lamExp}
            onChange={(e) => setLamExp(Number(e.target.value))}
            className="mt-2 block w-full"
            style={{ accentColor: "var(--station)" }}
          />
        </label>
      </div>
      <p className="label-tech mt-3 text-center normal-case tracking-normal">
        <span className="text-[oklch(0.78_0.14_195)]">filled</span> = train ·{" "}
        <span className="text-[oklch(0.8_0.13_75)]">hollow</span> = test · dashed = the true
        function it never sees
      </p>
    </InstrumentPanel>
  );
}
