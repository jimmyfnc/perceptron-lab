import { useEffect, useRef, useState } from "react";
import { MUSHROOM, makePhoto, scale, type ResampleMethod, type Rgba } from "@/lib/resample";
import { InstrumentPanel } from "@/components/site/InstrumentPanel";

const OUT = 176; // upscaled size (16 → 176, 11×)
const METHODS: { key: ResampleMethod; name: string; note: string }[] = [
  {
    key: "nearest",
    name: "nearest",
    note: "copies the single closest pixel — edges stay knife-sharp",
  },
  {
    key: "bilinear",
    name: "bilinear",
    note: "averages the 4 surrounding pixels — smooth, but edges smear",
  },
  {
    key: "bicubic",
    name: "bicubic",
    note: "cubic fit over 16 pixels — smooth transitions, possible halos at edges",
  },
];

function Raster({ img, size, label }: { img: Rgba; size: number; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d")!;
    const pixels = new Uint8ClampedArray(img.data);
    ctx.putImageData(new ImageData(pixels, img.width, img.height), 0, 0);
  }, [img]);
  // crisp CSS upscale so what we computed is exactly what's shown
  return (
    <canvas
      ref={ref}
      role="img"
      aria-label={label}
      style={{ width: size, height: size, imageRendering: "pixelated" }}
      className="block border border-border"
    />
  );
}

export function ScalingComparison() {
  const [source, setSource] = useState<"sprite" | "photo">("sprite");
  const src = source === "sprite" ? MUSHROOM : makePhoto(16);

  return (
    <InstrumentPanel
      label="Resampling bench — one source, three interpolators"
      readout={`16×16 → ${OUT}×${OUT}`}
    >
      <div className="flex flex-wrap items-end justify-center gap-5">
        <figure className="text-center">
          <Raster
            img={src}
            size={64}
            label={`Original 16 by 16 ${source === "sprite" ? "pixel-art mushroom" : "smooth gradient"}`}
          />
          <figcaption className="label-tech mt-2">source · 16×16</figcaption>
        </figure>
        <span aria-hidden className="readout pb-10 text-xl text-muted-foreground">
          -&gt;
        </span>
        {METHODS.map((m) => (
          <figure key={m.key} className="text-center">
            <Raster
              img={scale(src, OUT, OUT, m.key)}
              size={OUT}
              label={`${source === "sprite" ? "Pixel-art mushroom" : "Smooth gradient"} enlarged with ${m.name}: ${m.note}`}
            />
            <figcaption className="label-tech mt-2">{m.name}</figcaption>
          </figure>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
        <button
          className="btn-tech"
          data-active={source === "sprite"}
          aria-pressed={source === "sprite"}
          onClick={() => setSource("sprite")}
        >
          pixel art
        </button>
        <button
          className="btn-tech"
          data-active={source === "photo"}
          aria-pressed={source === "photo"}
          onClick={() => setSource("photo")}
        >
          smooth gradient
        </button>
      </div>
      <p className="label-tech mt-3 text-center normal-case tracking-normal">
        {source === "sprite"
          ? "flat fills + hard edges: nearest wins, the interpolators turn ink into mush"
          : "smooth content: now the interpolators win — nearest shows blocky banding"}
      </p>
    </InstrumentPanel>
  );
}
