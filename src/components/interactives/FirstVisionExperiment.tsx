import { useState } from "react";
import { Link } from "@tanstack/react-router";
import type { Grid } from "@/lib/conv";
import { edgeStrength, visionScene, type EdgeDirection, type VisionScene } from "@/lib/firstVision";

const DIRECTIONS: { value: EdgeDirection; label: string }[] = [
  { value: "vertical", label: "Vertical" },
  { value: "horizontal", label: "Horizontal" },
  { value: "both", label: "Both" },
];

function PixelPicture({
  pixels,
  label,
  inset = 0,
}: {
  pixels: Grid;
  label: string;
  inset?: number;
}) {
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox="0 0 12 12"
      className="aspect-square w-full border border-border bg-background text-foreground"
      shapeRendering="crispEdges"
    >
      {pixels.flatMap((row, y) =>
        row.map((value, x) => (
          <rect
            key={`${x}-${y}`}
            x={x + inset}
            y={y + inset}
            width={1}
            height={1}
            fill="currentColor"
            opacity={value}
          />
        )),
      )}
    </svg>
  );
}

/** A small, deterministic experiment using the same convolution math as the full lab. */
export function FirstVisionExperiment() {
  const [direction, setDirection] = useState<EdgeDirection>("vertical");
  const [scene, setScene] = useState<VisionScene>("square");
  const [offset, setOffset] = useState(0);
  const [answer, setAnswer] = useState<"bright" | "change" | null>(null);
  const input = visionScene(scene, offset);
  const output = edgeStrength(input, direction);
  const position = offset < 0 ? "left of center" : offset > 0 ? "right of center" : "in the center";
  const observation =
    scene === "solid"
      ? "The result is dark. This image is bright everywhere, but there is no change in brightness inside it to detect."
      : direction === "vertical"
        ? `The left and right sides of the square light up. The middle stays dark. The detected edges are ${position}, following the square.`
        : direction === "horizontal"
          ? `The top and bottom of the square light up. The middle stays dark. The detected edges are ${position}, following the square.`
          : `All four sides light up, tracing the square’s outline ${position}. The middle still stays dark.`;

  return (
    <div className="panel panel-ticks overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3">
        <h2 id="first-vision-title" className="font-display text-lg font-semibold">
          Your experiment: find the edges
        </h2>
        <span className="label-tech text-station">no math or coding needed</span>
      </div>
      <div className="p-5 md:p-8">
        <p className="prose-lab max-w-3xl">
          A digital picture is made of tiny colored squares called <strong>pixels</strong>. Here we
          use just light and dark pixels. An <strong>edge</strong> is a place where brightness
          changes, like the boundary between this light square and its dark background.
        </p>
        <div className="mt-6 grid items-start gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div className="min-w-0">
            <fieldset>
              <legend className="font-display text-lg font-semibold">
                1. Choose which edges to find
              </legend>
              <p className="prose-lab mt-2">
                Try vertical, then horizontal. Which sides of the square light up?
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {DIRECTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className="btn-tech"
                    aria-pressed={direction === option.value}
                    onClick={() => setDirection(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-5">
              <figure>
                <figcaption className="mb-2 font-display font-semibold">
                  Original picture
                </figcaption>
                <PixelPicture
                  pixels={input}
                  label={
                    scene === "solid"
                      ? "A uniformly bright image."
                      : `A light square ${position} on a dark background.`
                  }
                />
              </figure>
              <figure>
                <figcaption className="mb-2 font-display font-semibold">Edges found</figcaption>
                <PixelPicture pixels={output} label={observation} inset={1} />
              </figure>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Brighter means a stronger edge response. The result shows the inner area we scanned.
            </p>
            <p role="status" className="prose-lab mt-4 min-h-24 border-l-2 border-station pl-4">
              {observation}
            </p>
            <fieldset className="mt-5">
              <legend className="font-display text-lg font-semibold">2. Change the picture</legend>
              <p className="prose-lab mt-2">
                Will a solid bright image produce more edges? Predict, then try it.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-tech"
                  aria-pressed={scene === "square"}
                  onClick={() => setScene("square")}
                >
                  Square
                </button>
                <button
                  type="button"
                  className="btn-tech"
                  aria-pressed={scene === "solid"}
                  onClick={() => setScene("solid")}
                >
                  Solid bright image
                </button>
              </div>
            </fieldset>
            <label htmlFor="vision-position" className="mt-5 block font-display font-semibold">
              Move the square
            </label>
            <input
              id="vision-position"
              type="range"
              min={-2}
              max={2}
              step={1}
              value={offset}
              disabled={scene === "solid"}
              aria-valuetext={position}
              aria-describedby="vision-position-hint"
              className="mt-1 h-11 w-full accent-station disabled:opacity-40"
              onChange={(event) => setOffset(Number(event.target.value))}
            />
            <p id="vision-position-hint" className="text-sm text-muted-foreground">
              {scene === "solid"
                ? "Choose Square to try moving it again."
                : "Move it left or right. The same detector finds the edges in each new position."}
            </p>
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-xl font-semibold">
              What is the computer looking for?
            </h3>
            <div className="prose-lab mt-3">
              <p>
                It compares nearby pixels. To find a vertical edge, it looks for a difference
                between the left and right. For a horizontal edge, it compares above and below.
              </p>
              <p>
                This little pattern detector is called a <strong>filter</strong>. Repeating its
                calculation across the picture is the idea behind <strong>convolution</strong>.
              </p>
              <p>
                The result is a new picture showing where the filter responded, called a{" "}
                <strong>feature map</strong>. It highlights a useful pattern rather than naming the
                object.
              </p>
            </div>
            <div className="mt-6 border-t border-border pt-5">
              <h3 className="font-display text-xl font-semibold">Try to catch it out</h3>
              <p className="prose-lab mt-3">
                Choose <strong>Solid bright image</strong>. It has more bright pixels than the
                square. Before you try, predict: will that produce more edges?
              </p>
              <p className="prose-lab mt-3">
                Then switch back to <strong>Square</strong> and move it. You changed the picture’s
                position, but the detector’s rule stayed the same.
              </p>
            </div>
          </div>
        </div>
        <fieldset className="mt-8 border-t border-border pt-6">
          <legend className="font-display text-xl font-semibold">3. Check your intuition</legend>
          <p className="prose-lab mt-2">What makes an edge detector respond strongly?</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              className="btn-tech normal-case"
              aria-pressed={answer === "bright"}
              onClick={() => setAnswer("bright")}
            >
              Lots of bright pixels
            </button>
            <button
              type="button"
              className="btn-tech normal-case"
              aria-pressed={answer === "change"}
              onClick={() => setAnswer("change")}
            >
              A change between nearby pixels
            </button>
          </div>
          <p role="status" className="prose-lab mt-4 min-h-14">
            {answer === "change"
              ? "Exactly. The change in brightness is the clue. A uniformly bright area gives these filters nothing to pick out."
              : answer === "bright"
                ? "Try the solid bright image above. It is bright everywhere, yet the result is dark. The detector needs a change between nearby pixels."
                : "Choose an answer. You can keep experimenting before you decide."}
          </p>
        </fieldset>
        <div className="mt-6 border-t border-border pt-6">
          <h3 className="font-display text-xl font-semibold">You now have the starting idea</h3>
          <p className="prose-lab mt-3 max-w-3xl">
            Pixels make a picture. Filters look for patterns. Feature maps show where those patterns
            appear. Finding edges is one small step toward recognizing something in an image.
          </p>
          <Link
            to="/"
            hash="explore"
            className="mt-4 inline-flex min-h-11 items-center text-station underline underline-offset-4"
          >
            Choose another question to explore →
          </Link>
        </div>
      </div>
    </div>
  );
}
