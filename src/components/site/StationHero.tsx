import type { ReactNode } from "react";
import type { Station } from "@/lib/journey";
import { ReactiveGrid } from "@/components/site/ReactiveGrid";

/**
 * The grid-paper hero every station page opens with: kicker, display
 * title with the accented word, serif lede, and the live-status line.
 * `title` should contain the accent span, e.g.
 * <>The Convolution <span className="text-station">Bench</span></>.
 */
export function StationHero({
  station,
  kicker,
  title,
  lede,
  status,
  eyebrow,
  compact = false,
}: {
  station: Station;
  /** text after "Station NN · " in the kicker */
  kicker: string;
  title: ReactNode;
  lede: ReactNode;
  /** the lowercase status line shown next to the pulsing LED */
  status: string;
  /** Optional audience-first label for entry lessons. */
  eyebrow?: string;
  compact?: boolean;
}) {
  return (
    <section className="grid-paper">
      <ReactiveGrid />
      <div
        className={`mx-auto w-full max-w-6xl px-6 ${compact ? "pb-4 pt-8 md:pt-12" : "pb-10 pt-16 md:pt-24"}`}
      >
        <p className="label-tech animate-rise">{eyebrow ?? `Station ${station.num} · ${kicker}`}</p>
        <h1 className="animate-rise mt-4 max-w-3xl font-display text-4xl font-bold tracking-tight [animation-delay:80ms] md:text-6xl">
          {title}
        </h1>
        <p className="prose-lab animate-rise mt-6 max-w-2xl text-lg [animation-delay:160ms]">
          {lede}
        </p>
        <p
          className={`label-tech animate-rise [animation-delay:240ms] ${compact ? "mt-4" : "mt-8"}`}
        >
          <span className="led led-pulse mr-2 inline-block align-middle" />
          {status}
        </p>
      </div>
    </section>
  );
}
