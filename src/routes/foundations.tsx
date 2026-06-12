import { createFileRoute } from "@tanstack/react-router";
import { stationByPath, stationStyle } from "@/lib/journey";
import { pageHead } from "@/lib/site";
import { StationHero } from "@/components/site/StationHero";
import { Section } from "@/components/site/Section";
import { Bridge } from "@/components/site/Bridge";
import { BoundaryLab } from "@/components/interactives/BoundaryLab";
import { PolyFit } from "@/components/interactives/PolyFit";
import { KMeansStepper } from "@/components/interactives/KMeansStepper";
import { DescentContours } from "@/components/interactives/DescentContours";

export const Route = createFileRoute("/foundations")({
  head: () =>
    pageHead(
      "/foundations",
      "Classical ML — The Boundary Lab | Perceptron Lab",
      "Bias, variance, overfitting, KNN, k-means, and gradient descent — taught through a draggable decision-boundary playground with live error curves.",
    ),
  component: FoundationsPage,
});

const station = stationByPath("/foundations")!;

function FoundationsPage() {
  return (
    <div style={stationStyle(station.hue)}>
      <StationHero
        station={station}
        kicker="classical machine learning"
        title={
          <>
            The Boundary <span className="text-station">Lab</span>
          </>
        }
        lede="Every classifier draws a line between classes — the whole game is how wiggly to let that line get. Below, the line belongs to k-nearest-neighbors and the wiggle dial is k. Drag points, add your own, and watch the bias–variance tradeoff stop being an equation and start being a feeling."
        status="instrument live — drag points · sweep k · click the error chart"
      />

      {/* signature interactive */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-20">
        <BoundaryLab />
        <p className="label-tech mt-4 text-center">
          fig. 01 — knn decision regions with live train/test error
        </p>
      </section>

      <div className="flex flex-col gap-20 pb-24">
        <Section index="§1" title="The dial every model has">
          <p>
            Set k to 1 in the lab and the boundary traces every single point — including the noisy
            ones sitting in enemy territory. Train error: zero, always, because each point&rsquo;s
            nearest neighbor is itself. That model has <strong>memorized</strong>, not learned:
            it&rsquo;s <em>high variance</em> — reshuffle the data and the boundary changes
            completely. Crank k toward 25 and the boundary goes smooth and stubborn, ignoring real
            structure along with the noise: <em>high bias</em>.
          </p>
          <p>
            The error chart makes the tradeoff visible. Train error (dashed) only climbs as k grows
            — but test error is a <strong>U-curve</strong>: it falls while smoothing kills variance,
            then rises when smoothing starts killing signal. The gap between the two lines{" "}
            <em>is</em> overfitting, and the sweet spot at the bottom of the U moves when you turn
            the noise dial. Noisier data wants a bigger k. That&rsquo;s the whole bias–variance
            tradeoff, operated by hand.
          </p>
        </Section>

        <Section
          index="§2"
          title="The same disease in regression"
          figure={<PolyFit />}
          figureLabel="fig. 02 — polynomial capacity vs ridge restraint"
        >
          <p>
            Classification has k; regression has polynomial degree. Push the degree slider to 15
            with λ at zero and the curve threads every training point while flailing wildly in
            between — train error near zero, test error ugly. Same disease, different symptom.
          </p>
          <p>
            But instead of capping capacity, there&rsquo;s a second cure:{" "}
            <strong>regularization</strong>. The λ slider adds an L2 (ridge) penalty on the weights,
            so the model pays for every unit of wiggle and spends its capacity only where the data
            insists. Slide λ up and watch the degree-15 polynomial calm down without changing its
            degree at all. L1 (lasso) goes further and zeroes weights out entirely;{" "}
            <strong>dropout</strong> is the same instinct transplanted into neural networks.
          </p>
        </Section>

        <Section
          index="§3"
          title="Learning without labels"
          figure={<KMeansStepper />}
          figureLabel="fig. 03 — k-means converging, two moves at a time"
        >
          <p>
            Everything above had answer keys — labels to be right or wrong against. Strip the labels
            away and structure is still there; <strong>k-means</strong> finds it with two
            alternating moves: assign every point to its nearest centroid, then move each centroid
            to the mean of its points. Step through it below — the inertia readout only ever goes
            down, which is why the loop is guaranteed to settle.
          </p>
          <p>
            Guaranteed to settle — <em>not</em> guaranteed to settle well. Hit reshuffle a few
            times: bad starting centroids find bad clusterings and stay there. (And note
            &ldquo;nearest centroid&rdquo; doing the work here — the same instinct as KNN&rsquo;s
            &ldquo;nearest neighbors.&rdquo; That word <em>nearest</em> is about to cause some
            trouble at the next stop.)
          </p>
        </Section>

        <Section
          index="§4"
          title="How models actually learn"
          figure={<DescentContours />}
          figureLabel="fig. 04 — gradient descent: the learning-rate dilemma, live"
        >
          <p>
            KNN stores its data and k-means alternates two moves — but almost everything else, from
            ridge regression to every neural network, learns the same way: define a loss, compute
            its gradient, and take a small step downhill. Repeat. That&rsquo;s{" "}
            <strong>gradient descent</strong>, and the contour map below is the honest picture: the
            ball only ever feels the local slope.
          </p>
          <p>
            The step size is the <strong>learning rate</strong>, and it is still the hyperparameter
            that matters most. Try the ravine: too small and the ball crawls; nudge it higher and it
            bounces wall-to-wall across the steep axis while inching along the shallow one; a touch
            more and it <em>diverges entirely</em>. That tension — steep directions limit the step
            that shallow directions need — is the problem momentum and Adam were invented to solve.
            They&rsquo;re waiting at the next station.
          </p>
        </Section>

        <Bridge from="/foundations">
          <p>
            You just watched gradient descent solve a two-dimensional toy. A neural network is the
            same ball rolling down the same kind of surface — except the surface lives in millions
            of dimensions, one per weight, and the gradient arrives by a clever bookkeeping trick
            called backprop. The ball, the learning rate, the ravines: all of it scales up at the
            next station.
          </p>
        </Bridge>
      </div>
    </div>
  );
}
