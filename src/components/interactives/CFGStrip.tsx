/**
 * The prompt's volume knob: the same seed and prompt sampled at four
 * guidance scales. Frames from scripts/generate_diffusion_frames.py.
 */
import { useState } from "react";
import { InstrumentPanel } from "@/components/site/InstrumentPanel";

const CFGS = [
  { g: "1", note: "guidance off — the model free-associates" },
  { g: "4", note: "gentle pull toward the prompt" },
  { g: "7.5", note: "the everyday default" },
  { g: "12", note: "overdriven — contrast burns, variety dies" },
];

export function CFGStrip() {
  const [sel, setSel] = useState(2);
  return (
    <InstrumentPanel
      label="Classifier-free guidance — one knob, same noise"
      readout={`cfg ${CFGS[sel].g}`}
    >
      <div className="flex flex-wrap items-start justify-center gap-3">
        {CFGS.map((c, i) => (
          <button
            key={c.g}
            className="block border p-0"
            onClick={() => setSel(i)}
            style={{ borderColor: i === sel ? "var(--station)" : "var(--color-border)" }}
          >
            <img
              src={`/data/diffusion/cfg/cfg${c.g}.webp`}
              alt={`cfg ${c.g}`}
              width={150}
              height={150}
              className="block"
              draggable={false}
            />
            <span className="readout block py-1 text-center text-[11px] text-muted-foreground">
              cfg {c.g}
            </span>
          </button>
        ))}
      </div>
      <p className="label-tech mt-3 text-center normal-case tracking-normal">{CFGS[sel].note}</p>
    </InstrumentPanel>
  );
}
