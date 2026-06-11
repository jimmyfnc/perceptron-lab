import { createFileRoute, Link } from "@tanstack/react-router";
import { STATIONS, stationStyle } from "@/lib/journey";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Perceptron Lab — an interactive ML field manual" },
      {
        name: "description",
        content:
          "Learn machine learning by playing with it: hand-built interactive visualizations from classical ML to diffusion models.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="grid-paper">
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
          start anywhere — {STATIONS.filter((s) => s.status === "live").length} of {STATIONS.length}{" "}
          instruments are fully powered
        </p>
      </div>
    </div>
  );
}
