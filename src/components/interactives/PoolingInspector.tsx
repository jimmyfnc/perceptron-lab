import { useMemo, useState } from "react";
import { SPRITES, convolve, KERNELS, relu, type Grid } from "@/lib/conv";
import { InstrumentPanel } from "@/components/site/InstrumentPanel";

/**
 * Hover a pooled cell to see exactly which 2×2 window it came from, and
 * compare what max vs average pooling keeps.
 */
const N = 8;

function sourceValues(): Grid {
  // a real feature map: bolt sprite through sobel-x, relu'd, top-left 8×8
  const fm = relu(convolve(SPRITES[0].grid, KERNELS[1].k));
  return Array.from({ length: N }, (_, y) =>
    Array.from({ length: N }, (_, x) => Math.round(fm[y + 3][x + 2] * 10) / 10),
  );
}

export function PoolingInspector() {
  const src = useMemo(sourceValues, []);
  const [mode, setMode] = useState<"max" | "avg">("max");
  const [hover, setHover] = useState<{ y: number; x: number } | null>(null);

  const pooled = useMemo(() => {
    const out: Grid = [];
    for (let y = 0; y < N / 2; y++) {
      const row: number[] = [];
      for (let x = 0; x < N / 2; x++) {
        const w = [
          src[2 * y][2 * x],
          src[2 * y][2 * x + 1],
          src[2 * y + 1][2 * x],
          src[2 * y + 1][2 * x + 1],
        ];
        row.push(
          mode === "max"
            ? Math.max(...w)
            : Math.round((w.reduce((a, b) => a + b, 0) / 4) * 10) / 10,
        );
      }
      out.push(row);
    }
    return out;
  }, [src, mode]);

  const maxV = useMemo(() => Math.max(...src.flat(), 0.1), [src]);
  const cellBg = (v: number) =>
    v <= 0
      ? "var(--color-secondary)"
      : `oklch(${0.22 + 0.4 * (v / maxV)} ${0.03 + 0.12 * (v / maxV)} 305)`;

  const inWindow = (y: number, x: number) =>
    hover != null && Math.floor(y / 2) === hover.y && Math.floor(x / 2) === hover.x;
  const isWinner = (y: number, x: number) => {
    if (!inWindow(y, x) || mode !== "max") return false;
    const w = [
      src[2 * hover!.y][2 * hover!.x],
      src[2 * hover!.y][2 * hover!.x + 1],
      src[2 * hover!.y + 1][2 * hover!.x],
      src[2 * hover!.y + 1][2 * hover!.x + 1],
    ];
    return src[y][x] === Math.max(...w);
  };

  return (
    <InstrumentPanel
      label="Pooling — what survives downsampling"
      readout={`${N}×${N} → ${N / 2}×${N / 2}`}
    >
      <div className="flex flex-wrap items-center justify-center gap-6">
        <div
          className="grid w-fit gap-px"
          style={{ gridTemplateColumns: `repeat(${N}, 2.1rem)` }}
          onPointerLeave={() => setHover(null)}
        >
          {src.map((row, y) =>
            row.map((v, x) => (
              <div
                key={`${y}${x}`}
                onPointerEnter={() => setHover({ y: Math.floor(y / 2), x: Math.floor(x / 2) })}
                className="readout flex h-8 items-center justify-center text-[10px] transition-all"
                style={{
                  background: cellBg(v),
                  outline: isWinner(y, x)
                    ? "2px solid var(--station)"
                    : inWindow(y, x)
                      ? "1px solid var(--station-dim)"
                      : "1px solid transparent",
                  outlineOffset: "-1px",
                  opacity: hover == null || inWindow(y, x) ? 1 : 0.35,
                  color: v <= 0 ? "var(--color-muted-foreground)" : "var(--color-foreground)",
                }}
              >
                {v}
              </div>
            )),
          )}
        </div>
        <span aria-hidden className="readout text-xl text-muted-foreground">
          -&gt;
        </span>
        <div
          className="grid w-fit gap-px"
          style={{ gridTemplateColumns: `repeat(${N / 2}, 2.6rem)` }}
        >
          {pooled.map((row, y) =>
            row.map((v, x) => (
              <div
                key={`${y}${x}`}
                onPointerEnter={() => setHover({ y, x })}
                onPointerLeave={() => setHover(null)}
                className="readout flex h-10 cursor-crosshair items-center justify-center text-[11px] transition-all"
                style={{
                  background: cellBg(v),
                  outline:
                    hover?.y === y && hover?.x === x
                      ? "2px solid var(--station)"
                      : "1px solid transparent",
                  outlineOffset: "-1px",
                }}
              >
                {v}
              </div>
            )),
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <button className="btn-tech" data-active={mode === "max"} onClick={() => setMode("max")}>
            max pool
          </button>
          <button className="btn-tech" data-active={mode === "avg"} onClick={() => setMode("avg")}>
            avg pool
          </button>
          <p className="label-tech mt-2 max-w-[10rem] normal-case tracking-normal">
            hover a pooled cell to trace its 2×2 source window
          </p>
        </div>
      </div>
    </InstrumentPanel>
  );
}
