import { createFileRoute, Link } from "@tanstack/react-router";
import { STATIONS, stationStyle } from "@/lib/journey";
import { pageHead } from "@/lib/site";
import { ReactiveGrid } from "@/components/site/ReactiveGrid";

export const Route = createFileRoute("/")({
  head: () =>
    pageHead(
      "/",
      "Perceptron Lab — an interactive ML field manual",
      "Learn machine learning by playing with it: hand-built interactive visualizations from classical ML to diffusion models.",
    ),
  component: Index,
});

function Index() {
  // the interlude is a stop on the journey, not an instrument station
  const instruments = STATIONS.filter((s) => !s.interlude);
  const liveCount = instruments.filter((s) => s.status === "live").length;
  return (
    <div className="grid-paper">
      <ReactiveGrid />
      <div className="mx-auto w-full max-w-3xl px-6 pb-24 pt-16 md:pt-24">
        <p className="label-tech animate-rise">An interactive ML field manual</p>
        <h1 className="animate-rise mt-4 font-display text-4xl font-bold tracking-tight [animation-delay:80ms] md:text-6xl">
          Learn it by{" "}
          <span className="text-station" style={stationStyle(305)}>
            touching
          </span>{" "}
          it.
        </h1>
        <p className="prose-lab animate-rise mt-6 max-w-2xl text-lg [animation-delay:160ms]">
          Five stations from classical machine learning to diffusion models — the same road I took,
          rebuilt as instruments you can operate. Every page has one signature interactive: drag the
          points, slide the kernels, scrub the noise. The math sticks when your hands are on it.
        </p>

        {/* the founding anecdote — the interlude tells it in full */}
        <div
          className="panel animate-rise mt-8 max-w-2xl px-5 py-4 [animation-delay:200ms]"
          style={stationStyle(160)}
        >
          <p className="label-tech">lab note · why this site exists</p>
          <p className="prose-lab mt-2 text-sm">
            It started with one confusing afternoon: a pixel-art workflow said{" "}
            <em>nearest-neighbor</em>, an ML course said <em>nearest neighbors</em>, and they turned
            out to be completely different ideas wearing the same name. Untangling that collision is
            the site&rsquo;s founding story — it&rsquo;s told in full at{" "}
            <Link to="/interlude" className="text-station underline decoration-dotted">
              the interlude
            </Link>
            , in its rightful place on the journey. No experience required anywhere here: jargon
            wears a dotted underline you can hover for a plain-words translation.
          </p>
        </div>

        {/* journey list */}
        <ol className="animate-rise mt-14 [animation-delay:240ms]">
          {STATIONS.map((s, i) => (
            <li key={s.path} className="relative pl-8">
              {/* spine */}
              {i < STATIONS.length - 1 && (
                <span aria-hidden className="absolute left-[5px] top-7 h-full w-px bg-border" />
              )}
              <span
                aria-hidden
                className="led absolute left-0 top-[26px]"
                style={{
                  ...stationStyle(s.hue),
                  opacity: s.status === "live" ? 1 : 0.3,
                }}
              />
              <Link
                to={s.path}
                style={stationStyle(s.hue)}
                className="group mb-3 block border border-transparent px-4 py-4 transition-colors hover:border-border hover:bg-card"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-display text-lg font-semibold tracking-tight">
                    <span className="readout mr-3 text-sm text-station">{s.num}</span>
                    {s.title}
                    <span className="ml-2 text-station transition-colors">— {s.codename}</span>
                  </p>
                  <span className="label-tech">
                    {s.status === "live" ? (
                      <span className="text-station">● live</span>
                    ) : (
                      "○ in fabrication"
                    )}
                  </span>
                </div>
                <p className="mt-1 font-body text-sm text-muted-foreground">{s.tagline}</p>
              </Link>
            </li>
          ))}
        </ol>

        <p className="label-tech animate-rise mt-12 [animation-delay:320ms]">
          start anywhere — {liveCount} of {instruments.length} instruments are fully powered
        </p>
      </div>
    </div>
  );
}
