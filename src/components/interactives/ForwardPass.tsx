/**
 * The forward pass, lid off: a 2 → 4 → 4 → 1 network in 3D. Set the two
 * inputs and watch the signal travel; tap a neuron for its weighted sum;
 * train it and watch the weights rearrange until it solves the sign task
 * (XOR — the one a single neuron cannot). Math is in src/lib/forwardnet.ts;
 * the three.js scene lazy-loads in its own chunk.
 */
import { Suspense, lazy, useEffect, useRef, useState, type ReactNode } from "react";
import {
  IDLE_COLOR,
  LAYERS,
  NEG_COLOR,
  POS_COLOR,
  adamStep,
  evaluate,
  forward,
  initNet,
  predict,
  signExamples,
  trainableSeed,
} from "@/lib/forwardnet";
import { useInView } from "@/hooks/use-in-view";
import { InstrumentPanel } from "@/components/site/InstrumentPanel";
import type { NeuronRef } from "./ForwardPassScene";

const Scene = lazy(() => import("./ForwardPassScene"));

const LR = 0.01;
const STEPS_PER_SEC = 60;
const MAX_STEPS = 1200;
const DONE_LOSS = 0.03;
const START_SEED = 3;
const DATA = signExamples();

const MAP = 132; // answer-map css px
const FIELD = 26; // answer-map resolution
const SCENE_H = "h-[300px] md:h-[380px]";

const hex = (h: string): [number, number, number] => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
];
const RGB_POS = hex(POS_COLOR);
const RGB_NEG = hex(NEG_COLOR);
const RGB_IDLE = hex(IDLE_COLOR);

const LAYER_NAMES = ["input", "hidden layer 1", "hidden layer 2", "output"];

const WALK: ReactNode[] = [
  <>
    <strong>Inputs.</strong> Two numbers go in. Each input neuron just holds one of them — move a
    slider and watch it change color.
  </>,
  <>
    <strong>Hidden layer 1.</strong> Each neuron multiplies every input by a weight (the lines),
    adds the results, then squashes the total to between −1 and 1.
  </>,
  <>
    <strong>Hidden layer 2.</strong> Same recipe, but its inputs are the first layer&rsquo;s
    outputs. This is where simple signals combine into patterns.
  </>,
  <>
    <strong>Output.</strong> One last weighted sum, squashed to between 0 and 1. That number is the
    network&rsquo;s answer.
  </>,
];

const fmt = (v: number) => (v < 0 ? "−" : "") + Math.abs(v).toFixed(2);
const clamp = (v: number) => Math.max(-1, Math.min(1, v));

function ScenePlaceholder() {
  return (
    <div className={`flex w-full items-center justify-center ${SCENE_H}`}>
      <p className="label-tech">
        <span className="led led-pulse mr-2 inline-block align-middle" />
        warming up the 3d instrument…
      </p>
    </div>
  );
}

export function ForwardPass() {
  const net = useRef(initNet(START_SEED));
  const seed = useRef(START_SEED);
  const input = useRef<[number, number]>([0.6, 0.7]);
  const [x, setX] = useState<[number, number]>([0.6, 0.7]);
  const [steps, setSteps] = useState(0);
  const [training, setTraining] = useState(false);
  const [stepLayer, setStepLayer] = useState<number | null>(null);
  const [selected, setSelected] = useState<NeuronRef | null>(null);

  const setInputs = (a: number, b: number) => {
    const next: [number, number] = [clamp(a), clamp(b)];
    input.current = next;
    setX(next);
  };

  // never render the 3D chunk during SSR, and rest it when scrolled away
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const view = useRef<HTMLDivElement>(null);
  const inView = useInView(view);

  // the training loop — time-based, so a 120 Hz screen doesn't learn twice as fast
  useEffect(() => {
    if (!training || !inView) return;
    let raf = 0;
    let last = performance.now();
    let owed = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
      last = now;
      owed += dt * STEPS_PER_SEC;
      let done = 0;
      while (owed >= 1 && done < 6) {
        adamStep(net.current, DATA, LR);
        owed -= 1;
        done++;
      }
      if (done > 0) {
        setSteps((s) => s + done);
        if (evaluate(net.current, DATA).loss < DONE_LOSS || net.current.t >= MAX_STEPS) {
          setTraining(false);
          return;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [training, inView]);

  const pass = forward(net.current, x);
  const out = pass.acts[LAYERS.length - 1][0];
  const stats = evaluate(net.current, DATA);
  const solved = stats.loss < DONE_LOSS;
  const stuck = !solved && net.current.t >= MAX_STEPS;

  /* ---- answer map: the output for every possible input pair ---- */
  const mapRef = useRef<HTMLCanvasElement>(null);
  const scratch = useRef<{ img: ImageData; off: HTMLCanvasElement } | null>(null);
  useEffect(() => {
    const canvas = mapRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== MAP * dpr) {
      canvas.width = MAP * dpr;
      canvas.height = MAP * dpr;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!scratch.current) {
      const off = document.createElement("canvas");
      off.width = FIELD;
      off.height = FIELD;
      scratch.current = { img: new ImageData(FIELD, FIELD), off };
    }
    const { img, off } = scratch.current;
    for (let gy = 0; gy < FIELD; gy++) {
      for (let gx = 0; gx < FIELD; gx++) {
        const v =
          predict(net.current, ((gx + 0.5) / FIELD) * 2 - 1, 1 - ((gy + 0.5) / FIELD) * 2) * 2 - 1;
        const to = v >= 0 ? RGB_POS : RGB_NEG;
        const a = Math.abs(v) * 0.85;
        const k = (gy * FIELD + gx) * 4;
        for (let c = 0; c < 3; c++) img.data[k + c] = RGB_IDLE[c] + (to[c] - RGB_IDLE[c]) * a;
        img.data[k + 3] = 255;
      }
    }
    off.getContext("2d")!.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(off, 0, 0, MAP, MAP);
    // axes: the four quadrants are the whole story of this task
    ctx.strokeStyle = "rgba(231, 226, 218, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(MAP / 2, 0);
    ctx.lineTo(MAP / 2, MAP);
    ctx.moveTo(0, MAP / 2);
    ctx.lineTo(MAP, MAP / 2);
    ctx.stroke();
    // the current input
    ctx.beginPath();
    ctx.arc(((x[0] + 1) / 2) * MAP, (1 - (x[1] + 1) / 2) * MAP, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#090a0e";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#e7e2da";
    ctx.stroke();
  });

  const mapDrag = useRef(false);
  const mapSet = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setInputs(((e.clientX - r.left) / r.width) * 2 - 1, 1 - ((e.clientY - r.top) / r.height) * 2);
  };

  const reroll = () => {
    seed.current = trainableSeed(seed.current + 1, DATA, LR, MAX_STEPS, DONE_LOSS);
    net.current = initNet(seed.current);
    setTraining(false);
    setSteps(0);
  };

  /* ---- the caption: walk-through step, tapped neuron, or the nudge ---- */
  let caption: ReactNode;
  if (stepLayer !== null) {
    caption = WALK[stepLayer];
  } else if (selected && selected.l === 0) {
    caption = (
      <>
        <strong>Input {selected.j + 1}</strong> holds the number you set: {fmt(x[selected.j])}. It
        sends that value down every line leaving it.
      </>
    );
  } else if (selected) {
    const { l, j } = selected;
    const terms = pass.acts[l - 1]
      .map((a, i) => `(${fmt(a)} × ${fmt(net.current.W[l - 1][j][i])})`)
      .join(" + ");
    caption = (
      <>
        <strong>
          {LAYER_NAMES[l][0].toUpperCase() + LAYER_NAMES[l].slice(1)}
          {l === LAYERS.length - 1 ? "" : `, neuron ${j + 1}`}.
        </strong>{" "}
        Each incoming value times its weight, plus a bias, then squashed.
        <span className="readout mt-1 block break-words text-xs text-muted-foreground">
          {terms} + bias {fmt(net.current.B[l - 1][j])} = {fmt(pass.zs[l - 1][j])} →{" "}
          {l === LAYERS.length - 1 ? "sigmoid" : "tanh"} →{" "}
          <span className="text-foreground">{fmt(pass.acts[l][j])}</span>
        </span>
      </>
    );
  } else if (stuck) {
    caption = (
      <>
        This start got stuck: the loss stopped falling before the answers were all right. It happens
        — <strong>where you begin decides which valley you roll into</strong>. Re-roll the weights
        and train again.
      </>
    );
  } else if (steps === 0) {
    caption = (
      <>
        The weights start out random, so most answers are wrong. Press <strong>train</strong> and
        watch the lines shift. Drag to rotate; tap a neuron to see its math.
      </>
    );
  } else {
    caption = (
      <>
        <strong>Training nudges every weight a little, over and over</strong>, toward fewer wrong
        answers. Drag to rotate; tap a neuron to see its math.
      </>
    );
  }

  const onAxis = Math.abs(x[0] * x[1]) < 1e-9;
  const says = out > 0.5 ? "same sign" : "different signs";
  const right = out > 0.5 === x[0] * x[1] > 0;

  return (
    <InstrumentPanel
      label="Forward pass — two numbers in, one answer out"
      live={training}
      readout={`step ${steps} · loss ${stats.loss.toFixed(3)} · ${Math.round(stats.acc * DATA.length)}/${DATA.length} right`}
    >
      <div ref={view}>
        {mounted ? (
          <Suspense fallback={<ScenePlaceholder />}>
            <Scene
              net={net}
              input={input}
              active={inView}
              stepLayer={stepLayer}
              selected={selected}
              onSelect={(n) => {
                setSelected(n);
                if (n) setStepLayer(null);
              }}
              className={SCENE_H}
            />
          </Suspense>
        ) : (
          <ScenePlaceholder />
        )}
      </div>

      <p className="mx-auto mt-2 min-h-[6.5rem] max-w-xl text-base leading-snug" aria-live="polite">
        {caption}
      </p>

      <div className="mt-3 flex flex-wrap items-start justify-center gap-4">
        <div style={{ width: MAP }}>
          <canvas
            ref={mapRef}
            tabIndex={0}
            role="img"
            aria-label="Map of the network's answer for every pair of inputs. Drag, or use the arrow keys, to set both inputs."
            style={{ width: MAP, height: MAP, touchAction: "none" }}
            className="block cursor-crosshair border border-border"
            onPointerDown={(e) => {
              mapDrag.current = true;
              e.currentTarget.setPointerCapture(e.pointerId);
              mapSet(e);
            }}
            onPointerMove={(e) => {
              if (mapDrag.current) mapSet(e);
            }}
            onPointerUp={() => (mapDrag.current = false)}
            onPointerCancel={() => (mapDrag.current = false)}
            onKeyDown={(e) => {
              const d = (
                {
                  ArrowLeft: [-0.05, 0],
                  ArrowRight: [0.05, 0],
                  ArrowUp: [0, 0.05],
                  ArrowDown: [0, -0.05],
                } as Record<string, [number, number]>
              )[e.key];
              if (!d) return;
              e.preventDefault();
              setInputs(x[0] + d[0], x[1] + d[1]);
            }}
          />
          <p className="label-tech mt-1.5 normal-case tracking-normal">
            the answer for every input — drag the dot
          </p>
        </div>

        <div className="flex w-[296px] max-w-full flex-col gap-2">
          {[0, 1].map((k) => (
            <label key={k} className="label-tech flex min-h-11 items-center gap-2">
              <span className="w-[4.5rem] shrink-0 whitespace-nowrap">input {k + 1}</span>
              <input
                type="range"
                min={-1}
                max={1}
                step={0.01}
                value={x[k]}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setInputs(k === 0 ? v : x[0], k === 1 ? v : x[1]);
                }}
                style={{ accentColor: "var(--station)" }}
                className="min-w-0 flex-1"
              />
              <span className="readout w-11 text-right text-foreground">{fmt(x[k])}</span>
            </label>
          ))}
          <div className="flex items-baseline gap-3 border-t border-border pt-2">
            <span className="readout text-2xl">{out.toFixed(2)}</span>
            <span className="text-sm text-muted-foreground">
              network says &ldquo;{says}&rdquo;
              {!onAxis && (
                <>
                  {" — "}
                  <span className={right ? "text-foreground" : undefined}>
                    {right ? "correct" : "wrong"}
                  </span>
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
        <button
          className="btn-tech"
          data-active={training}
          disabled={!training && (solved || stuck)}
          onClick={() => setTraining((t) => !t)}
        >
          {training ? "pause" : steps === 0 ? "train the network" : solved ? "trained" : "resume"}
        </button>
        <button
          className="btn-tech"
          data-active={stepLayer !== null}
          onClick={() => {
            setSelected(null);
            setStepLayer((s) => (s === null ? 0 : s < LAYERS.length - 1 ? s + 1 : null));
          }}
        >
          {stepLayer === null
            ? "walk through it"
            : stepLayer < LAYERS.length - 1
              ? `next layer (${stepLayer + 1} of ${LAYERS.length})`
              : "finish walk-through"}
        </button>
        <button className="btn-tech" onClick={reroll}>
          re-roll weights
        </button>
      </div>

      <p className="label-tech mt-3 text-center normal-case tracking-normal">
        <span style={{ color: POS_COLOR }}>amber</span> = positive ·{" "}
        <span style={{ color: NEG_COLOR }}>cyan</span> = negative · thicker line = stronger weight ·
        the goal: answer 1 when both inputs share a sign
      </p>
    </InstrumentPanel>
  );
}
