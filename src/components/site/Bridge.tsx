import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { nextStation, stationStyle } from "@/lib/journey";

/**
 * The "bridge" footer that hands one module off to the next — a short
 * concept link plus a tile for the next station, tinted in ITS hue.
 */
export function Bridge({ from, children }: { from: string; children: ReactNode }) {
  const next = nextStation(from);
  if (!next) return null;
  return (
    <section className="mx-auto w-full max-w-3xl px-6">
      <div className="border-t border-border pt-10">
        <p className="label-tech">Bridge</p>
        <div className="prose-lab mt-4">{children}</div>
        <Link
          to={next.path}
          style={stationStyle(next.hue)}
          className="panel panel-ticks group mt-8 flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:border-station-dim"
        >
          <div>
            <p className="label-tech">
              Next station · {next.num} {next.interlude ? "· interlude" : ""}
            </p>
            <p className="mt-1 font-display text-lg font-semibold">
              {next.title} — <span className="text-station">{next.codename}</span>
            </p>
            <p className="mt-1 font-body text-sm text-muted-foreground">{next.tagline}</p>
          </div>
          <span
            aria-hidden
            className="readout text-xl text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-station"
          >
            -&gt;
          </span>
        </Link>
      </div>
    </section>
  );
}
