import { useState } from "react";
import { InstrumentPanel } from "@/components/site/InstrumentPanel";

/**
 * Stack two 3×3 convolutions and hover any deep cell: its receptive
 * field grows from 3×3 to 5×5 in the original input. Depth = context.
 */
const L0 = 12; // input
const L1 = 10; // after conv 1 (valid)
const L2 = 8; // after conv 2 (valid)
const CELL = 18;
const GAP = 56;

type RC = { y: number; x: number } | null;

function GridSvg({
  side,
  offsetX,
  hi,
  hiSize,
  active,
  onHover,
  label,
}: {
  side: number;
  offsetX: number;
  hi: RC;
  hiSize: number;
  active?: RC;
  onHover?: (c: RC) => void;
  label: string;
}) {
  const px = side * CELL;
  return (
    <g transform={`translate(${offsetX}, ${(12 * CELL - px) / 2})`}>
      {Array.from({ length: side }, (_, y) =>
        Array.from({ length: side }, (_, x) => {
          const inHi =
            hi != null && y >= hi.y && y < hi.y + hiSize && x >= hi.x && x < hi.x + hiSize;
          const isActive = active != null && active.y === y && active.x === x;
          return (
            <rect
              key={`${y}${x}`}
              x={x * CELL + 1}
              y={y * CELL + 1}
              width={CELL - 2}
              height={CELL - 2}
              fill={
                isActive ? "var(--station)" : inHi ? "var(--station-dim)" : "var(--color-secondary)"
              }
              style={{ transition: "fill 120ms ease", cursor: onHover ? "crosshair" : "default" }}
              onPointerEnter={onHover ? () => onHover({ y, x }) : undefined}
            />
          );
        }),
      )}
      <text
        x={px / 2}
        y={px + 22}
        textAnchor="middle"
        fill="var(--color-muted-foreground)"
        style={{ font: "500 10px var(--font-mono)", letterSpacing: "0.15em" }}
      >
        {label}
      </text>
    </g>
  );
}

export function ReceptiveFieldTracer() {
  const [cell, setCell] = useState<RC>({ y: 3, x: 4 });
  // an L2 cell at (y,x) sees L1[y..y+2, x..x+2], which sees input[y..y+4, x..x+4]
  const width = L0 * CELL + GAP + L1 * CELL + GAP + L2 * CELL;
  const height = L0 * CELL + 32;

  return (
    <InstrumentPanel
      label="Receptive field — why depth means context"
      readout={cell ? `deep cell (${cell.y},${cell.x}) sees 5×5` : "hover layer 2"}
    >
      <div className="overflow-x-auto">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          onPointerLeave={() => setCell({ y: 3, x: 4 })}
          className="mx-auto block"
        >
          {/* connection wedges */}
          {cell && (
            <>
              <polygon
                points={`
                  ${cell.x * CELL},${(12 * CELL - L0 * CELL) / 2 + cell.y * CELL}
                  ${cell.x * CELL},${(12 * CELL - L0 * CELL) / 2 + (cell.y + 5) * CELL}
                  ${L0 * CELL + GAP + cell.x * CELL},${(12 * CELL - L1 * CELL) / 2 + (cell.y + 3) * CELL}
                  ${L0 * CELL + GAP + cell.x * CELL},${(12 * CELL - L1 * CELL) / 2 + cell.y * CELL}
                `}
                fill="var(--station-faint)"
              />
              <polygon
                points={`
                  ${L0 * CELL + GAP + (cell.x + 3) * CELL},${(12 * CELL - L1 * CELL) / 2 + cell.y * CELL}
                  ${L0 * CELL + GAP + (cell.x + 3) * CELL},${(12 * CELL - L1 * CELL) / 2 + (cell.y + 3) * CELL}
                  ${L0 * CELL + GAP + L1 * CELL + GAP + cell.x * CELL},${(12 * CELL - L2 * CELL) / 2 + (cell.y + 1) * CELL}
                  ${L0 * CELL + GAP + L1 * CELL + GAP + cell.x * CELL},${(12 * CELL - L2 * CELL) / 2 + cell.y * CELL}
                `}
                fill="var(--station-faint)"
              />
            </>
          )}
          <GridSvg side={L0} offsetX={0} hi={cell} hiSize={5} label={`INPUT ${L0}×${L0}`} />
          <GridSvg
            side={L1}
            offsetX={L0 * CELL + GAP}
            hi={cell}
            hiSize={3}
            label={`CONV 3×3 → ${L1}×${L1}`}
          />
          <GridSvg
            side={L2}
            offsetX={L0 * CELL + GAP + L1 * CELL + GAP}
            hi={null}
            hiSize={0}
            active={cell}
            onHover={(c) => c && setCell(c)}
            label={`CONV 3×3 → ${L2}×${L2}`}
          />
        </svg>
      </div>
      <p className="label-tech mt-2 text-center normal-case tracking-normal">
        hover any cell in the deepest layer — two stacked 3×3 kernels give it a 5×5 view of the
        input
      </p>
    </InstrumentPanel>
  );
}
