/**
 * The 3D half of the forward-pass figure — everything that touches three.js
 * lives here so the chunk (three + r3f) lazy-loads with the figure.
 * Default export for React.lazy. Shared by the full lab on the Neural
 * Networks page ("lab") and the homepage hero ("hero").
 *
 * The scene never owns the network: it reads the mutable net + input refs
 * every frame, so training (driven by the parent) shows up as it happens.
 */
import { Canvas, useFrame, type RootState } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import {
  IDLE_COLOR,
  LAYERS,
  NEG_COLOR,
  POS_COLOR,
  forward,
  type ForwardNet,
} from "@/lib/forwardnet";

export interface NeuronRef {
  /** layer index, 0 = inputs */
  l: number;
  /** neuron index within the layer */
  j: number;
}

/** Neuron positions, one row per layer. Layers march along +x; the hidden
    layers spread into y and z so rotating the scene actually reveals depth. */
const LAYOUT: [number, number, number][][] = [
  [
    [-3, 0.85, 0],
    [-3, -0.85, 0],
  ],
  [
    [-1, 0.95, 0.95],
    [-1, 0.95, -0.95],
    [-1, -0.95, 0.95],
    [-1, -0.95, -0.95],
  ],
  [
    [1, 1.3, 0],
    [1, 0, 1.3],
    [1, -1.3, 0],
    [1, 0, -1.3],
  ],
  [[3, 0, 0]],
];

const TAGS: { text: string; at: [number, number, number] }[] = [
  { text: "inputs", at: [-3, 1.75, 0] },
  { text: "hidden 1", at: [-1, 1.95, 0] },
  { text: "hidden 2", at: [1, 2.05, 0] },
  { text: "output", at: [3, 0.95, 0] },
];

const POS = new THREE.Color(POS_COLOR);
const NEG = new THREE.Color(NEG_COLOR);
const IDLE = new THREE.Color(IDLE_COLOR);
const UP = new THREE.Vector3(0, 1, 0);

interface Node {
  pos: THREE.Vector3;
  core: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;
  glow: THREE.Sprite;
  /** eased display value in [-1, 1] */
  shown: number;
}

interface Conn {
  l: number;
  j: number;
  i: number;
  from: THREE.Vector3;
  to: THREE.Vector3;
  len: number;
  mesh: THREE.Mesh<THREE.CylinderGeometry, THREE.MeshBasicMaterial>;
  pulses: [THREE.Sprite, THREE.Sprite];
  jitter: number;
  /** eased display weight, so a re-roll morphs instead of snapping */
  shownW: number;
}

function glowTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.25, "rgba(255,255,255,0.55)");
  grad.addColorStop(0.6, "rgba(255,255,255,0.12)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function buildRig() {
  const group = new THREE.Group();
  const tex = glowTexture();
  const sphereGeo = new THREE.SphereGeometry(0.2, 28, 18);
  const pickGeo = new THREE.SphereGeometry(0.46, 10, 8);
  const cylGeo = new THREE.CylinderGeometry(1, 1, 1, 6, 1, true);
  const materials: THREE.Material[] = [];
  const track = <M extends THREE.Material>(m: M): M => {
    materials.push(m);
    return m;
  };
  const glowSprite = () =>
    new THREE.Sprite(
      track(
        new THREE.SpriteMaterial({
          map: tex,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          transparent: true,
          opacity: 0,
        }),
      ),
    );

  const picks: THREE.Mesh[] = [];
  const nodes: Node[][] = LAYOUT.map((layer, l) =>
    layer.map((p, j) => {
      const pos = new THREE.Vector3(...p);
      const core = new THREE.Mesh(
        sphereGeo,
        track(new THREE.MeshBasicMaterial({ color: IDLE.clone() })),
      );
      core.position.copy(pos);
      const glow = glowSprite();
      glow.position.copy(pos);
      // generous invisible hit target — a 0.2 sphere is a hard tap on a phone
      const pick = new THREE.Mesh(
        pickGeo,
        track(new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })),
      );
      pick.position.copy(pos);
      pick.userData = { l, j } satisfies NeuronRef;
      group.add(core, glow, pick);
      picks.push(pick);
      return { pos, core, glow, shown: 0 };
    }),
  );

  const conns: Conn[] = [];
  for (let l = 0; l < LAYERS.length - 1; l++) {
    for (let j = 0; j < LAYERS[l + 1]; j++) {
      for (let i = 0; i < LAYERS[l]; i++) {
        const from = nodes[l][i].pos;
        const to = nodes[l + 1][j].pos;
        const dir = new THREE.Vector3().subVectors(to, from);
        const len = dir.length();
        const mesh = new THREE.Mesh(
          cylGeo,
          track(
            new THREE.MeshBasicMaterial({
              blending: THREE.AdditiveBlending,
              transparent: true,
              depthWrite: false,
              opacity: 0.2,
            }),
          ),
        );
        mesh.position.copy(from).add(to).multiplyScalar(0.5);
        mesh.quaternion.setFromUnitVectors(UP, dir.normalize());
        const pulses: [THREE.Sprite, THREE.Sprite] = [glowSprite(), glowSprite()];
        group.add(mesh, pulses[0], pulses[1]);
        conns.push({
          l,
          j,
          i,
          from,
          to,
          len,
          mesh,
          pulses,
          jitter: (conns.length * 0.618) % 1,
          shownW: 0,
        });
      }
    }
  }

  const dispose = () => {
    tex.dispose();
    sphereGeo.dispose();
    pickGeo.dispose();
    cylGeo.dispose();
    materials.forEach((m) => m.dispose());
  };
  return { group, nodes, conns, picks, dispose };
}

type Rig = ReturnType<typeof buildRig>;

interface Orbit {
  yaw: number;
  pitch: number;
  /** 1 = idle sway at full strength, eases to 0 while someone is steering */
  sway: number;
  dragging: boolean;
  lastTouch: number;
}

interface Pin {
  el: HTMLDivElement | null;
  at: THREE.Vector3;
  /** px offset below the anchor; 0 = centered on it */
  drop: number;
}

interface LiveProps {
  stepLayer: number | null;
  selected: NeuronRef | null;
  hero: boolean;
  reduce: boolean;
}

function tint(color: THREE.Color, v: number) {
  color.copy(IDLE).lerp(v >= 0 ? POS : NEG, Math.min(1, Math.abs(v)));
}

function Network({
  rig,
  net,
  input,
  orbit,
  live,
  pins,
  chips,
}: {
  rig: Rig;
  net: RefObject<ForwardNet>;
  input: RefObject<[number, number]>;
  orbit: RefObject<Orbit>;
  live: RefObject<LiveProps>;
  pins: RefObject<Pin[]>;
  chips: RefObject<(HTMLDivElement | null)[]>;
}) {
  const clock = useRef(0);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, rawDt) => {
    const dt = Math.min(0.05, rawDt);
    const { stepLayer, selected, hero, reduce } = live.current;
    if (!reduce) clock.current += dt;
    const t = clock.current;
    const n = net.current;
    const x = input.current;
    const pass = forward(n, x);
    const out = pass.acts[LAYERS.length - 1][0];
    const ease = reduce ? 1 : 1 - Math.pow(0.0001, dt); // frame-rate independent

    // camera: back off until the whole network fits this aspect ratio
    const cam = state.camera as THREE.PerspectiveCamera;
    const tan = Math.tan((cam.fov * Math.PI) / 360);
    const aspect = state.size.width / Math.max(1, state.size.height);
    cam.position.set(0, 0, Math.max(2.6 / tan, 3.9 / (tan * aspect)));

    // neurons
    for (let l = 0; l < rig.nodes.length; l++) {
      for (let j = 0; j < rig.nodes[l].length; j++) {
        const node = rig.nodes[l][j];
        const lit = stepLayer === null || l <= stepLayer;
        // the output is a 0..1 answer; recentre it so 1 reads amber, 0 cyan
        const target = lit ? (l === LAYERS.length - 1 ? out * 2 - 1 : pass.acts[l][j]) : 0;
        node.shown += (target - node.shown) * ease;
        const mag = Math.min(1, Math.abs(node.shown));
        tint(node.core.material.color, node.shown * 1.15);
        node.glow.material.color.copy(node.shown >= 0 ? POS : NEG);
        const isSel = selected !== null && selected.l === l && selected.j === j;
        const beat = isSel ? 0.25 + 0.1 * Math.sin(t * 5) : 0;
        node.glow.material.opacity = lit ? 0.12 + 0.7 * mag + beat : 0.03;
        const gs = 0.7 + 1.5 * mag + (isSel ? 0.5 : 0);
        node.glow.scale.set(gs, gs, 1);
        node.core.scale.setScalar(isSel ? 1.25 : 1);
      }
    }

    // connections + the pulses travelling along them
    for (const c of rig.conns) {
      c.shownW += (n.W[c.l][c.j][c.i] - c.shownW) * ease;
      const w = c.shownW;
      const wm = Math.min(1, Math.abs(w) / 2.4);
      const rad = 0.008 + 0.034 * wm;
      c.mesh.scale.set(rad, c.len, rad);
      c.mesh.material.color.copy(w >= 0 ? POS : NEG);
      let vis = 1;
      if (stepLayer !== null) vis = c.l + 1 > stepLayer ? 0.07 : c.l + 1 === stepLayer ? 1 : 0.3;
      else if (selected) vis = selected.l === c.l + 1 && selected.j === c.j ? 1.25 : 0.14;
      c.mesh.material.opacity = (0.1 + 0.5 * wm) * vis;

      // signal carried = sending neuron's value × the weight
      const sig = rig.nodes[c.l][c.i].shown * w;
      const sm = Math.min(1, Math.abs(sig) / 1.2);
      for (let q = 0; q < 2; q++) {
        const sp = c.pulses[q];
        const phase = reduce
          ? 0.5
          : (((t * 0.5 - c.l * 0.3 + q * 0.5 + c.jitter * 0.12) % 1) + 1) % 1;
        const show = vis >= 0.9 && sm > 0.04 && !(reduce && q === 1);
        sp.visible = show;
        if (!show) continue;
        sp.position.lerpVectors(c.from, c.to, phase);
        sp.material.color.copy(sig >= 0 ? POS : NEG);
        sp.material.opacity = sm * Math.sin(Math.PI * phase) * 0.95;
        const ss = 0.16 + 0.34 * sm;
        sp.scale.set(ss, ss, 1);
      }
    }

    // gentle sway until someone grabs it
    const o = orbit.current;
    const idle = !o.dragging && performance.now() - o.lastTouch > 3000 && !reduce;
    o.sway += ((idle ? 1 : 0) - o.sway) * Math.min(1, dt * 2.5);
    const swing = hero ? 0.5 : 0.38;
    rig.group.rotation.y = o.yaw + Math.sin(t * 0.32) * swing * o.sway;
    rig.group.rotation.x = o.pitch + Math.sin(t * 0.21) * 0.06 * o.sway;
    rig.group.updateMatrixWorld();

    // HTML labels pinned to 3D points
    const [c1, c2, c3] = chips.current;
    if (c1) c1.textContent = `x₁ ${fmt(x[0])}`;
    if (c2) c2.textContent = `x₂ ${fmt(x[1])}`;
    if (c3) c3.textContent = `answer ${out.toFixed(2)}`;
    for (const pin of pins.current) {
      if (!pin.el) continue;
      tmp.copy(pin.at).applyMatrix4(rig.group.matrixWorld).project(cam);
      let sx = ((tmp.x + 1) / 2) * state.size.width;
      // value chips stay fully inside the frame on narrow screens
      if (pin.drop) sx = Math.max(40, Math.min(state.size.width - 52, sx));
      const sy = ((1 - tmp.y) / 2) * state.size.height;
      pin.el.style.transform = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px) translate(-50%, ${
        pin.drop ? `${pin.drop}px` : "-50%"
      })`;
    }
  });

  return <primitive object={rig.group} />;
}

const fmt = (v: number) => (v < 0 ? "−" : "") + Math.abs(v).toFixed(2);

export default function ForwardPassScene({
  net,
  input,
  mode = "lab",
  active = true,
  stepLayer = null,
  selected = null,
  onSelect,
  className,
}: {
  net: RefObject<ForwardNet>;
  input: RefObject<[number, number]>;
  mode?: "lab" | "hero";
  /** false pauses the render loop (figure scrolled off screen) */
  active?: boolean;
  /** walk-through position: layers past it go dark. null = everything live */
  stepLayer?: number | null;
  selected?: NeuronRef | null;
  /** tap on a neuron (or on empty space → null). Lab mode only. */
  onSelect?: (n: NeuronRef | null) => void;
  className?: string;
}) {
  const hero = mode === "hero";
  const rig = useMemo(buildRig, []);
  useEffect(() => () => rig.dispose(), [rig]);

  const orbit = useRef<Orbit>({
    yaw: -0.5,
    pitch: 0.2,
    sway: 1,
    dragging: false,
    lastTouch: -1e9,
  });
  const live = useRef<LiveProps>({ stepLayer, selected, hero, reduce: false });
  live.current.stepLayer = stepLayer;
  live.current.selected = selected;
  live.current.hero = hero;
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => (live.current.reduce = mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const pins = useRef<Pin[]>([
    ...TAGS.map((t) => ({ el: null, at: new THREE.Vector3(...t.at), drop: 0 })),
    { el: null, at: rig.nodes[0][0].pos, drop: 20 },
    { el: null, at: rig.nodes[0][1].pos, drop: 20 },
    { el: null, at: rig.nodes[3][0].pos, drop: 20 },
  ]);
  const chips = useRef<(HTMLDivElement | null)[]>([null, null, null]);

  const three = useRef<RootState | null>(null);
  const down = useRef<{ x: number; y: number; sx: number; sy: number; moved: boolean } | null>(
    null,
  );
  const raycaster = useMemo(() => new THREE.Raycaster(), []);

  const release = () => {
    down.current = null;
    orbit.current.dragging = false;
    orbit.current.lastTouch = performance.now();
  };

  return (
    <div
      className={`relative w-full select-none overflow-hidden ${
        hero ? "pointer-events-none" : "cursor-grab active:cursor-grabbing"
      } ${className ?? ""}`}
      // pan-y: a vertical swipe still scrolls the page; horizontal drags orbit
      style={{ touchAction: "pan-y" }}
      onPointerDown={(e) => {
        if (hero) return;
        down.current = {
          x: e.clientX,
          y: e.clientY,
          sx: e.clientX,
          sy: e.clientY,
          moved: false,
        };
        orbit.current.dragging = true;
      }}
      onPointerMove={(e) => {
        const d = down.current;
        if (!d) return;
        if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 6) d.moved = true;
        const o = orbit.current;
        o.yaw += (e.clientX - d.x) * 0.008;
        o.pitch = Math.max(-1.1, Math.min(1.1, o.pitch + (e.clientY - d.y) * 0.006));
        d.x = e.clientX;
        d.y = e.clientY;
        o.lastTouch = performance.now();
      }}
      onPointerUp={(e) => {
        const d = down.current;
        const s = three.current;
        if (d && !d.moved && s && onSelect) {
          // it was a tap, not an orbit drag
          const r = s.gl.domElement.getBoundingClientRect();
          const ndc = new THREE.Vector2(
            ((e.clientX - r.left) / r.width) * 2 - 1,
            -((e.clientY - r.top) / r.height) * 2 + 1,
          );
          raycaster.setFromCamera(ndc, s.camera);
          const hit = raycaster.intersectObjects(rig.picks)[0];
          onSelect(hit ? (hit.object.userData as NeuronRef) : null);
        }
        release();
      }}
      onPointerLeave={release}
      onPointerCancel={release}
    >
      <Canvas
        flat
        dpr={[1, 2]}
        frameloop={active ? "always" : "never"}
        gl={{ antialias: true, alpha: true }}
        camera={{ fov: 42, position: [0, 0, 10] }}
        onCreated={(s) => {
          three.current = s;
        }}
        style={{ position: "absolute", inset: 0 }}
      >
        <Network
          rig={rig}
          net={net}
          input={input}
          orbit={orbit}
          live={live}
          pins={pins}
          chips={chips}
        />
      </Canvas>

      {!hero && (
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {TAGS.map((t, k) => (
            <div
              key={t.text}
              ref={(el) => {
                pins.current[k].el = el;
              }}
              className="label-tech absolute left-0 top-0 whitespace-nowrap will-change-transform"
            >
              {t.text}
            </div>
          ))}
          {[0, 1, 2].map((k) => (
            <div
              key={k}
              ref={(el) => {
                pins.current[TAGS.length + k].el = el;
                chips.current[k] = el;
              }}
              className="readout absolute left-0 top-0 whitespace-nowrap border border-border bg-background/75 px-1.5 py-0.5 text-[11px] will-change-transform"
            />
          ))}
        </div>
      )}
    </div>
  );
}
