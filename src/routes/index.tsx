import { createFileRoute, Link } from "@tanstack/react-router";
import { OPERATOR_STATIONS, STATIONS, stationStyle, type Station } from "@/lib/journey";
import { pageHead } from "@/lib/site";
import { ReactiveGrid } from "@/components/site/ReactiveGrid";

export const Route = createFileRoute("/")({
  head: () =>
    pageHead(
      "/",
      "Learn AI & Machine Learning Interactively — Perceptron Lab",
      "Understand AI through hands-on visual experiments. Start with a beginner guide to AI images, then explore machine learning, neural networks, and language models at your own pace.",
    ),
  component: Index,
});

function LessonLink({ station }: { station: Station }) {
  return (
    <li>
      <Link
        to={station.path}
        style={stationStyle(station.hue)}
        className="group flex items-center justify-between gap-4 border-b border-border py-5 transition-colors hover:bg-card"
      >
        <div>
          <p className="label-tech text-station">{station.title}</p>
          <h4 className="mt-2 font-display text-lg font-semibold md:text-xl">{station.question}</h4>
          <p className="mt-1 text-base text-muted-foreground">{station.codename}</p>
        </div>
        <span aria-hidden="true" className="shrink-0 font-mono text-xl text-station">
          →
        </span>
      </Link>
    </li>
  );
}

function Index() {
  return (
    <div className="grid-paper">
      <ReactiveGrid />
      <div className="mx-auto w-full max-w-6xl px-6 pb-20 pt-10 md:pt-16">
        <div className="max-w-3xl">
          <p className="label-tech animate-rise">AI, explained through experiments</p>
          <h1 className="animate-rise mt-4 font-display text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            Understand AI.
            <br />
            <span className="text-station">Try it with your own hands.</span>
          </h1>
          <p className="prose-lab animate-rise mt-5 max-w-2xl text-lg">
            Explore artificial intelligence through visual experiments you control. See how it
            learns, works with words, and makes pictures. Start with a guided experiment—no math or
            coding needed.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              to="/diffusion"
              className="btn-tech btn-primary inline-flex items-center justify-center gap-3"
            >
              Try your first experiment <span aria-hidden="true">→</span>
            </Link>
            <a
              href="#explore"
              className="inline-flex min-h-11 items-center text-base text-foreground underline decoration-border underline-offset-4"
            >
              Explore all lessons ↓
            </a>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Free to explore · no account needed · learn at your own pace
          </p>
        </div>

        <section
          aria-labelledby="start-here-title"
          className="panel panel-ticks mt-10 grid overflow-hidden md:grid-cols-[1.1fr_1fr]"
          style={stationStyle(75)}
        >
          <div className="p-6 md:p-8">
            <p className="label-tech text-station">Start here · about 5 minutes</p>
            <h2
              id="start-here-title"
              className="mt-3 font-display text-2xl font-semibold md:text-3xl"
            >
              From a little noise
              <br />
              to a lighthouse.
            </h2>
            <p className="prose-lab mt-4">
              Move a slider and watch an AI-generated picture take shape. Then change the starting
              noise and see why the same words can lead to a different image.
            </p>
            <p className="prose-lab mt-3">
              We’ll guide you through what to try, what to notice, and what it means.
            </p>
            <Link
              to="/diffusion"
              className="mt-5 inline-flex min-h-11 items-center gap-2 font-display font-semibold text-station underline underline-offset-4"
            >
              Open the guided experiment <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="grid grid-cols-2 items-center gap-3 border-t border-border bg-background/50 p-6 md:border-l md:border-t-0 md:p-8">
            <figure>
              <img
                src="/data/diffusion/seed0/step0.webp"
                alt="Colored static at the start of a Stable Diffusion run"
                width={256}
                height={256}
                className="aspect-square w-full border border-border"
              />
              <figcaption className="mt-3 font-mono text-xs text-muted-foreground">
                01 / Starting noise
              </figcaption>
            </figure>
            <figure>
              <img
                src="/data/diffusion/seed0/step20.webp"
                alt="The finished painting of a lighthouse on a rocky coast at sunset"
                width={256}
                height={256}
                className="aspect-square w-full border border-border"
              />
              <figcaption className="mt-3 font-mono text-xs text-station">
                02 / Finished image
              </figcaption>
            </figure>
          </div>
        </section>

        <section id="explore" aria-labelledby="explore-title" className="scroll-mt-20 pt-16">
          <p className="label-tech">Follow your curiosity</p>
          <h2 id="explore-title" className="mt-3 font-display text-3xl font-semibold">
            Pick a question. Open an experiment.
          </h2>
          <p className="prose-lab mt-4 max-w-2xl">
            New to AI? Diffusion and computer vision both include a guided introduction. Try the
            controls, read the explanations, and explore the technical details when you’re ready.
          </p>
          <div className="mt-8 grid gap-x-12 gap-y-10 md:grid-cols-2">
            <div>
              <h3 className="font-display text-xl font-semibold">How AI works</h3>
              <p className="mt-2 text-base text-muted-foreground">
                For a course-like path, follow these in order.
              </p>
              <ol className="mt-3">
                {STATIONS.map((station) => (
                  <LessonLink key={station.path} station={station} />
                ))}
              </ol>
            </div>
            <div>
              <h3 className="font-display text-xl font-semibold">Using AI tools</h3>
              <p className="mt-2 text-base text-muted-foreground">
                Go further with prompts, feedback, and agents.
              </p>
              <ul className="mt-3">
                {OPERATOR_STATIONS.map((station) => (
                  <LessonLink key={station.path} station={station} />
                ))}
              </ul>
              <div className="mt-8 border-l-2 border-station-dim pl-5">
                <h3 className="font-display text-lg font-semibold">
                  Already comfortable with the basics?
                </h3>
                <p className="prose-lab mt-2">
                  The full labs are here too: real model recordings, adjustable controls, and
                  explanations of the math behind them.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="about-this-lab"
          className="mt-16 max-w-3xl border-t border-border pt-8"
        >
          <p className="label-tech">A note from the builder</p>
          <h2 id="about-this-lab" className="mt-3 font-display text-2xl font-semibold">
            Built to make the ideas stick.
          </h2>
          <div className="prose-lab mt-4">
            <p>
              I’m James Caldwell. I built Perceptron Lab while revisiting machine learning and
              exploring AI image tools. The ideas made more sense when I could change something and
              see what happened.
            </p>
            <p>
              It began with two confusingly similar names: “nearest-neighbor” image scaling and
              “nearest neighbors” in machine learning.{" "}
              <Link to="/interlude">Compare nearest-neighbor, bilinear, and bicubic resizing.</Link>{" "}
              This site is my growing collection of experiments for fellow learners—whether you’re
              meeting these ideas for the first time or coming back to them.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
