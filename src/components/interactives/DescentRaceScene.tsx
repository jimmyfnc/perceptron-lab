/**
 * The 3D half of the optimizer race — everything that touches three.js
 * lives here so the chunk (three + r3f) lazy-loads with the figure.
 * Default export for React.lazy.
 */
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { OPTIMIZERS, type OptimizerKey, type Run3, type Surface3 } from "@/lib/descent";

const SPAN = 3.1; // world-units footprint of the larger window axis
const HEIGHT = 1.0; // world-units height of the tallest point
const GRID_N = 120; // surface tessellation
const GRID_LINES = 18; // draped graph-paper lines per axis

interface Mapping {
  toWorld: (x: number, y: number, f: number) => [number, number, number];
  toMath: (wx: number, wz: number) => [number, number];
  hAt: (f: number) => number;
}

function buildMapping(s: Surface3): Mapping {
  const [x0, x1, y0, y1] = s.window;
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const span = Math.max(x1 - x0, y1 - y0);
  let fmin = Infinity;
  let fmax = -Infinity;
  for (let i = 0; i <= 80; i++) {
    for (let j = 0; j <= 80; j++) {
      const v = s.f(x0 + ((x1 - x0) * j) / 80, y0 + ((y1 - y0) * i) / 80);
      if (v < fmin) fmin = v;
      if (v > fmax) fmax = v;
    }
  }
  const range = fmax - fmin || 1; // a flat surface must not divide by zero
  const hAt = (f: number) => ((f - fmin) / range) * HEIGHT;
  return {
    hAt,
    toWorld: (x, y, f) => [((x - cx) / span) * SPAN, hAt(f), ((y - cy) / span) * SPAN],
    toMath: (wx, wz) => [cx + (wx / SPAN) * span, cy + (wz / SPAN) * span],
  };
}

/** Banded-contour vertex colors, same convention as the 2D descent figure.
    Values are authored in sRGB and converted to linear, since the renderer
    gamma-lifts vertex colors on output. */
const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

function bandColor(t: number): [number, number, number] {
  const band = Math.floor(Math.sqrt(t) * 15) / 15;
  const l = 30 + band * 46;
  return [toLinear(l / 255), toLinear((l + 4) / 255), toLinear((l + 13) / 255)];
}

function SurfaceMesh({
  s,
  map,
  onPlace,
}: {
  s: Surface3;
  map: Mapping;
  onPlace: (p: [number, number]) => void;
}) {
  const [x0, x1, y0, y1] = s.window;

  const geo = useMemo(() => {
    const n = GRID_N;
    const pos = new Float32Array((n + 1) * (n + 1) * 3);
    const col = new Float32Array((n + 1) * (n + 1) * 3);
    for (let i = 0; i <= n; i++) {
      for (let j = 0; j <= n; j++) {
        const x = x0 + ((x1 - x0) * j) / n;
        const y = y0 + ((y1 - y0) * i) / n;
        const [wx, wy, wz] = map.toWorld(x, y, s.f(x, y));
        const k = (i * (n + 1) + j) * 3;
        pos[k] = wx;
        pos[k + 1] = wy;
        pos[k + 2] = wz;
        // bands share the mapping's normalization: t = height / HEIGHT
        const [r, g, b] = bandColor(Math.max(0, Math.min(1, wy / HEIGHT)));
        col[k] = r;
        col[k + 1] = g;
        col[k + 2] = b;
      }
    }
    const idx: number[] = [];
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const a = i * (n + 1) + j;
        // CCW seen from +Y so the upward face is the front face
        idx.push(a, a + n + 1, a + 1, a + 1, a + n + 1, a + n + 2);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.setIndex(idx);
    return g;
  }, [s, map, x0, x1, y0, y1]);

  // graph paper draped over the surface, slightly lifted
  const grid = useMemo(() => {
    const pts: number[] = [];
    const lift = 0.006;
    const m = 90; // samples along each line
    for (let l = 0; l <= GRID_LINES; l++) {
      for (let k = 0; k < m; k++) {
        const push = (x: number, y: number) => {
          const [wx, wy, wz] = map.toWorld(x, y, s.f(x, y));
          pts.push(wx, wy + lift, wz);
        };
        // constant-y line
        const yl = y0 + ((y1 - y0) * l) / GRID_LINES;
        push(x0 + ((x1 - x0) * k) / m, yl);
        push(x0 + ((x1 - x0) * (k + 1)) / m, yl);
        // constant-x line
        const xl = x0 + ((x1 - x0) * l) / GRID_LINES;
        push(xl, y0 + ((y1 - y0) * k) / m);
        push(xl, y0 + ((y1 - y0) * (k + 1)) / m);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pts), 3));
    return new THREE.LineSegments(
      g,
      new THREE.LineBasicMaterial({ color: "#e8e3d4", transparent: true, opacity: 0.07 }),
    );
  }, [s, map, x0, x1, y0, y1]);

  useEffect(() => () => geo.dispose(), [geo]);
  useEffect(
    () => () => {
      grid.geometry.dispose();
      (grid.material as THREE.Material).dispose();
    },
    [grid],
  );

  const down = useRef<{ x: number; y: number } | null>(null);
  return (
    <group>
      <mesh
        geometry={geo}
        onPointerDown={(e) => {
          down.current = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY };
        }}
        onPointerUp={(e) => {
          const d = down.current;
          down.current = null;
          if (!d) return;
          const moved = Math.hypot(e.nativeEvent.clientX - d.x, e.nativeEvent.clientY - d.y);
          if (moved > 6) return; // it was an orbit drag, not a click
          const [mx, my] = map.toMath(e.point.x, e.point.z);
          const pad = 0.04;
          onPlace([
            Math.min(x1 - pad, Math.max(x0 + pad, mx)),
            Math.min(y1 - pad, Math.max(y0 + pad, my)),
          ]);
        }}
      >
        <meshBasicMaterial vertexColors side={THREE.DoubleSide} />
      </mesh>
      <primitive object={grid} />
    </group>
  );
}

function Racers({
  runs,
  map,
  step,
}: {
  runs: Record<OptimizerKey, Run3>;
  map: Mapping;
  step: number;
}) {
  // one preallocated trail line per optimizer; drawRange follows `step`
  const trails = useMemo(
    () =>
      OPTIMIZERS.map((o) => {
        const run = runs[o.key];
        const pos = new Float32Array(run.path.length * 3);
        run.path.forEach(([x, y, f], i) => {
          const [wx, wy, wz] = map.toWorld(x, y, f);
          pos[i * 3] = wx;
          pos[i * 3 + 1] = wy + 0.012;
          pos[i * 3 + 2] = wz;
        });
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        // start fully hidden — the drawRange effect reveals it; without this
        // a freshly built trail paints its whole trajectory for one frame
        g.setDrawRange(0, 1);
        const line = new THREE.Line(
          g,
          new THREE.LineBasicMaterial({ color: o.color, transparent: true, opacity: 0.85 }),
        );
        line.frustumCulled = false;
        return line;
      }),
    [runs, map],
  );

  useEffect(
    () => () =>
      trails.forEach((t) => {
        t.geometry.dispose();
        (t.material as THREE.Material).dispose();
      }),
    [trails],
  );

  useEffect(() => {
    OPTIMIZERS.forEach((o, i) => {
      trails[i].geometry.setDrawRange(0, Math.min(step + 1, runs[o.key].path.length));
    });
  }, [step, trails, runs]);

  return (
    <group>
      {OPTIMIZERS.map((o, i) => {
        const run = runs[o.key];
        const [x, y, f] = run.path[Math.max(0, Math.min(step, run.path.length - 1))];
        const gone = run.diverged && step >= run.path.length - 1;
        const [wx, wy, wz] = map.toWorld(x, y, f);
        return (
          <group key={o.key}>
            <primitive object={trails[i]} />
            {!gone && (
              <mesh position={[wx, wy + 0.045, wz]}>
                <sphereGeometry args={[0.045, 24, 16]} />
                <meshStandardMaterial
                  color={o.color}
                  emissive={o.color}
                  emissiveIntensity={0.35}
                  roughness={0.35}
                />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

interface OrbitState {
  az: number;
  el: number;
  dist: number;
  dragging: boolean;
  auto: boolean;
}

function CameraRig({ orbit }: { orbit: React.RefObject<OrbitState> }) {
  useFrame((state, dt) => {
    const c = orbit.current;
    if (c.auto && !c.dragging) c.az += dt * 0.06;
    state.camera.position.set(
      Math.sin(c.az) * Math.cos(c.el) * c.dist,
      Math.sin(c.el) * c.dist,
      Math.cos(c.az) * Math.cos(c.el) * c.dist,
    );
    state.camera.lookAt(0, 0.18, 0);
  });
  return null;
}

export default function DescentRaceScene({
  surface,
  runs,
  step,
  onPlace,
}: {
  surface: Surface3;
  runs: Record<OptimizerKey, Run3>;
  step: number;
  onPlace: (p: [number, number]) => void;
}) {
  const map = useMemo(() => buildMapping(surface), [surface]);
  const orbit = useRef<OrbitState>({ az: 0.78, el: 0.62, dist: 3.9, dragging: false, auto: true });
  const last = useRef({ x: 0, y: 0 });

  return (
    <div
      className="h-[340px] w-full cursor-grab active:cursor-grabbing md:h-[400px]"
      style={{ touchAction: "pan-y" }}
      onPointerDown={(e) => {
        orbit.current.dragging = true;
        orbit.current.auto = false;
        last.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerMove={(e) => {
        if (!orbit.current.dragging) return;
        const c = orbit.current;
        c.az -= (e.clientX - last.current.x) * 0.006;
        c.el = Math.min(1.25, Math.max(0.14, c.el + (e.clientY - last.current.y) * 0.005));
        last.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerUp={() => (orbit.current.dragging = false)}
      onPointerLeave={() => (orbit.current.dragging = false)}
    >
      <Canvas dpr={[1, 2]} gl={{ antialias: true, alpha: true }} camera={{ fov: 40 }}>
        <ambientLight intensity={0.9} />
        <directionalLight position={[3, 5, 2]} intensity={1.1} />
        <CameraRig orbit={orbit} />
        <SurfaceMesh s={surface} map={map} onPlace={onPlace} />
        <Racers runs={runs} map={map} step={step} />
      </Canvas>
    </div>
  );
}
