import { Link } from "@tanstack/react-router";
import type { Station } from "@/lib/journey";
import { stationStyle } from "@/lib/journey";

/** Placeholder page for stations not yet built — styled as a powered-down instrument. */
export function StationStub({ station }: { station: Station }) {
  return (
    <div style={stationStyle(station.hue)} className="grid-paper">
      <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col items-start justify-center px-6 py-24">
        <p className="label-tech animate-rise">Station {station.num} · status: offline</p>
        <h1 className="animate-rise mt-4 font-display text-4xl font-bold tracking-tight md:text-5xl [animation-delay:80ms]">
          {station.title}
        </h1>
        <p className="animate-rise mt-2 font-display text-xl text-station [animation-delay:140ms]">
          {station.codename}
        </p>
        <p className="prose-lab animate-rise mt-6 max-w-xl [animation-delay:200ms]">
          {station.tagline} This instrument hasn&rsquo;t been switched on yet — it&rsquo;s next on
          the bench.
        </p>
        <div className="animate-rise mt-10 flex items-center gap-3 [animation-delay:260ms]">
          <span className="led" aria-hidden style={{ opacity: 0.35 }} />
          <span className="readout text-xs text-muted-foreground">CALIBRATION PENDING</span>
        </div>
        <Link to="/" className="btn-tech mt-10">
          &lt;- back to the journey
        </Link>
      </div>
    </div>
  );
}
