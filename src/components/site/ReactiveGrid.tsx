import { useEffect, useRef } from "react";

/**
 * The grid paper, made physical: a spring-lattice canvas that ripples away
 * from the pointer and settles back (the Geometry Wars trick, tuned down to
 * precision-instrument subtlety). Replaces the static .grid-paper ::before
 * while mounted; falls back to it under prefers-reduced-motion or no JS.
 * The simulation sleeps whenever the lattice is at rest — idle cost is zero.
 */

const SPACING = 28; // must match .grid-paper's background-size
const BASE_ALPHA = 0.05; // must match .grid-paper's line alpha
const RADIUS = 130; // pointer influence radius (px)
const PUSH = 0.16; // impulse scale from pointer speed
const SPRING = 0.045; // pull back toward rest
const COUPLE = 0.055; // neighbor coupling — this is what makes waves
const DAMP = 0.915;
const MAX_OFF = 13; // displacement clamp (px)
const REST_EPS = 0.04; // below this total energy, go to sleep

export function ReactiveGrid() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const host = canvas.closest<HTMLElement>(".grid-paper");
    const ctx = canvas.getContext("2d");
    if (!host || !ctx) return;
    host.dataset.reactive = "true"; // hides the static CSS grid

    const ink = getComputedStyle(canvas).getPropertyValue("--foreground").trim() || "#e8e3d4";
    const accent = getComputedStyle(canvas).getPropertyValue("--station").trim() || ink;

    let cols = 0;
    let rows = 0;
    let w = 0;
    let h = 0;
    // flat arrays: offsets + velocities per node
    let ox: Float32Array = new Float32Array(0);
    let oy: Float32Array = new Float32Array(0);
    let vx: Float32Array = new Float32Array(0);
    let vy: Float32Array = new Float32Array(0);

    const dpr = Math.min(2, window.devicePixelRatio || 1);

    const setup = () => {
      w = host.clientWidth;
      h = host.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      cols = Math.floor(w / SPACING) + 2;
      rows = Math.floor(h / SPACING) + 2;
      const n = cols * rows;
      ox = new Float32Array(n);
      oy = new Float32Array(n);
      vx = new Float32Array(n);
      vy = new Float32Array(n);
      draw();
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;

      // base lattice: one polyline per row and column through displaced nodes
      ctx.strokeStyle = ink;
      ctx.globalAlpha = BASE_ALPHA;
      ctx.beginPath();
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          const x = c * SPACING + ox[i];
          const y = r * SPACING + oy[i];
          if (c === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      }
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          const i = r * cols + c;
          const x = c * SPACING + ox[i];
          const y = r * SPACING + oy[i];
          if (r === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // disturbed segments glow faintly in the station's accent
      ctx.strokeStyle = accent;
      ctx.beginPath();
      let glowing = false;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          const d = Math.abs(ox[i]) + Math.abs(oy[i]);
          if (d < 1.2) continue;
          glowing = true;
          const x = c * SPACING + ox[i];
          const y = r * SPACING + oy[i];
          if (c + 1 < cols) {
            const j = i + 1;
            ctx.moveTo(x, y);
            ctx.lineTo((c + 1) * SPACING + ox[j], r * SPACING + oy[j]);
          }
          if (r + 1 < rows) {
            const j = i + cols;
            ctx.moveTo(x, y);
            ctx.lineTo(c * SPACING + ox[j], (r + 1) * SPACING + oy[j]);
          }
        }
      }
      if (glowing) {
        ctx.globalAlpha = 0.1;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // reproduce the CSS mask: elliptical fade from the upper middle
      ctx.globalCompositeOperation = "destination-in";
      const g = ctx.createRadialGradient(w * 0.5, h * 0.3, 0, w * 0.5, h * 0.3, 1);
      g.addColorStop(0.3, "rgba(0,0,0,1)");
      g.addColorStop(0.78, "rgba(0,0,0,0)");
      ctx.save();
      ctx.translate(w * 0.5, h * 0.3);
      ctx.scale(w * 0.9, h * 0.8);
      ctx.translate(-w * 0.5, -h * 0.3);
      ctx.fillStyle = g;
      ctx.fillRect(w * 0.5 - 1, h * 0.3 - 1, 2, 2);
      ctx.restore();
      ctx.globalCompositeOperation = "source-over";
    };

    /* ---- simulation ---- */
    let raf = 0;
    let running = false;

    const step = () => {
      let energy = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          // neighbor coupling — displacement differences propagate as waves
          let nx = 0;
          let ny = 0;
          let n = 0;
          if (c > 0) {
            nx += ox[i - 1];
            ny += oy[i - 1];
            n++;
          }
          if (c + 1 < cols) {
            nx += ox[i + 1];
            ny += oy[i + 1];
            n++;
          }
          if (r > 0) {
            nx += ox[i - cols];
            ny += oy[i - cols];
            n++;
          }
          if (r + 1 < rows) {
            nx += ox[i + cols];
            ny += oy[i + cols];
            n++;
          }
          vx[i] += COUPLE * (nx / n - ox[i]) - SPRING * ox[i];
          vy[i] += COUPLE * (ny / n - oy[i]) - SPRING * oy[i];
          vx[i] *= DAMP;
          vy[i] *= DAMP;
        }
      }
      for (let i = 0; i < ox.length; i++) {
        ox[i] = Math.max(-MAX_OFF, Math.min(MAX_OFF, ox[i] + vx[i]));
        oy[i] = Math.max(-MAX_OFF, Math.min(MAX_OFF, oy[i] + vy[i]));
        energy += Math.abs(ox[i]) + Math.abs(oy[i]) + Math.abs(vx[i]) + Math.abs(vy[i]);
      }
      draw();
      if (energy / ox.length > REST_EPS) {
        raf = requestAnimationFrame(step);
      } else {
        // settle completely and sleep
        ox.fill(0);
        oy.fill(0);
        vx.fill(0);
        vy.fill(0);
        draw();
        running = false;
      }
    };

    const wake = () => {
      if (!running) {
        running = true;
        raf = requestAnimationFrame(step);
      }
    };

    let lastX = -1;
    let lastY = -1;
    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      if (lastX < 0) {
        lastX = px;
        lastY = py;
        return;
      }
      const mvx = px - lastX;
      const mvy = py - lastY;
      lastX = px;
      lastY = py;
      const speed = Math.hypot(mvx, mvy);
      if (speed < 0.5) return;

      const c0 = Math.max(0, Math.floor((px - RADIUS) / SPACING));
      const c1 = Math.min(cols - 1, Math.ceil((px + RADIUS) / SPACING));
      const r0 = Math.max(0, Math.floor((py - RADIUS) / SPACING));
      const r1 = Math.min(rows - 1, Math.ceil((py + RADIUS) / SPACING));
      for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
          const i = r * cols + c;
          const dx = c * SPACING - px;
          const dy = r * SPACING - py;
          const d = Math.hypot(dx, dy);
          if (d > RADIUS) continue;
          const fall = 1 - d / RADIUS;
          // push outward from the cursor, scaled by how fast it's moving
          const f = (PUSH * Math.min(speed, 40) * fall * fall) / Math.max(d, 12);
          vx[i] += dx * f;
          vy[i] += dy * f;
        }
      }
      wake();
    };

    const ro = new ResizeObserver(setup);
    ro.observe(host);
    setup();
    host.addEventListener("pointermove", onMove);

    return () => {
      host.removeEventListener("pointermove", onMove);
      ro.disconnect();
      cancelAnimationFrame(raf);
      delete host.dataset.reactive;
    };
  }, []);

  return (
    <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />
  );
}
