import { createFileRoute, Link } from "@tanstack/react-router";
import { stationByPath, stationStyle } from "@/lib/journey";
import { Section } from "@/components/site/Section";
import { Bridge } from "@/components/site/Bridge";
import { ScalingComparison } from "@/components/interactives/ScalingComparison";

export const Route = createFileRoute("/interlude")({
  head: () => ({
    meta: [
      { title: "Two Kinds of Nearest — Interlude | Perceptron Lab" },
      {
        name: "description",
        content:
          "Nearest-neighbor interpolation is not K-nearest-neighbors. A short detour through pixel-art scaling to tell them apart for good.",
      },
    ],
  }),
  component: InterludePage,
});

const station = stationByPath("/interlude")!;

function InterludePage() {
  return (
    <div style={stationStyle(station.hue)}>
      {/* hero */}
      <section className="grid-paper">
        <div className="mx-auto w-full max-w-6xl px-6 pb-10 pt-16 md:pt-24">
          <p className="label-tech animate-rise">Interlude · a short detour</p>
          <h1 className="animate-rise mt-4 max-w-3xl font-display text-4xl font-bold tracking-tight [animation-delay:80ms] md:text-6xl">
            Two kinds of <span className="text-station">nearest</span>
          </h1>
          <p className="prose-lab animate-rise mt-6 max-w-2xl text-lg [animation-delay:160ms]">
            This whole site exists because of one confusing afternoon: a pixel-art workflow said{" "}
            <em>nearest-neighbor</em>, an ML refresher said <em>nearest neighbors</em>, and they
            turned out to be two completely different ideas wearing the same name. Ten minutes here
            untangles them permanently.
          </p>
        </div>
      </section>

      {/* signature interactive */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-20">
        <ScalingComparison />
        <p className="label-tech mt-4 text-center">
          fig. 01 — the same 16×16 source through three resamplers, computed by hand
        </p>
      </section>

      <div className="flex flex-col gap-20 pb-24">
        <Section index="§1" title="One copies, the other votes">
          <p>
            <strong>Nearest-neighbor interpolation</strong> answers a graphics question: this output
            pixel lands <em>between</em> source pixels — what color should it be? Its answer is
            blunt: copy the single closest source pixel, no blending, no opinions. That bluntness is
            exactly why it&rsquo;s the right tool for pixel art — flat fills stay flat and hard
            edges stay hard. Bilinear and bicubic answer the same question by <em>averaging</em>{" "}
            neighbors instead, which is why they turn the mushroom&rsquo;s crisp outline into mush —
            and why they&rsquo;re the right answer for photos, where smoothness is truth. Flip the
            source above to the gradient and the rankings invert.
          </p>
          <p>
            <strong>K-nearest-neighbors</strong> answers a prediction question: here is a new sample
            — what label should it get? Its answer is social: find the k closest{" "}
            <em>training examples</em> in feature space and let them vote. You operated exactly that
            machine in <Link to="/foundations">the Boundary Lab</Link>. Same word, same
            &ldquo;closest thing wins&rdquo; instinct — but one copies a color from a grid, and the
            other polls labeled data to make a decision.
          </p>
        </Section>

        <Section index="§2" title="Why the confusion is worth keeping">
          <p>
            The mix-up is actually a good mnemonic, because both algorithms share a worldview:{" "}
            <strong>when in doubt, trust whatever is closest</strong>. Both are lazy — no training
            phase, all the work at lookup time. Both have one dial that trades sharpness for
            smoothness: interpolation picks <em>how many</em> source pixels to blend (one, four,
            sixteen — nearest, bilinear, bicubic), and KNN picks how many neighbors vote. Blend
            more, get smoother, lose detail. You watched that exact dial work twice now, in two
            different worlds.
          </p>
          <p>
            One more habit worth keeping: the word <em>nearest</em> should always trigger the
            question &ldquo;nearest <strong>what</strong>?&rdquo; Nearest pixel in a grid →
            graphics. Nearest sample in feature space → machine learning. (And when your image tool
            offers <em>lanczos</em>, that&rsquo;s just the photo-grade end of the blending dial — a
            sharper windowed average for downscaling photographs.)
          </p>
        </Section>

        <Bridge from="/interlude">
          <p>
            Both kinds of nearest treat pixels as things to <em>look up</em>. The next station flips
            the relationship: instead of copying or polling pixels, a convolutional network runs
            little learned pattern-detectors <em>across</em> them — and suddenly pixels aren&rsquo;t
            data to fetch, they&rsquo;re evidence to interpret.
          </p>
        </Bridge>
      </div>
    </div>
  );
}
