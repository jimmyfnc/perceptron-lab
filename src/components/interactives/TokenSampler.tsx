/**
 * Token Sampler (Feedback Bench): real GPT-2 next-token logits (top 200,
 * extracted by scripts/extract_logits.py), reshaped live by temperature /
 * top-k / top-p. Click sample to actually draw from the distribution —
 * the words came from the real model; the randomness is yours.
 */
import { useEffect, useState } from "react";
import { entropy, reshape, sampleIndex } from "@/lib/sampling";
import { InstrumentPanel } from "@/components/site/InstrumentPanel";

interface LogitPrompt {
  id: string;
  text: string;
  tokens: string[];
  logits: number[];
}
interface LogitData {
  model: string;
  prompts: LogitPrompt[];
}

let cached: LogitData | null = null;

function useLogitData() {
  const [data, setData] = useState<LogitData | null>(cached);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (cached) return;
    let live = true;
    fetch("/data/logits.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: LogitData) => {
        cached = d;
        if (live) setData(d);
      })
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [attempt]);
  return { data, failed, retry: () => (setFailed(false), setAttempt((n) => n + 1)) };
}

const SHOW = 14;
const display = (t: string) => (t.startsWith(" ") ? "␣" + t.slice(1) : t);

export function TokenSampler() {
  const { data, failed, retry } = useLogitData();
  const [promptIdx, setPromptIdx] = useState(0);
  const [temperature, setTemperature] = useState(1);
  const [topK, setTopK] = useState(0);
  const [topP, setTopP] = useState(1);
  const [samples, setSamples] = useState<string[]>([]);
  const [flash, setFlash] = useState<number | null>(null);

  if (failed) {
    return (
      <InstrumentPanel label="token sampler — signal lost">
        <div className="flex items-center justify-center gap-4 py-10">
          <p className="label-tech">couldn&rsquo;t load the GPT-2 logits</p>
          <button className="btn-tech" onClick={retry}>
            retry
          </button>
        </div>
      </InstrumentPanel>
    );
  }
  if (!data) {
    return (
      <InstrumentPanel label="token sampler — warming up">
        <p className="label-tech py-10 text-center">loading real GPT-2 logits…</p>
      </InstrumentPanel>
    );
  }

  const prompt = data.prompts[promptIdx];
  const probs = reshape(prompt.logits, { temperature, topK, topP });
  const effective = Math.exp(entropy(probs));
  const maxP = Math.max(...probs, 1e-9);

  const draw = () => {
    const i = sampleIndex(probs, Math.random());
    setSamples((s) => [...s.slice(-7), prompt.tokens[i]]);
    setFlash(i);
    window.setTimeout(() => setFlash(null), 350);
  };

  const selectPrompt = (i: number) => {
    setPromptIdx(i);
    setSamples([]);
  };

  return (
    <InstrumentPanel
      label="token sampler — real GPT-2 logits"
      readout={`≈ ${effective.toFixed(1)} effective choices`}
    >
      <div className="flex flex-wrap justify-center gap-1.5">
        {data.prompts.map((p, i) => (
          <button
            key={p.id}
            className="btn-tech"
            data-active={i === promptIdx}
            onClick={() => selectPrompt(i)}
          >
            {p.id}
          </button>
        ))}
      </div>

      <p className="readout mt-4 text-center text-sm">
        &ldquo;{prompt.text} <span className="text-station">▁</span>&rdquo;
      </p>

      <div className="mx-auto mt-4 flex max-w-xl flex-col gap-[3px]">
        {prompt.tokens.slice(0, SHOW).map((t, i) => {
          const p = probs[i];
          const cut = p === 0;
          return (
            <div key={i} className="flex items-center gap-2">
              <span
                className="readout w-24 shrink-0 truncate text-right text-[11px]"
                style={{ color: cut ? "var(--color-muted-foreground)" : "var(--color-foreground)" }}
              >
                {display(t)}
              </span>
              <div className="relative h-4 flex-1">
                <div
                  className="absolute inset-y-0 left-0 transition-all duration-200"
                  style={{
                    width: `${(p / maxP) * 100}%`,
                    background: cut ? "transparent" : "var(--station-dim)",
                    outline: flash === i ? "2px solid var(--station)" : "none",
                  }}
                />
                {cut && (
                  <div className="absolute inset-y-1 left-0 w-px bg-muted-foreground opacity-40" />
                )}
              </div>
              <span className="readout w-14 shrink-0 text-[11px] text-muted-foreground">
                {cut ? "cut" : `${(p * 100).toFixed(1)}%`}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-end justify-center gap-x-8 gap-y-3">
        <label className="label-tech block">
          temperature {temperature.toFixed(2)}
          <input
            type="range"
            min={0}
            max={2}
            step={0.05}
            value={temperature}
            onChange={(e) => setTemperature(Number(e.target.value))}
            className="mt-2 block"
            style={{ accentColor: "var(--station)", width: 130 }}
          />
        </label>
        <label className="label-tech block">
          top-k {topK === 0 ? "off" : topK}
          <input
            type="range"
            min={0}
            max={40}
            step={1}
            value={topK}
            onChange={(e) => setTopK(Number(e.target.value))}
            className="mt-2 block"
            style={{ accentColor: "var(--station)", width: 130 }}
          />
        </label>
        <label className="label-tech block">
          top-p {topP >= 1 ? "off" : topP.toFixed(2)}
          <input
            type="range"
            min={0.05}
            max={1}
            step={0.05}
            value={topP}
            onChange={(e) => setTopP(Number(e.target.value))}
            className="mt-2 block"
            style={{ accentColor: "var(--station)", width: 130 }}
          />
        </label>
        <button className="btn-tech" onClick={draw}>
          sample ▸
        </button>
      </div>

      {samples.length > 0 && (
        <p className="readout mt-4 text-center text-[12px] text-muted-foreground">
          drawn:{" "}
          {samples.map((s, i) => (
            <span key={i} className={i === samples.length - 1 ? "text-station" : undefined}>
              {display(s)}
              {i < samples.length - 1 ? " · " : ""}
            </span>
          ))}
        </p>
      )}
    </InstrumentPanel>
  );
}
