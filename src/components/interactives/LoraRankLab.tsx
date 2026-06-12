/**
 * The LoRA idea made visible: a 16×16 "weight update" rebuilt from its
 * top-r singular directions (ΔW ≈ A·B). The matrix is station 03's bolt
 * sprite, so structure — and how little rank it needs — is obvious.
 */
import { useMemo, useState } from "react";
import { SPRITES } from "@/lib/conv";
import { frob, lowRank, svd } from "@/lib/svd";
import { InstrumentPanel } from "@/components/site/InstrumentPanel";

const N = 16;
const CELL = 13;
const CYAN = "oklch(0.78 0.14 205)";

function Heatmap({ M, label }: { M: number[][]; label: string }) {
  return (
    <div>
      <svg width={N * CELL} height={N * CELL} className="block border border-border">
        {M.map((row, i) =>
          row.map((v, j) => (
            <rect
              key={`${i}-${j}`}
              x={j * CELL}
              y={i * CELL}
              width={CELL - 1}
              height={CELL - 1}
              fill={v >= 0 ? "var(--station)" : CYAN}
              opacity={Math.min(1, Math.abs(v)) * 0.92 + 0.04}
            />
          )),
        )}
      </svg>
      <p className="label-tech mt-1.5 text-center normal-case tracking-normal">{label}</p>
    </div>
  );
}

export function LoraRankLab() {
  const [rank, setRank] = useState(3);
  const W = useMemo(() => SPRITES.find((s) => s.key === "bolt")!.grid.map((r) => [...r]), []);
  const dec = useMemo(() => svd(W), [W]);
  const approx = useMemo(() => lowRank(dec, rank), [dec, rank]);

  // ‖W‖ is constant — singular values already carry it: ‖W‖² = Σ sᵢ²
  const wNorm = useMemo(() => Math.hypot(...dec.S), [dec]);
  const fullParams = N * N;
  const loraParams = rank * (N + N);
  const err = frob(approx, W) / Math.max(wNorm, 1e-9);

  /* singular value bars */
  const BW = 170;
  const BH = 110;
  const sMax = dec.S[0] || 1;

  return (
    <InstrumentPanel
      label="LoRA rank lab — ΔW rebuilt from r directions"
      readout={`rank ${rank} · ${loraParams} params vs ${fullParams} · err ${(err * 100).toFixed(0)}%`}
    >
      <div className="flex flex-wrap items-end justify-center gap-x-7 gap-y-4">
        <Heatmap M={W} label="full ΔW (16×16 = 256 numbers)" />
        <Heatmap M={approx} label={`rank ${rank}: A(16×${rank}) · B(${rank}×16) = ${loraParams}`} />
        <div>
          <svg width={BW} height={BH} viewBox={`0 0 ${BW} ${BH}`} className="block">
            {dec.S.map((s, i) => (
              <rect
                key={i}
                x={(i * BW) / N + 1}
                y={BH - 14 - (s / sMax) * (BH - 18)}
                width={BW / N - 2}
                height={Math.max(1, (s / sMax) * (BH - 18))}
                fill={i < rank ? "var(--station)" : "var(--color-secondary)"}
                stroke={i < rank ? undefined : "var(--color-border)"}
              />
            ))}
            <text
              x={BW / 2}
              y={BH - 2}
              textAnchor="middle"
              fill="var(--color-muted-foreground)"
              style={{ font: "500 8px var(--font-mono)" }}
            >
              singular values, kept vs dropped
            </text>
          </svg>
          <label className="label-tech mt-3 flex items-center gap-2">
            rank r
            <input
              type="range"
              min={1}
              max={N}
              value={rank}
              onChange={(e) => setRank(Number(e.target.value))}
              style={{ accentColor: "var(--station)", width: 110 }}
            />
            <span className="readout w-5">{rank}</span>
          </label>
        </div>
      </div>
      <p className="label-tech mt-3 text-center normal-case tracking-normal">
        most of the bolt survives at rank 3 — structured changes are low-rank, which is the entire
        bet a lora makes about fine-tuning
      </p>
    </InstrumentPanel>
  );
}
