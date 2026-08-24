import { useEffect, useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { OPERATOR_STATIONS, STATIONS, stationStyle } from "@/lib/journey";
import { pageHead } from "@/lib/site";
import { ReactiveGrid } from "@/components/site/ReactiveGrid";

export const Route = createFileRoute("/")({
  head: () =>
    pageHead(
      "/",
      "Learn Machine Learning Interactively — Perceptron Lab",
      "Interactive machine learning tutorials from classical ML to Stable Diffusion: neural networks, CNNs, transformers, and diffusion models as hand-built visualizations you operate.",
    ),
  component: Index,
});

/** The journey spine's gradient: every station hue, cool → warm, in order. */
const SPINE_GRADIENT = `linear-gradient(to bottom, ${STATIONS.map(
  (s, i) => `oklch(0.74 0.165 ${s.hue}) ${(i / (STATIONS.length - 1)) * 100}%`,
).join(", ")})`;

function Index() {
  // the interlude is a stop on the journey, not an instrument station
  const instruments = STATIONS.filter((s) => !s.interlude);
  const liveCount = instruments.filter((s) => s.status === "live").length;

  /* scroll-reactive journey map: the spine draws itself in as you travel
     down the list, and each station's LED lights up as the line reaches it */
  const listRef = useRef<HTMLOListElement>(null);
  const spineRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const list = listRef.current;
    const spine = spineRef.current;
    if (!list || !spine) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    const update = () => {
      const r = list.getBoundingClientRect();
      const target = window.innerHeight * 0.62; // the "you are here" line
      const p = still ? 1 : Math.max(0, Math.min(1, (target - r.top) / r.height));
      spine.style.height = `${p * 100}%`;
      for (const li of list.children) {
        const reached = still || li.getBoundingClientRect().top + 30 < target;
        (li as HTMLElement).dataset.reached = reached ? "true" : "false";
      }
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
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

        {/* journey map: one continuous spine through every stop, drawn in
            by scroll; the faint rail shows the road ahead */}
        <div className="animate-rise relative mt-14 [animation-delay:240ms]">
          <span aria-hidden className="absolute bottom-7 left-[5px] top-7 w-px bg-border" />
          <span
            ref={spineRef}
            aria-hidden
            className="absolute left-1 top-7 w-[2px] max-h-[calc(100%-3.5rem)]"
            style={{ height: 0, background: SPINE_GRADIENT }}
          />
          <ol ref={listRef}>
            {STATIONS.map((s) => (
              <li key={s.path} className="journey-stop relative pl-8">
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
        </div>

        <p className="label-tech animate-rise mt-12 [animation-delay:320ms]">
          start anywhere — {liveCount} of {instruments.length} instruments are fully powered
        </p>

        {/* Track II — same site, different question: not how models work,
            but how to operate them */}
        <div className="animate-rise mt-20 [animation-delay:360ms]">
          <p className="label-tech">Track II · The Operator&rsquo;s Manual</p>
          <p className="prose-lab mt-3 max-w-2xl text-sm">
            The journey above opens the machines. This track is about <em>driving</em> them —
            prompting, sampling, and the feedback loops that turn a language model into a coworker.
            New instruments land here as they leave fabrication.
          </p>
          <ol className="mt-6">
            {OPERATOR_STATIONS.map((s) => (
              <li key={s.path} className="relative">
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
        </div>
      </div>
    </div>
  );
}
