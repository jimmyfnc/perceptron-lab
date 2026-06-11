import { createFileRoute } from "@tanstack/react-router";
import { stationByPath, stationStyle } from "@/lib/journey";
import { pageHead } from "@/lib/site";
import { Section } from "@/components/site/Section";
import { Bridge } from "@/components/site/Bridge";
import { ConvolutionBench } from "@/components/interactives/ConvolutionBench";
import { KernelGallery } from "@/components/interactives/KernelGallery";
import { PoolingInspector } from "@/components/interactives/PoolingInspector";
import { ReceptiveFieldTracer } from "@/components/interactives/ReceptiveFieldTracer";

export const Route = createFileRoute("/computer-vision")({
  head: () =>
    pageHead(
      "/computer-vision",
      "CNNs & Computer Vision — The Convolution Bench | Perceptron Lab",
      "Paint pixels, slide kernels, and watch feature maps build cell by cell. An interactive walkthrough of convolution, pooling, and feature hierarchies.",
    ),
  component: ComputerVisionPage,
});

const station = stationByPath("/computer-vision")!;

function ComputerVisionPage() {
  return (
    <div style={stationStyle(station.hue)}>
      {/* hero */}
      <section className="grid-paper">
        <div className="mx-auto w-full max-w-6xl px-6 pb-10 pt-16 md:pt-24">
          <p className="label-tech animate-rise">
            Station {station.num} · CNNs &amp; computer vision
          </p>
          <h1 className="animate-rise mt-4 max-w-3xl font-display text-4xl font-bold tracking-tight [animation-delay:80ms] md:text-6xl">
            The Convolution <span className="text-station">Bench</span>
          </h1>
          <p className="prose-lab animate-rise mt-6 max-w-2xl text-lg [animation-delay:160ms]">
            A convolutional network is built on one small idea: slide a tiny grid of weights across
            an image and write down how strongly each spot answers. Everything else — pooling,
            depth, feature hierarchies — is that idea, repeated. Paint something below and watch it
            happen.
          </p>
          <p className="label-tech animate-rise mt-8 [animation-delay:240ms]">
            <span className="led led-pulse mr-2 inline-block align-middle" />
            instrument live — drag to paint · hover the map · press sweep
          </p>
        </div>
      </section>

      {/* signature interactive */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-20">
        <ConvolutionBench />
        <p className="label-tech mt-4 text-center">
          fig. 01 — convolve · rectify · pool: one full CNN stage, by hand
        </p>
      </section>

      <div className="flex flex-col gap-20 pb-24">
        <Section index="§1" title="One small window, slid everywhere">
          <p>
            A fully-connected network treats every pixel as its own independent input — move the
            subject two pixels left and, as far as the math is concerned, it&rsquo;s a brand-new
            image. Convolution makes the opposite bet:{" "}
            <strong>a pattern worth detecting is worth detecting anywhere</strong>. So instead of
            learning one weight per pixel, you learn a tiny 3×3 window of weights — a{" "}
            <em>kernel</em> — and reuse it at every position.
          </p>
          <p>
            At each stop, the kernel does one multiply–accumulate: nine weights times nine pixels,
            summed to a single number. That number is the answer to one question —{" "}
            <em>how much does this patch look like my pattern?</em> — and the grid of answers is the{" "}
            <strong>feature map</strong> you watched build in the bench above. Weight sharing is
            also why CNNs are cheap: the bench&rsquo;s 16×16 input would need 256 weights per neuron
            in an MLP; the kernel gets by with nine, total.
          </p>
        </Section>

        <Section
          index="§2"
          title="Kernels are pattern detectors"
          figure={<KernelGallery />}
          figureLabel="fig. 02 — classic hand-designed kernels on a calibration card"
        >
          <p>
            Before deep learning, vision engineers designed kernels by hand — Sobel for edges,
            Gaussian for smoothing, Laplacian for outlines. Each one is just a different 3×3
            arrangement of weights, and each asks the image a different question. Flip through them
            below: the input never changes, only the question does.
          </p>
          <p>
            The deep-learning move was to stop designing them.{" "}
            <strong>A CNN learns its kernels by gradient descent</strong> — and when you inspect a
            trained network&rsquo;s first layer, it has usually rediscovered these same shapes:
            oriented edges, color contrasts, little gradients. The difference is it learned the
            questions <em>worth asking</em> for its task, and it asks hundreds of them at once.
          </p>
        </Section>

        <Section
          index="§3"
          title="Pooling: keep the what, loosen the where"
          figure={<PoolingInspector />}
          figureLabel="fig. 03 — a real feature map (bolt × sobel-x), pooled"
        >
          <p>
            Feature maps are wasteful. If a vertical edge fired strongly at one spot, it also fired
            weakly at the neighbors — you don&rsquo;t need all of that. <strong>Max pooling</strong>{" "}
            slides a 2×2 window and keeps only the strongest response, shrinking the map to a
            quarter of the pixels while preserving <em>that the feature was found</em>, just not
            exactly where.
          </p>
          <p>
            That blur on position is a feature, not a bug: it buys a little translation invariance,
            so the network stops caring whether the edge was at pixel 6 or pixel 7. Average pooling
            keeps the mean instead — gentler, but it waters down strong detections. Toggle between
            the two and notice which one lets the bright responses survive.
          </p>
        </Section>

        <Section
          index="§4"
          title="Depth buys context"
          figure={<ReceptiveFieldTracer />}
          figureLabel="fig. 04 — receptive field growth across two stacked convolutions"
        >
          <p>
            One 3×3 kernel sees three pixels across — enough for an edge, hopeless for an eye. The
            fix isn&rsquo;t bigger kernels, it&rsquo;s <strong>stacking</strong>: a second
            layer&rsquo;s kernel slides over the first layer&rsquo;s feature maps, so each of its
            cells indirectly watches a 5×5 patch of the original image. Add pooling and a few more
            layers and the deepest cells see most of the picture.
          </p>
          <p>
            This is the feature hierarchy your image classifier learned without being told to:{" "}
            <em>edges → textures → parts → objects</em>. Layer one finds oriented lines, layer three
            composes them into corners and fur, the last layers respond to whole faces. Each layer
            asks its questions about the answers of the layer before.
          </p>
        </Section>

        <Bridge from="/computer-vision">
          <p>
            Convolution&rsquo;s superpower is also its limit: every cell only ever sees its
            neighborhood, and context has to climb the stack one layer at a time. What if, instead,
            every position could look directly at <em>every other position</em> and decide for
            itself what&rsquo;s relevant? That single idea — attention — is why transformers
            displaced recurrence, and it&rsquo;s waiting at the next station.
          </p>
        </Bridge>
      </div>
    </div>
  );
}
