/**
 * Homepage hero: the forward-pass network with the controls stripped off.
 * It trains itself on a loop (random weights → solved → hold → re-roll) while
 * the inputs wander; move a pointer or finger across it and the inputs follow.
 * Same math and scene as the full lab on /neural-networks — nothing is canned.
 */
import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { adamStep, evaluate, initNet, signExamples, trainableSeed } from "@/lib/forwardnet";
import { useInView } from "@/hooks/use-in-view";

const Scene = lazy(() => import("./ForwardPassScene"));

const LR = 0.01;
const STEPS_PER_SEC = 60;
const MAX_STEPS = 1200;
const DONE_LOSS = 0.03;
const HOLD_SEC = 6; // admire the trained network before the next re-roll
const POINTER_GRACE_MS = 2500;
const DATA = signExamples();
const SIZE = "h-[230px] sm:h-[300px] lg:h-[380px]";

export function HeroNetwork() {
  const net = useRef(initNet(3));
  const input = useRef<[number, number]>([0.6, 0.7]);
  const pointer = useRef<{ x: number; y: number; at: number } | null>(null);
  const status = useRef<HTMLSpanElement>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const view = useRef<HTMLDivElement>(null);
  const inView = useInView(view);

  useEffect(() => {
    if (!mounted || !inView) return;
    const say = (text: string) => {
      if (status.current) status.current.textContent = text;
    };
    const trained = () => `trained · ${DATA.length} of ${DATA.length} answers right`;

    // reduced motion: show the finished network, hold still
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const seed = trainableSeed(3, DATA, LR, MAX_STEPS, DONE_LOSS);
      net.current = initNet(seed);
      for (let s = 0; s < MAX_STEPS && evaluate(net.current, DATA).loss >= DONE_LOSS; s++) {
        adamStep(net.current, DATA, LR);
      }
      input.current = [0.6, 0.7];
      say(trained());
      return;
    }

    let raf = 0;
    let last = performance.now();
    let owed = 0;
    let held = 0;
    let seed = 3;
    let clock = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
      last = now;
      clock += dt;

      // inputs: follow the pointer while it's around, otherwise wander
      const p = pointer.current;
      const tx = p && now - p.at < POINTER_GRACE_MS ? p.x : 0.85 * Math.sin(clock * 0.5);
      const ty = p && now - p.at < POINTER_GRACE_MS ? p.y : 0.85 * Math.sin(clock * 0.37 + 1);
      const k = Math.min(1, dt * 6);
      input.current = [
        input.current[0] + (tx - input.current[0]) * k,
        input.current[1] + (ty - input.current[1]) * k,
      ];

      const solved = evaluate(net.current, DATA).loss < DONE_LOSS;
      if (solved || net.current.t >= MAX_STEPS) {
        if (held === 0) say(trained());
        held += dt;
        if (held > HOLD_SEC) {
          seed = trainableSeed(seed + 1, DATA, LR, MAX_STEPS, DONE_LOSS);
          net.current = initNet(seed);
          held = 0;
          owed = 0;
        }
      } else {
        owed += dt * STEPS_PER_SEC;
        while (owed >= 1) {
          adamStep(net.current, DATA, LR);
          owed -= 1;
        }
        const right = Math.round(evaluate(net.current, DATA).acc * DATA.length);
        say(`training · step ${net.current.t} · ${right} of ${DATA.length} right`);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mounted, inView]);

  return (
    <div>
      <div
        ref={view}
        role="img"
        aria-label="A small neural network training live: signals pulse from two inputs through two hidden layers to one output while its connections strengthen and weaken."
        className={`relative w-full ${SIZE}`}
        style={{ touchAction: "pan-y" }}
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          pointer.current = {
            x: Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1)),
            y: Math.max(-1, Math.min(1, 1 - ((e.clientY - r.top) / r.height) * 2)),
            at: performance.now(),
          };
        }}
      >
        {mounted && (
          <Suspense fallback={null}>
            <Scene net={net} input={input} mode="hero" active={inView} className="h-full" />
          </Suspense>
        )}
      </div>
      <p className="label-tech mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 lg:justify-end">
        <span>
          <span className="led led-pulse mr-2 inline-block align-middle" />
          <span ref={status}>a real network, learning in your browser</span>
        </span>
        <Link
          to="/neural-networks"
          hash="forward-pass"
          className="inline-flex min-h-11 items-center text-station underline underline-offset-4"
        >
          open it up →
        </Link>
      </p>
    </div>
  );
}
