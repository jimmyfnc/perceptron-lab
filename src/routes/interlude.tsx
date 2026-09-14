import { createFileRoute, Link } from "@tanstack/react-router";
import { stationByPath, stationStyle } from "@/lib/journey";
import { pageHead } from "@/lib/site";
import { ReactiveGrid } from "@/components/site/ReactiveGrid";
import { Section } from "@/components/site/Section";
import { Bridge } from "@/components/site/Bridge";
import { ScalingComparison } from "@/components/interactives/ScalingComparison";

export const Route = createFileRoute("/interlude")({
  head: () =>
    pageHead(
      "/interlude",
      "Nearest Neighbor vs. Bilinear vs. Bicubic | Perceptron Lab",
      "Compare nearest-neighbor, bilinear, and bicubic interpolation on pixel art and smooth gradients. Try the interactive demo, choose a resizing method, and understand how KNN differs.",
    ),
  component: InterludePage,
});

const station = stationByPath("/interlude")!;

function InterludePage() {
  return (
    <div style={stationStyle(station.hue)}>
      {/* hero */}
      <section className="grid-paper">
        <ReactiveGrid />
        <div className="mx-auto w-full max-w-6xl px-6 pb-10 pt-16 md:pt-24">
          <p className="label-tech animate-rise">Interlude · a short detour</p>
          <h1 className="animate-rise mt-4 max-w-3xl font-display text-4xl font-bold tracking-tight [animation-delay:80ms] md:text-6xl">
            Nearest-neighbor interpolation vs.{" "}
            <span className="text-station">bilinear and bicubic</span>
          </h1>
          <p className="prose-lab animate-rise mt-6 max-w-2xl text-lg [animation-delay:160ms]">
            Enlarging a picture creates new pixels. Nearest neighbor copies the closest source
            pixel; bilinear blends four nearby pixels; bicubic uses a curve across a 4×4
            neighborhood. Compare them below to see why crisp pixel art and smooth images need
            different treatment.
          </p>
          <a
            href="#resampling-demo"
            className="btn-tech btn-primary mt-6 inline-flex min-h-11 items-center"
          >
            Try the resizing comparison ↓
          </a>
        </div>
      </section>

      {/* signature interactive */}
      <section
        id="resampling-demo"
        aria-labelledby="resampling-demo-title"
        className="mx-auto w-full max-w-6xl scroll-mt-24 px-6 pb-20"
      >
        <h2 id="resampling-demo-title" className="mb-4 font-display text-2xl font-semibold">
          One image, three ways to enlarge it
        </h2>
        <p className="prose-lab mb-6 max-w-3xl">
          Start with <strong>pixel art</strong> and look at the mushroom&rsquo;s outline. Then
          select <strong>smooth gradient</strong> below the images and compare the color
          transitions. Which method keeps the blocks, and which fills in the steps between them?
        </p>
        <ScalingComparison />
        <p className="label-tech mt-4 text-center">
          fig. 01 — the same 16×16 source through three resamplers, computed by hand
        </p>
      </section>

      <div className="flex flex-col gap-20 pb-24">
        <Section index="§1" title="Which interpolation method should you use?">
          <p>
            For enlarging pixel art, start with nearest neighbor. For photos and gradients, compare
            bilinear and bicubic: bilinear gives a softer result, while bicubic can keep edges more
            defined. The most useful choice depends on the image and the look you want.
          </p>
          <div
            className="my-6 overflow-x-auto rounded-sm border border-border"
            role="region"
            aria-label="Interpolation comparison table"
            tabIndex={0}
          >
            <table className="w-full min-w-[36rem] text-left text-sm">
              <caption className="border-b border-border bg-card px-4 py-3 text-left font-display font-semibold">
                Nearest neighbor vs. bilinear vs. bicubic when enlarging an image
              </caption>
              <thead className="bg-card font-display">
                <tr>
                  <th scope="col" className="p-4">
                    Method
                  </th>
                  <th scope="col" className="p-4">
                    How it samples
                  </th>
                  <th scope="col" className="p-4">
                    Useful for
                  </th>
                  <th scope="col" className="p-4">
                    Watch for
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border">
                  <th scope="row" className="p-4 align-top font-display text-foreground">
                    Nearest neighbor
                  </th>
                  <td className="p-4 align-top">Copies one source pixel.</td>
                  <td className="p-4 align-top">
                    Pixel art and images whose exact palette should stay intact.
                  </td>
                  <td className="p-4 align-top">Blocky steps on curves and gradients.</td>
                </tr>
                <tr className="border-t border-border">
                  <th scope="row" className="p-4 align-top font-display text-foreground">
                    Bilinear
                  </th>
                  <td className="p-4 align-top">
                    Blends a 2×2 neighborhood using distance weights.
                  </td>
                  <td className="p-4 align-top">Smooth transitions with a simple, soft result.</td>
                  <td className="p-4 align-top">Blurred edges and new colors in pixel art.</td>
                </tr>
                <tr className="border-t border-border">
                  <th scope="row" className="p-4 align-top font-display text-foreground">
                    Bicubic
                  </th>
                  <td className="p-4 align-top">
                    Uses cubic interpolation across a 4×4 neighborhood.
                  </td>
                  <td className="p-4 align-top">
                    Photos and smooth images where edge definition matters.
                  </td>
                  <td className="p-4 align-top">
                    Possible halos near sharp edges; results vary by cubic filter.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            These neighborhoods describe enlargement in this demo. When shrinking an image,
            antialiasing and the area covered by each output pixel also matter; resizing tools can
            use wider filters. For a reference implementation, see{" "}
            <a href="https://pillow.readthedocs.io/en/stable/handbook/concepts.html#filters">
              Pillow&rsquo;s resampling filter documentation
            </a>
            .
          </p>
        </Section>

        <Section index="§2" title="Why does pixel art get blurry when resized?">
          <p>
            Bilinear and bicubic create intermediate colors around an edge. That helps a photo look
            continuous, but it softens the deliberate blocks in a sprite. Nearest neighbor preserves
            the original colors. Use a whole-number scale, such as 2× or 4×, to keep every source
            pixel the same size: a 16×16 sprite becomes 32×32 or 64×64.
          </p>
          <p>
            At a non-integer scale, nearest neighbor still copies the original colors, but some
            blocks can become wider than others. And none of these methods recovers detail that the
            original image never contained: smoother enlargement is still an estimate from the
            available pixels.
          </p>
        </Section>

        <Section index="§3" title="Is nearest-neighbor interpolation the same as KNN?">
          <p>
            No. <strong>Nearest-neighbor interpolation</strong> copies a color from the closest
            pixel in an image grid. <strong>K-nearest neighbors (KNN)</strong> makes a prediction
            from nearby training examples in feature space. The shared idea is distance; what counts
            as a neighbor, and what you do with it, differs.
          </p>
          <p>
            <strong>K-nearest-neighbors</strong> answers a prediction question: here is a new sample
            — what label should it get? Its answer is social: find the k closest{" "}
            <em>training examples</em> in feature space and let them vote. Try that prediction
            process in <Link to="/foundations">the interactive KNN decision-boundary lab</Link>.
            Same word, same &ldquo;closest thing wins&rdquo; instinct — but one copies a color from
            a grid, and the other polls labeled data to make a decision.
          </p>
        </Section>

        <Section index="§4" title="Two kinds of nearest: how this lab began">
          <p>
            This whole site exists because of one confusing afternoon: a pixel-art workflow said
            &ldquo;nearest-neighbor,&rdquo; an ML refresher said &ldquo;nearest neighbors,&rdquo;
            and I initially treated them as the same idea. Building these experiments helped me
            separate image resizing from learning with examples.
          </p>
          <p>
            One more habit worth keeping: the word <em>nearest</em> should always trigger the
            question &ldquo;nearest <strong>what</strong>?&rdquo; Nearest pixel in a grid →
            graphics. Nearest sample in feature space → machine learning.
          </p>
        </Section>

        <Bridge from="/interlude">
          <p>
            Resizing changes where pixels go. The next station asks what those pixels contain: a
            convolutional network runs little learned pattern-detectors <em>across</em> them — and
            suddenly pixels aren&rsquo;t data to fetch, they&rsquo;re evidence to interpret.
          </p>
        </Bridge>
      </div>
    </div>
  );
}
