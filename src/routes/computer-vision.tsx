import { createFileRoute } from "@tanstack/react-router";
import { stationByPath, stationStyle } from "@/lib/journey";
import { pageHead } from "@/lib/site";
import { StationHero } from "@/components/site/StationHero";
import { Section } from "@/components/site/Section";
import { Term } from "@/components/site/Term";
import { Bridge } from "@/components/site/Bridge";
import { DeeperCut, MatrixCard } from "@/components/site/DeeperCut";
import { ConvolutionBench } from "@/components/interactives/ConvolutionBench";
import { KernelGallery } from "@/components/interactives/KernelGallery";
import { PoolingInspector } from "@/components/interactives/PoolingInspector";
import { ReceptiveFieldTracer } from "@/components/interactives/ReceptiveFieldTracer";

export const Route = createFileRoute("/computer-vision")({
  head: () =>
    pageHead(
      "/computer-vision",
      "How Convolutional Neural Networks Work — Interactive | Perceptron Lab",
      "Learn how CNNs work: convolution, kernels, feature maps, max pooling, and receptive fields — paint pixels, slide kernels, and watch features emerge cell by cell.",
    ),
  component: ComputerVisionPage,
});

const station = stationByPath("/computer-vision")!;

function ComputerVisionPage() {
  return (
    <div style={stationStyle(station.hue)}>
      <StationHero
        station={station}
        kicker="CNNs & computer vision"
        title={
          <>
            The Convolution <span className="text-station">Bench</span>
          </>
        }
        lede="A convolutional neural network is built on one small idea: slide a tiny grid of weights across an image and write down how strongly each spot answers. Everything else — pooling, depth, feature hierarchies — is that idea, repeated. Paint something below and watch it happen."
        status="instrument live — drag to paint · hover the map · press sweep"
      />

      {/* signature interactive */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-20">
        <ConvolutionBench />
        <p className="label-tech mt-4 text-center">
          fig. 01 — convolve · rectify · pool: one full CNN stage, by hand
        </p>
      </section>

      <div className="flex flex-col gap-20 pb-24">
        <Section index="§1" title="Convolution: one small window, slid everywhere">
          <p>
            A fully-connected network treats every pixel as its own independent input — move the
            subject two pixels left and, as far as the math is concerned, it&rsquo;s a brand-new
            image. <Term k="convolution">Convolution</Term> makes the opposite bet:{" "}
            <strong>a pattern worth detecting is worth detecting anywhere</strong>. So instead of
            learning one weight per pixel, you learn a tiny 3×3 window of weights — a{" "}
            <Term k="kernel">
              <em>kernel</em>
            </Term>{" "}
            — and reuse it at every position.
          </p>
          <p>
            At each stop, the kernel does one multiply–accumulate: nine weights times nine pixels,
            summed to a single number. That number is the answer to one question —{" "}
            <em>how much does this patch look like my pattern?</em> — and the grid of answers is the{" "}
            <Term k="feature map">
              <strong>feature map</strong>
            </Term>{" "}
            you watched build in the bench above. Weight sharing is also why CNNs are cheap: the
            bench&rsquo;s 16×16 input would need 256 weights per neuron in an MLP; the kernel gets
            by with nine, total.
          </p>
          <DeeperCut title="the arithmetic">
            <p>
              One stop of the kernel is a dot product:{" "}
              <code>S(i,j) = Σₘ Σₙ I(i+m, j+n) · K(m,n)</code> — nine multiplies and eight adds
              writing one cell of the feature map. (Pedants&rsquo; corner: that&rsquo;s technically{" "}
              <em>cross-correlation</em>; a true convolution flips the kernel 180° first.
              Deep-learning frameworks skip the flip, because a learned kernel simply learns itself
              pre-flipped.)
            </p>
            <p>
              Output size is one formula: <code>out = ⌊(n + 2p − k)/s⌋ + 1</code> for input width n,
              padding p, kernel k, stride s. The bench: n=16, k=3, p=0, s=1 → 14 — which is exactly
              why the map you painted came out 14×14. Add a one-pixel border of zeros (p=1,
              &ldquo;same&rdquo; padding) and the map returns to 16×16.
            </p>
            <p>
              And the cheapness claim in real numbers:{" "}
              <strong>a layer of 32 such kernels costs 32 · (9 + 1) = 320 weights</strong> (the +1
              is each kernel&rsquo;s bias); one fully-connected layer from these 256 pixels to 256
              hidden units costs 65,792. That ratio, not any cleverness, is why vision went
              convolutional.
            </p>
          </DeeperCut>
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
          <DeeperCut title="reading a kernel like a derivative">
            <MatrixCard
              values={[
                ["−1", "0", "1"],
                ["−2", "0", "2"],
                ["−1", "0", "1"],
              ]}
              label="sobel-x, weight by weight"
            />
            <p>
              Read Sobel-x by columns: left negative, right positive — it computes{" "}
              <em>right minus left</em>, a finite difference approximating ∂I/∂x — while the 1-2-1
              down each column averages vertically so a single noisy pixel can&rsquo;t fake an edge.
              The weights sum to zero, and that&rsquo;s the deeper pattern:{" "}
              <strong>a zero-sum kernel stays silent on flat patches</strong> — it only speaks when
              its pattern actually shows up.
            </p>
            <p>
              The Gaussian is the opposite species: all-positive, summing to one, so flat stays
              flat. It hides one more trick — it&rsquo;s <em>separable</em>: the 3×3 is the outer
              product of <code>[1 2 1]/4</code> with itself, so you can blur rows then columns and
              pay 2k multiplies per pixel instead of k². The Laplacian is the second derivative:
              blind to steady ramps, loud at changes of slope — which is why it traces outlines.
            </p>
          </DeeperCut>
        </Section>

        <Section
          index="§3"
          title="Max pooling: keep the what, loosen the where"
          figure={<PoolingInspector />}
          figureLabel="fig. 03 — a real feature map (bolt × sobel-x), pooled"
        >
          <p>
            Feature maps are wasteful. If a vertical edge fired strongly at one spot, it also fired
            weakly at the neighbors — you don&rsquo;t need all of that.{" "}
            <Term k="pooling">
              <strong>Max pooling</strong>
            </Term>{" "}
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
          <DeeperCut title="gradients through a switch">
            <p>
              Pooling owns no weights, but it still must pass gradients backwards, and the two
              variants do it in character. Max pooling routes like a switch:{" "}
              <strong>
                the winning cell receives the entire gradient; the other three get exactly zero
              </strong>{" "}
              — so only the detector that actually fired gets trained harder. Average pooling splits
              the gradient into four equal quarters, diluting credit exactly the way it diluted the
              signal.
            </p>
            <p>
              The bookkeeping: a 2×2, stride-2 pool halves each side, so after L pools a map&rsquo;s
              side is n/2ᴸ. The classic ImageNet pipeline pools 224 → 112 → 56 → 28 → 14 → 7 — five
              halvings before the classifier reads the 7×7 summary.
            </p>
          </DeeperCut>
        </Section>

        <Section
          index="§4"
          title="Receptive fields: depth buys context"
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
          <DeeperCut title="the growth formula">
            <p>
              Receptive-field growth is a one-line recurrence: <code>r ← r + (k − 1) · j</code>,
              where j is the product of all strides so far (start at r=1, j=1). Two 3×3 convs: 1 → 3
              → 5, exactly as the tracer shows. Insert a 2×2 stride-2 pool (r=6, j doubles to 2) and
              the next 3×3 jumps straight to r=10 —{" "}
              <strong>
                pooling is a receptive-field accelerator: every later kernel step covers twice the
                original pixels
              </strong>
              .
            </p>
            <p>
              The stacking economics, per channel: two 3×3 layers see 5×5 using 18 weights and two
              nonlinearities; one 5×5 layer needs 25 weights and bends once. Three 3×3s match a 7×7:
              27 weights against 49. Same context, fewer weights, more bends — that arithmetic is
              VGG&rsquo;s whole thesis, and it&rsquo;s why 3×3 became the default everywhere.
            </p>
          </DeeperCut>
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
