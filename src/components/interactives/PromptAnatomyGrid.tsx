/**
 * Prompt Anatomy Grid (Feedback Bench): one fixed question, all 16
 * combinations of role / context / constraints / example — every output
 * precomputed against the same local model with the same seed, so each
 * toggle flip shows a real delta (scripts/generate_prompt_anatomy.py).
 */
import { useEffect, useState } from "react";
import { InstrumentPanel } from "@/components/site/InstrumentPanel";

interface AnatomyData {
  model: string;
  base: string;
  components: { role: string; context: string; constraints: string; example: string };
  cells: Record<string, string>;
}

let cached: AnatomyData | null = null;

function useAnatomyData() {
  const [data, setData] = useState<AnatomyData | null>(cached);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (cached) return;
    let live = true;
    fetch("/data/prompt-anatomy.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: AnatomyData) => {
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

const PARTS = [
  { key: "role", label: "role", hint: "who the model should be" },
  { key: "context", label: "context", hint: "who it's talking to" },
  { key: "constraints", label: "constraints", hint: "the shape of the answer" },
  { key: "example", label: "example", hint: "a sample to imitate" },
] as const;

export function PromptAnatomyGrid() {
  const { data, failed, retry } = useAnatomyData();
  const [on, setOn] = useState({ role: false, context: false, constraints: false, example: false });

  if (failed) {
    return (
      <InstrumentPanel label="prompt anatomy — signal lost">
        <div className="flex items-center justify-center gap-4 py-10">
          <p className="label-tech">couldn&rsquo;t load the prompt grid</p>
          <button className="btn-tech" onClick={retry}>
            retry
          </button>
        </div>
      </InstrumentPanel>
    );
  }
  if (!data) {
    return (
      <InstrumentPanel label="prompt anatomy — warming up">
        <p className="label-tech py-10 text-center">loading 16 real outputs…</p>
      </InstrumentPanel>
    );
  }

  const key = PARTS.map((p) => (on[p.key] ? "1" : "0")).join("");
  const output = data.cells[key] ?? "";
  const activeCount = Object.values(on).filter(Boolean).length;

  return (
    <InstrumentPanel
      label="prompt anatomy — the same question, 16 ways"
      readout={`combo ${key} · ${activeCount}/4 parts`}
    >
      <div className="grid gap-4 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="flex flex-col gap-2">
          {PARTS.map((p) => (
            <button
              key={p.key}
              onClick={() => setOn((o) => ({ ...o, [p.key]: !o[p.key] }))}
              data-active={on[p.key]}
              className="btn-tech flex items-center justify-between gap-3 text-left"
            >
              <span>
                {on[p.key] ? "■" : "□"} {p.label}
              </span>
              <span className="normal-case tracking-normal text-muted-foreground">{p.hint}</span>
            </button>
          ))}
          <div className="panel mt-2 px-3 py-2.5">
            <p className="label-tech">assembled prompt</p>
            <div className="readout mt-2 flex flex-col gap-1.5 text-[11px] leading-relaxed">
              {on.role && <span className="text-station">{data.components.role}</span>}
              {on.context && <span className="text-station">{data.components.context}</span>}
              <span>{data.base}</span>
              {on.constraints && (
                <span className="text-station">{data.components.constraints}</span>
              )}
              {on.example && (
                <span className="text-station">
                  {data.components.example.split("\n")[0]} (…example follows)
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="panel px-4 py-3">
          <p className="label-tech">
            real output · <span className="normal-case">{data.model}</span>
          </p>
          <p className="prose-lab mt-2 max-h-[24rem] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed">
            {output}
          </p>
        </div>
      </div>
      <p className="label-tech mt-4 text-center normal-case tracking-normal">
        same model, same seed, same temperature — every difference you see was caused by the prompt
      </p>
    </InstrumentPanel>
  );
}
