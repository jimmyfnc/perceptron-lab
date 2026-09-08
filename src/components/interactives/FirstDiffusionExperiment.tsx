import { useState } from "react";
import { Link } from "@tanstack/react-router";

const LAST_STEP = 20;

function describeFrame(step: number) {
  if (step === 0) return "A field of colored static. There is no recognizable lighthouse yet.";
  if (step < 15)
    return "The image is still very noisy. Colors and shapes change as the model works.";
  if (step < LAST_STEP)
    return "The lighthouse and landscape become easier to recognize as noise is removed.";
  return "A lighthouse, a rocky coast, and a sunset sky. This is the finished image for this run.";
}

/** A guided replay of the existing SD1.5 recordings, with no technical prerequisites. */
export function FirstDiffusionExperiment() {
  const [step, setStep] = useState(0);
  const [seed, setSeed] = useState(0);
  const [answer, setAnswer] = useState<"same" | "different" | null>(null);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const description = describeFrame(step);

  return (
    <div className="panel panel-ticks overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3">
        <h2 id="first-experiment-title" className="font-display text-lg font-semibold">
          Your first experiment: from noise to a lighthouse
        </h2>
        <span className="label-tech text-station">no math or coding needed</span>
      </div>
      <div className="grid items-start gap-x-8 gap-y-6 p-5 md:grid-cols-2 md:p-8">
        <div className="min-w-0 md:col-start-2 md:row-start-1">
          <p className="label-tech text-station">01 · Give it a description</p>
          <p className="prose-lab mt-2">
            We asked an AI image model—a program trained on examples—to make this:
          </p>
          <blockquote className="mt-3 border-l-2 border-station pl-4 font-body text-lg italic leading-relaxed">
            “A lighthouse on a rocky cliff at dusk, dramatic golden clouds, crashing waves, oil
            painting.”
          </blockquote>
          <p className="prose-lab mt-2">
            That written request is called a <strong>prompt</strong>.
          </p>
          <p className="prose-lab mt-3">
            <strong>Before you try:</strong> will the picture appear all at once? Move the slider or
            choose a stage to find out.
          </p>
        </div>
        <div className="min-w-0 md:col-start-1 md:row-span-2 md:row-start-1">
          <figure>
            <div className="relative mx-auto aspect-square w-full max-w-[384px] border border-border bg-background">
              <img
                key={`${seed}-${step}-${retry}`}
                src={`/data/diffusion/seed${seed}/step${step}.webp`}
                alt={`Starting noise ${seed === 0 ? "A" : "B"}, step ${step} of ${LAST_STEP}. ${description}`}
                width={384}
                height={384}
                className="h-full w-full object-contain"
                onLoad={() => setFailed(false)}
                onError={() => setFailed(true)}
              />
              {failed && (
                <div
                  role="alert"
                  className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-card p-6 text-center"
                >
                  <p className="prose-lab">
                    This image couldn’t load. You can retry or keep reading the description below.
                  </p>
                  <button
                    className="btn-tech"
                    onClick={() => {
                      setFailed(false);
                      setRetry((n) => n + 1);
                    }}
                  >
                    Retry image
                  </button>
                </div>
              )}
            </div>
            <figcaption className="mt-3 flex items-center justify-between gap-3 font-mono text-xs text-muted-foreground">
              <span>Starting noise {seed === 0 ? "A" : "B"}</span>
              <span>
                Step {step} of {LAST_STEP}
              </span>
            </figcaption>
          </figure>
          <label htmlFor="first-diffusion-step" className="mt-5 block font-display font-semibold">
            Move from noise to image
          </label>
          <input
            id="first-diffusion-step"
            type="range"
            min={0}
            max={LAST_STEP}
            value={step}
            aria-valuetext={`Step ${step} of ${LAST_STEP}. ${description}`}
            aria-describedby="first-diffusion-help"
            className="block min-h-11 w-full accent-station"
            onChange={(event) => setStep(Number(event.target.value))}
          />
          <div className="flex flex-wrap gap-2" aria-label="Jump to a stage">
            {[
              { step: 0, label: "Start" },
              { step: 10, label: "Halfway" },
              { step: 20, label: "Finished image" },
            ].map((stage) => (
              <button
                key={stage.step}
                className="btn-tech"
                aria-pressed={step === stage.step}
                onClick={() => setStep(stage.step)}
              >
                {stage.label}
              </button>
            ))}
          </div>
          <p id="first-diffusion-help" className="mt-3 text-sm text-muted-foreground">
            Drag the slider, use its arrow keys, or choose a stage above.
          </p>
          <p className="mt-5 font-display font-semibold">Compare finished images</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {[0, 1].map((choice) => (
              <button
                key={choice}
                className="btn-tech"
                aria-pressed={seed === choice}
                aria-label={`Starting noise ${choice === 0 ? "A" : "B"}`}
                onClick={() => {
                  setSeed(choice);
                  setStep(LAST_STEP);
                }}
              >
                Noise {choice === 0 ? "A" : "B"}
              </button>
            ))}
          </div>
          <p className="prose-lab mt-4 min-h-[5.25rem]" aria-live="polite" aria-atomic="true">
            {description}
          </p>
        </div>
        <div className="min-w-0 space-y-6 md:col-start-2 md:row-start-2">
          <div>
            <p className="label-tech text-station">02 · Watch it take shape</p>
            <p className="prose-lab mt-2">
              Move from Start to Finished image. The model begins with random static, called{" "}
              <strong>noise</strong>, and removes it over several steps, guided by the prompt. This
              process is called <strong>denoising</strong>.
            </p>
          </div>
          <div>
            <p className="label-tech text-station">03 · Change the starting point</p>
            <p className="prose-lab mt-2">
              Keep the same prompt and model, but start with different noise. Predict what will
              change, then compare these two finished images.
            </p>
          </div>
          <p className="border-t border-border pt-4 text-sm leading-relaxed text-muted-foreground">
            You’re replaying images recorded from real Stable Diffusion 1.5 runs. Moving the slider
            reveals saved steps; it doesn’t generate a new image on your device.
          </p>
        </div>
      </div>
      <div className="border-t border-border bg-station-faint p-5 md:p-8">
        <fieldset>
          <legend className="font-display text-xl font-semibold">
            Quick check: does the same prompt always produce the same image?
          </legend>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              className="btn-tech"
              aria-pressed={answer === "same"}
              onClick={() => setAnswer("same")}
            >
              Yes, the words decide everything
            </button>
            <button
              className="btn-tech"
              aria-pressed={answer === "different"}
              onClick={() => setAnswer("different")}
            >
              No, the starting noise matters too
            </button>
          </div>
        </fieldset>
        <div className="prose-lab mt-4" aria-live="polite" aria-atomic="true">
          {answer === "same" && (
            <p>
              <strong>Try comparing A and B above.</strong> Both use the same words and model, but
              the starting noise changes the result. A prompt guides the picture; it doesn’t
              uniquely determine it.
            </p>
          )}
          {answer === "different" && (
            <p>
              <strong>Exactly.</strong> Both pictures follow the lighthouse prompt, but different
              starting noise leads to different details. The number used to reproduce that starting
              noise is called a <strong>seed</strong>.
            </p>
          )}
          {answer === null && (
            <p>
              Choose an answer to check your intuition. You can change it or revisit the images at
              any time.
            </p>
          )}
        </div>
        <div className="mt-6 border-t border-station-dim pt-5">
          <p className="prose-lab">
            <strong>You’ve met three ideas:</strong> a prompt describes the image, noise is the
            starting point, and denoising turns it into a picture over several steps.
          </p>
          <p className="prose-lab mt-3">
            Curious how the model learned to do that? Keep reading below. For a different
            experiment, try finding patterns in pixels.
          </p>
          <Link to="/computer-vision" className="btn-tech mt-4 inline-flex items-center">
            Next experiment: how computers find edges →
          </Link>
        </div>
      </div>
    </div>
  );
}
