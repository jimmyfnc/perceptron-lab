/**
 * Signature interactive for the Transformers station: real GPT-2 attention
 * over curated sentences. Pick a sentence, pick a head (or let the finders
 * locate a specialist), hover a token to see where it looks.
 * Weights ship as static JSON extracted by scripts/extract_attention.py.
 */
import { useEffect, useMemo, useState } from "react";
import {
  expandTri,
  findHead,
  firstTokenScore,
  prevTokenScore,
  sharpnessScore,
  type AttnData,
  type AttnSentence,
} from "@/lib/attention";
import { InstrumentPanel } from "@/components/site/InstrumentPanel";

/* module-level cache so route revisits don't refetch 491 KB */
let cached: AttnData | null = null;

function useAttnData(): AttnData | null {
  const [data, setData] = useState<AttnData | null>(cached);
  useEffect(() => {
    if (cached) return;
    let live = true;
    fetch("/data/attention.json")
      .then((r) => r.json())
      .then((d: AttnData) => {
        cached = d;
        if (live) setData(d);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  return data;
}

/* ---- token strip geometry (computed, not measured — mono font) ---- */
const CHAR_W = 8.1;
const PAD_X = 7;
const GAP = 7;
const JOIN_GAP = 1.5;
const CHIP_H = 26;
const ARC_H = 132;
const STRIP_H = ARC_H + CHIP_H + 26;

interface Chip {
  x: number;
  w: number;
  cx: number;
}

function layoutChips(s: AttnSentence): { chips: Chip[]; width: number } {
  const chips: Chip[] = [];
  let x = 2;
  s.tokens.forEach((t, i) => {
    if (i > 0) x += s.starts[i] ? GAP : JOIN_GAP;
    const w = Math.max(2, t.length) * CHAR_W + PAD_X * 2;
    chips.push({ x, w, cx: x + w / 2 });
    x += w;
  });
  return { chips, width: x + 2 };
}

const FINDERS = [
  { key: "prev", name: "previous-token head", score: prevTokenScore },
  { key: "sink", name: "attention sink", score: firstTokenScore },
  { key: "sharp", name: "sharpest head", score: sharpnessScore },
];

export function AttentionLens() {
  const data = useAttnData();
  const [sentId, setSentId] = useState("trophy");
  const [layer, setLayer] = useState(5);
  const [head, setHead] = useState(1);
  const [sel, setSel] = useState<number | null>(null);

  const sent = data?.sentences.find((s) => s.id === sentId) ?? null;
  const matrix = useMemo(
    () => (sent ? expandTri(sent.attn[layer][head]) : null),
    [sent, layer, head],
  );
  const { chips, width } = useMemo(
    () => (sent ? layoutChips(sent) : { chips: [], width: 10 }),
    [sent],
  );

  if (!data || !sent || !matrix) {
    return (
      <InstrumentPanel label="The attention lens — real GPT-2 weights" readout="loading…">
        <div className="flex h-[320px] items-center justify-center">
          <p className="label-tech">
            <span className="led led-pulse mr-2 inline-block align-middle" />
            loading 144 attention heads…
          </p>
        </div>
      </InstrumentPanel>
    );
  }

  const n = sent.tokens.length;
  const q = sel ?? n - 1; // default query: the last token
  const row = matrix[q];

  const top = row
    .map((w, j) => ({ w, j }))
    .filter((e) => e.j !== q && e.w > 0.01)
    .sort((a, b) => b.w - a.w)
    .slice(0, 3);

  /* ---- heatmap geometry ---- */
  const CELL = Math.min(17, 240 / n);
  const HM = CELL * n;

  return (
    <InstrumentPanel
      label="The attention lens — real GPT-2 weights"
      live
      readout={`layer ${layer} · head ${head} · gpt-2 small`}
    >
      <div className="flex flex-wrap items-start justify-center gap-x-8 gap-y-4">
        {/* arc diagram + token strip */}
        <div className="min-w-0 max-w-full">
          <svg
            viewBox={`0 0 ${width} ${STRIP_H}`}
            style={{ width: Math.min(width, 660) }}
            className="block max-w-full"
          >
            {/* arcs from the query token to everything it attends to */}
            {row.map((w, j) => {
              if (j === q || w < 0.015) return null;
              const x1 = chips[q].cx;
              const x2 = chips[j].cx;
              const lift = Math.min(ARC_H - 8, 26 + Math.abs(x1 - x2) * 0.32);
              return (
                <path
                  key={j}
                  d={`M${x1},${ARC_H} C${x1},${ARC_H - lift} ${x2},${ARC_H - lift} ${x2},${ARC_H}`}
                  fill="none"
                  stroke="var(--station)"
                  strokeWidth={1 + 5 * w}
                  opacity={Math.min(1, 0.18 + w)}
                />
              );
            })}
            {/* self-attention shown as a dot above the query chip */}
            <circle
              cx={chips[q].cx}
              cy={ARC_H - 9}
              r={3 + 5 * row[q]}
              fill="var(--station)"
              opacity={Math.min(1, 0.25 + row[q])}
            />

            {/* token chips */}
            {sent.tokens.map((t, i) => {
              const c = chips[i];
              const isQ = i === q;
              const w = row[i];
              return (
                <g
                  key={i}
                  onPointerEnter={() => setSel(i)}
                  onClick={() => setSel(i)}
                  className="cursor-pointer"
                >
                  <rect
                    x={c.x}
                    y={ARC_H}
                    width={c.w}
                    height={CHIP_H}
                    rx={2}
                    fill={isQ ? "var(--station-faint)" : "var(--color-secondary)"}
                    stroke={isQ ? "var(--station)" : "var(--color-border)"}
                    strokeDasharray={sent.starts[i] ? undefined : "2 2"}
                  />
                  {/* received-attention underline */}
                  {!isQ && w > 0.015 && (
                    <rect
                      x={c.x}
                      y={ARC_H + CHIP_H + 3}
                      width={c.w * Math.min(1, w * 1.6)}
                      height={3}
                      fill="var(--station)"
                      opacity={0.85}
                    />
                  )}
                  <text
                    x={c.cx}
                    y={ARC_H + CHIP_H / 2 + 4}
                    textAnchor="middle"
                    fill={isQ ? "var(--station)" : "var(--color-foreground)"}
                    style={{ font: `500 12.5px var(--font-mono)` }}
                  >
                    {t}
                  </text>
                </g>
              );
            })}
          </svg>
          <p className="readout mt-2 min-h-5 text-center text-[11px] text-muted-foreground">
            &ldquo;{sent.tokens[q]}&rdquo; attends to{" "}
            {top.length
              ? top.map((e, i) => (
                  <span key={e.j}>
                    {i > 0 && " · "}
                    <span className="text-station">{sent.tokens[e.j]}</span> {e.w.toFixed(2)}
                  </span>
                ))
              : "itself, mostly"}
            {row[q] > 0.3 && <span> · itself {row[q].toFixed(2)}</span>}
          </p>
        </div>

        {/* full T×T matrix for this head — the causal triangle */}
        <div>
          <svg width={HM} height={HM} viewBox={`0 0 ${HM} ${HM}`} className="block">
            {matrix.map((r, i) =>
              r.map((w, j) =>
                j > i ? null : (
                  <rect
                    key={`${i}-${j}`}
                    x={j * CELL}
                    y={i * CELL}
                    width={CELL - 1}
                    height={CELL - 1}
                    fill={i === q ? "var(--station)" : "var(--color-foreground)"}
                    opacity={i === q ? Math.min(1, 0.12 + w) : 0.04 + w * 0.75}
                    onPointerEnter={() => setSel(i)}
                  />
                ),
              ),
            )}
          </svg>
          <p className="label-tech mt-2 text-center normal-case tracking-normal">
            queries ↓ · keys → · the empty
            <br />
            triangle is the causal mask
          </p>
        </div>
      </div>

      {/* controls */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
        {data.sentences.map((s) => (
          <button
            key={s.id}
            className="btn-tech"
            data-active={sentId === s.id}
            onClick={() => {
              setSentId(s.id);
              setSel(null);
            }}
            title={s.label}
          >
            {s.id}
          </button>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        <label className="label-tech flex items-center gap-2">
          layer
          <input
            type="range"
            min={0}
            max={data.layers - 1}
            value={layer}
            onChange={(e) => setLayer(Number(e.target.value))}
            style={{ accentColor: "var(--station)", width: 110 }}
          />
          <span className="readout w-4">{layer}</span>
        </label>
        <label className="label-tech flex items-center gap-2">
          head
          <input
            type="range"
            min={0}
            max={data.heads - 1}
            value={head}
            onChange={(e) => setHead(Number(e.target.value))}
            style={{ accentColor: "var(--station)", width: 110 }}
          />
          <span className="readout w-4">{head}</span>
        </label>
        {FINDERS.map((f) => (
          <button
            key={f.key}
            className="btn-tech"
            onClick={() => {
              const ref = findHead(sent, f.score);
              setLayer(ref.layer);
              setHead(ref.head);
            }}
          >
            find: {f.name}
          </button>
        ))}
      </div>
      <p className="label-tech mt-3 text-center normal-case tracking-normal">
        {sent.label} — hover a token to ask &ldquo;where does it look?&rdquo; · dashed chips are BPE
        subwords glued to the token before them
      </p>
    </InstrumentPanel>
  );
}
