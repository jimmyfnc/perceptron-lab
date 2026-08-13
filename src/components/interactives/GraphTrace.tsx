/**
 * Graph Trace — the Wiring Loom's signature instrument. Six machine-checked
 * mini-tasks through two REAL orgs on the same local model: a lone
 * generalist vs a router that hands each task to a specialist node. Pick a
 * task, read both paths side by side — routing decisions, misroutes, token
 * bills, and the harness's verdict (scripts/generate_graph_trace.py).
 */
import { useEffect, useState } from "react";
import { InstrumentPanel } from "@/components/site/InstrumentPanel";

interface TraceStep {
  node: string;
  text: string;
  tokens: number;
  decision?: string;
}
interface TraceRun {
  task: string;
  steps: TraceStep[];
  pass: boolean;
  shown: string;
  misroute?: boolean;
}
interface TraceOrg {
  id: string;
  title: string;
  runs: TraceRun[];
}
interface TraceTask {
  id: string;
  kind: string;
  prompt: string;
  check: string;
}
interface TraceData {
  model: string;
  tasks: TraceTask[];
  orgs: TraceOrg[];
  totals: Record<string, { passed: number; tokens: number }>;
}

let cached: TraceData | null = null;

function useTraceData() {
  const [data, setData] = useState<TraceData | null>(cached);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (cached) return;
    let live = true;
    fetch("/data/graphtrace.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: TraceData) => {
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

function PassDot({ ok }: { ok: boolean }) {
  return (
    <span
      className="inline-block h-2 w-2 rounded-full"
      style={{
        background: ok ? "var(--station)" : "transparent",
        border: "1px solid " + (ok ? "var(--station)" : "var(--color-border)"),
        boxShadow: ok ? "0 0 6px var(--station-dim)" : "none",
      }}
    />
  );
}

function OrgColumn({ org, run, check }: { org: TraceOrg; run: TraceRun; check: string }) {
  return (
    <div className="panel flex flex-col px-3 py-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-display text-sm font-semibold uppercase tracking-wide">{org.title}</p>
        <span className="readout text-[11px] text-muted-foreground">
          {run.steps.reduce((a, s) => a + s.tokens, 0)} tok
        </span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <PassDot ok={run.pass} />
        <span className="readout text-[11px] text-muted-foreground">
          {run.pass ? "passed" : "failed"} · {check}
        </span>
        {run.misroute && (
          <span className="label-tech border border-station-dim px-1.5 py-0.5 text-station">
            misroute
          </span>
        )}
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {run.steps.map((s, i) => (
          <div key={i}>
            <p className="label-tech">
              node · {s.node}
              {s.decision && (
                <span className="ml-2 normal-case text-station">→ {s.decision} lane</span>
              )}
            </p>
            <pre className="readout mt-1 max-h-44 overflow-auto whitespace-pre-wrap border border-border bg-secondary/40 p-2.5 text-[11px] leading-relaxed">
              {s.text}
            </pre>
          </div>
        ))}
        <p className="readout text-[10px] text-muted-foreground">
          harness extracted: <span className="text-foreground">{run.shown}</span>
        </p>
      </div>
    </div>
  );
}

export function GraphTrace() {
  const { data, failed, retry } = useTraceData();
  const [taskIdx, setTaskIdx] = useState(0);

  if (failed) {
    return (
      <InstrumentPanel label="graph trace — signal lost">
        <div className="flex items-center justify-center gap-4 py-10">
          <p className="label-tech">couldn&rsquo;t load the org transcripts</p>
          <button className="btn-tech" onClick={retry}>
            retry
          </button>
        </div>
      </InstrumentPanel>
    );
  }
  if (!data) {
    return (
      <InstrumentPanel label="graph trace — warming up">
        <p className="label-tech py-10 text-center">loading real org runs…</p>
      </InstrumentPanel>
    );
  }

  const task = data.tasks[taskIdx];
  const runs = data.orgs.map((o) => ({ org: o, run: o.runs.find((r) => r.task === task.id)! }));

  return (
    <InstrumentPanel label="graph trace — one task set, two orgs" readout={data.model} live>
      {/* scoreboard */}
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        {data.orgs.map((o) => (
          <div key={o.id} className="panel flex items-center justify-between px-4 py-2.5">
            <span className="label-tech">{o.title}</span>
            <span className="readout text-[12px]">
              <span className="text-station">{data.totals[o.id].passed}/6</span>
              <span className="text-muted-foreground"> · {data.totals[o.id].tokens} tok</span>
            </span>
          </div>
        ))}
      </div>

      {/* task picker with per-org verdicts at a glance */}
      <div className="flex flex-wrap justify-center gap-1.5">
        {data.tasks.map((t, i) => {
          const verdicts = data.orgs.map((o) => o.runs.find((r) => r.task === t.id)!.pass);
          return (
            <button
              key={t.id}
              className="btn-tech flex items-center gap-2"
              data-active={i === taskIdx}
              onClick={() => setTaskIdx(i)}
            >
              {t.id}
              <span className="flex gap-1">
                {verdicts.map((v, j) => (
                  <PassDot key={j} ok={v} />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      <p className="readout mt-4 border border-border bg-secondary/40 p-2.5 text-center text-[12px] leading-relaxed">
        {task.prompt}
      </p>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {runs.map(({ org, run }) => (
          <OrgColumn key={org.id} org={org} run={run} check={task.check} />
        ))}
      </div>

      <p className="label-tech mt-4 text-center normal-case tracking-normal">
        same model, same tasks, same scoring — the org chart is the only thing that changed
      </p>
    </InstrumentPanel>
  );
}
