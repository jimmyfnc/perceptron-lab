/**
 * A walk through latent space: nine full sampling runs whose starting
 * noises are slerped between seed A and seed B. Every point in between
 * is a coherent image — that's the property the figure exists to show.
 */
import { useEffect, useState } from "react";
import { InstrumentPanel } from "@/components/site/InstrumentPanel";

const N = 9;

export function LatentWalk() {
  const [i, setI] = useState(0);

  useEffect(() => {
    for (let k = 0; k < N; k++) new Image().src = `/data/diffusion/walk/${k}.webp`;
  }, []);

  return (
    <InstrumentPanel
      label="Latent walk — between two seeds, everything is still a place"
      readout={`position ${i} / ${N - 1}`}
    >
      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
        <img
          src={`/data/diffusion/walk/${i}.webp`}
          alt={`latent walk position ${i}`}
          width={280}
          height={280}
          className="block border border-border"
          draggable={false}
        />
        <div className="w-[250px] max-w-full">
          <label className="label-tech block">
            seed a ↔ seed b
            <input
              type="range"
              min={0}
              max={N - 1}
              value={i}
              onChange={(e) => setI(Number(e.target.value))}
              className="mt-2 block w-full"
              style={{ accentColor: "var(--station)" }}
            />
          </label>
          <div className="mt-3 grid grid-cols-9 gap-1">
            {Array.from({ length: N }, (_, k) => (
              <button
                key={k}
                className="block border p-0"
                onClick={() => setI(k)}
                style={{ borderColor: k === i ? "var(--station)" : "var(--color-border)" }}
              >
                <img
                  src={`/data/diffusion/walk/${k}.webp`}
                  alt={`position ${k}`}
                  width={24}
                  height={24}
                  className="block"
                  draggable={false}
                />
              </button>
            ))}
          </div>
          <p className="label-tech mt-3 normal-case tracking-normal">
            the starting noises are interpolated (slerp), then each point is sampled fully — no
            crossfade anywhere, every frame is its own run
          </p>
        </div>
      </div>
    </InstrumentPanel>
  );
}
