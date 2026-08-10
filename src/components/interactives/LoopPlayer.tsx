/**
 * Loop Player — the Feedback Bench's signature instrument. One real task
 * (parse_duration) given to the same local model three ways: one-shot,
 * critique-and-revise loop, and an agent holding a test-runner tool.
 * Scrub through the actual transcripts (scripts/generate_feedback_transcripts.py)
 * and watch the per-rung test meters; nothing here is staged.
 */
import { useEffect, useState } from "react";
import { InstrumentPanel } from "@/components/site/InstrumentPanel";

interface Step {
  kind: string;
  text: string;
  code?: string;
  results?: boolean[];
}
interface Rung {
  id: string;
  title: string;
  tokens: number;
  steps: Step[];
}
interface FeedbackData {
  model: string;
  task: { name: string; spec: string; tests: string[]; labels: string[] };
  rungs: Rung[];
}

let cached: FeedbackData | null = null;

function useFeedbackData() {
  const [data, setData] = useState<FeedbackData | null>(cached);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (cached) return;
    let live = true;
    fetch("/data/feedback.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: FeedbackData) => {
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

const KIND_LABEL: Record<string, string> = {
  prompt: "task prompt",
  assistant: "model",
  feedback: "operator → model",
  tool: "test runner → agent",
  "agent-run_tests": "agent → run_tests",
  "agent-submit": "agent → submit",
};

/** latest known test vector at or before step index i */
function meterAt(rung: Rung, i: number): boolean[] | null {
  for (let j = Math.min(i, rung.steps.length - 1); j >= 0; j--) {
    const r = rung.steps[j].results;
    if (r) return r;
  }
  return null;
}

function TestMeter({ vec, labels }: { vec: boolean[] | null; labels: string[] }) {
  return (
    <div className="flex items-center gap-1.5">
      {labels.map((l, i) => (
        <span
          key={l}
          title={l}
          className="inline-block h-2 w-2 rounded-full"
          style={{
            background: vec?.[i] ? "var(--station)" : "transparent",
            boxShadow: vec?.[i] ? "0 0 6px var(--station-dim)" : "none",
            border: "1px solid var(--color-border)",
          }}
        />
      ))}
      <span className="readout ml-1 text-[11px] text-muted-foreground">
        {vec ? `${vec.filter(Boolean).length}/${labels.length}` : "—"}
      </span>
    </div>
  );
}

function prettyTool(text: string): string {
  try {
    const r = JSON.parse(text) as {
      passed: number;
      total: number;
      failures: { test: string; call: string; expected: string; got: string }[];
    };
    if (!r.failures?.length) return `${r.passed}/${r.total} passed — all green.`;
    return (
      `${r.passed}/${r.total} passed\n` +
      r.failures
        .map((f) => `✗ ${f.test}: ${f.call} → expected ${f.expected}, got ${f.got}`)
        .join("\n")
    );
  } catch {
    return text;
  }
}

function StepView({ step }: { step: Step }) {
  const isTool = step.kind === "tool";
  const body = step.code ?? (isTool ? prettyTool(step.text) : step.text);
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <p className="label-tech shrink-0">{KIND_LABEL[step.kind] ?? step.kind}</p>
      <pre className="readout mt-2 min-h-0 flex-1 overflow-auto whitespace-pre-wrap border border-border bg-secondary/40 p-2.5 text-[11px] leading-relaxed">
        {body}
      </pre>
    </div>
  );
}

export function LoopPlayer() {
  const { data, failed, retry } = useFeedbackData();
  const [step, setStep] = useState(0);

  if (failed) {
    return (
      <InstrumentPanel label="loop player — signal lost">
        <div className="flex items-center justify-center gap-4 py-10">
          <p className="label-tech">couldn&rsquo;t load the transcripts</p>
          <button className="btn-tech" onClick={retry}>
            retry
          </button>
        </div>
      </InstrumentPanel>
    );
  }
  if (!data) {
    return (
      <InstrumentPanel label="loop player — warming up">
        <p className="label-tech py-10 text-center">loading real transcripts…</p>
      </InstrumentPanel>
    );
  }

  const maxSteps = Math.max(...data.rungs.map((r) => r.steps.length));
  const clamped = Math.min(step, maxSteps - 1);

  return (
    <InstrumentPanel label="loop player — one task, three ways" readout={data.model} live>
      <div className="panel mb-4 px-4 py-3">
        <p className="label-tech">the task (and everything the spec doesn&rsquo;t say)</p>
        <p className="readout mt-2 text-[12px] leading-relaxed">{data.task.spec}</p>
        <p className="readout mt-2 text-[11px] text-muted-foreground">
          hidden acceptance tests: {data.task.tests.join(" · ")}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {data.rungs.map((rung) => {
          const i = Math.min(clamped, rung.steps.length - 1);
          const done = clamped > rung.steps.length - 1;
          const final = meterAt(rung, rung.steps.length - 1);
          return (
            <div
              key={rung.id}
              className="panel flex flex-col px-3 py-3 transition-opacity"
              style={{ opacity: done ? 0.6 : 1 }}
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-display text-sm font-semibold uppercase tracking-wide">
                  {rung.title}
                </p>
                <span className="readout text-[11px] text-muted-foreground">{rung.tokens} tok</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <TestMeter vec={meterAt(rung, i)} labels={data.task.labels} />
                <span className="readout text-[11px] text-muted-foreground">
                  {done
                    ? `done · shipped ${final?.filter(Boolean).length}/6`
                    : `step ${i + 1}/${rung.steps.length}`}
                </span>
              </div>
              <div className="mt-3 flex h-64 flex-col">
                <StepView step={rung.steps[i]} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-center gap-4">
        <button className="btn-tech" onClick={() => setStep((s) => Math.max(0, s - 1))}>
          &lt; prev
        </button>
        <input
          type="range"
          min={0}
          max={maxSteps - 1}
          value={clamped}
          onChange={(e) => setStep(Number(e.target.value))}
          style={{ accentColor: "var(--station)", width: 220 }}
          aria-label="transcript step"
        />
        <button className="btn-tech" onClick={() => setStep((s) => Math.min(maxSteps - 1, s + 1))}>
          next &gt;
        </button>
      </div>
      <p className="label-tech mt-3 text-center normal-case tracking-normal">
        scrub the shared timeline — the meters show what each approach actually knew, and shipped
      </p>
    </InstrumentPanel>
  );
}
