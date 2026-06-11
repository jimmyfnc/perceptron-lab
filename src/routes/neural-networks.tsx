import { createFileRoute } from "@tanstack/react-router";
import { stationByPath, stationStyle } from "@/lib/journey";
import { pageHead } from "@/lib/site";
import { Section } from "@/components/site/Section";
import { Bridge } from "@/components/site/Bridge";
import { DescentRace } from "@/components/interactives/DescentRace";
import { ActivationGallery } from "@/components/interactives/ActivationGallery";
import { MLPTrainer } from "@/components/interactives/MLPTrainer";

export const Route = createFileRoute("/neural-networks")({
  head: () =>
    pageHead(
      "/neural-networks",
      "Neural Networks — The Descent | Perceptron Lab",
      "Perceptron to MLP, activations, backprop, and loss landscapes — with SGD, momentum, and Adam racing down a 3D loss surface you can steer.",
    ),
  component: NeuralNetworksPage,
});

const station = stationByPath("/neural-networks")!;

function NeuralNetworksPage() {
  return (
    <div style={stationStyle(station.hue)}>
      {/* hero */}
      <section className="grid-paper">
        <div className="mx-auto w-full max-w-6xl px-6 pb-10 pt-16 md:pt-24">
          <p className="label-tech animate-rise">Station {station.num} · neural networks</p>
          <h1 className="animate-rise mt-4 max-w-3xl font-display text-4xl font-bold tracking-tight [animation-delay:80ms] md:text-6xl">
            The <span className="text-station">Descent</span>
          </h1>
          <p className="prose-lab animate-rise mt-6 max-w-2xl text-lg [animation-delay:160ms]">
            Training a network is not a search for the right answer — it&rsquo;s a walk downhill.
            The loss is a landscape, the weights are your position, and every optimizer ever
            invented is just a different way of taking the next step. Below, three of them race down
            the same hill.
          </p>
          <p className="label-tech animate-rise mt-8 [animation-delay:240ms]">
            <span className="led led-pulse mr-2 inline-block align-middle" />
            instrument live — drag to orbit · click the surface to re-drop
          </p>
        </div>
      </section>

      {/* signature interactive */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-20">
        <DescentRace />
        <p className="label-tech mt-4 text-center">
          fig. 01 — sgd, momentum, and adam on the same landscape, same learning rate
        </p>
      </section>

      <div className="flex flex-col gap-20 pb-24">
        <Section index="§1" title="A neuron is a line; a network is a bend">
          <p>
            Strip the mystique and a neuron is the smallest model from station 01: weigh each input,
            add a bias, output the sum. One neuron over two inputs draws one straight line — which
            is exactly why the checker dataset embarrassed it for twenty years. XOR has no
            straight-line answer, and{" "}
            <strong>
              stacking linear layers doesn&rsquo;t help: a chain of linear maps collapses into a
              single linear map
            </strong>
            . Depth, on its own, buys you nothing.
          </p>
          <p>
            The fix costs one line of code: after each weighted sum, push the result through a small
            nonlinear function before handing it to the next layer. That bend is the entire trick.
            With it, two layers of a few neurons can carve curved regions no single line could — and
            with enough of them, an MLP can approximate <em>any</em> reasonable function. Everything
            else in deep learning is making that possibility cheap to find.
          </p>
        </Section>

        <Section
          index="§2"
          title="The activation is where the bend comes from"
          figure={<ActivationGallery />}
          figureLabel="fig. 02 — four bends, and how much gradient each lets back through"
        >
          <p>
            The choice of bend matters less for what the network <em>can</em> express than for
            whether gradients survive the trip backwards through it. The sigmoid looks harmless
            until you read its derivative: never more than 0.25. Chain eight sigmoid layers and{" "}
            <strong>the training signal shrinks by a factor of four at every layer</strong> — by
            layer eight, effectively nothing arrives. That&rsquo;s the vanishing gradient, and
            it&rsquo;s why early deep nets simply refused to get deep.
          </p>
          <p>
            ReLU&rsquo;s answer is blunt: slope exactly 1 when active, so gradients pass through
            untouched. The price is the other branch — slope exactly 0 — and{" "}
            <strong>
              a neuron whose input goes negative for every example stops learning forever
            </strong>
            : a dead ReLU. Drag the input marker below zero in the gallery and watch all eight bars
            go dark at once. Leaky ReLU keeps a trickle flowing for exactly this reason.
          </p>
        </Section>

        <Section
          index="§3"
          title="Backprop is the chain rule, run backwards"
          figure={<MLPTrainer />}
          figureLabel="fig. 03 — a 2→H→1 network learning live, full-batch, in your browser"
        >
          <p>
            To walk downhill you need the slope — the gradient of the loss with respect to every
            weight. Backpropagation computes all of them in one backwards sweep:{" "}
            <strong>
              each layer asks &ldquo;how much did my output matter?&rdquo; and multiplies in how
              much it, in turn, depended on each of its weights
            </strong>
            . It&rsquo;s the calculus chain rule with good bookkeeping — nothing more exotic, even
            in a model with a billion weights instead of the seventeen below.
          </p>
          <p>
            The figure runs that loop for real: forward pass, backward pass, step, hundreds of times
            a second. Give it the checker — the dataset station 01&rsquo;s KNN could only handle by
            memorizing neighbors — and watch a four-neuron network <em>bend</em> its way to the same
            answer with seventeen numbers. Then cut it to two neurons: the loss stalls high, because
            two bends genuinely cannot carve four quadrants.
          </p>
        </Section>

        <Section index="§4" title="Why everyone uses Adam">
          <p>
            Plain SGD has one move — step straight downhill — and the race above shows both ways it
            goes wrong. On the ravine it zigzags: the walls are steep, the floor is shallow, and one
            learning rate can&rsquo;t serve both. On the saddle it crawls, because{" "}
            <strong>
              almost-flat is almost-stopped when your step is proportional to the slope
            </strong>
            . Real loss landscapes, in millions of dimensions, are mostly ravines and saddles.
          </p>
          <p>
            Momentum fixes the first problem with memory: keep 90% of last step&rsquo;s velocity,
            and the zigzags cancel while progress compounds. Adam adds the second fix —{" "}
            <strong>each weight gets its own step size</strong>, scaled by how big its gradients
            have recently been — so the shallow direction gets boosted and the steep one reined in.
            Watch it cross the saddle&rsquo;s plateau while SGD is still deciding. Every model in
            the later stations — and every diffusion checkpoint you&rsquo;ll ever load into ComfyUI
            — was trained by Adam or one of its descendants.
          </p>
        </Section>

        <Bridge from="/neural-networks">
          <p>
            The networks here saw two numbers at a time. Images are about to hand them a quarter
            million — and the first instinct, treating every pixel as an unrelated input, wastes
            everything the picture is. The road to convolution starts at the next bench. But first:
            a short interlude about the word <em>nearest</em>, which is about to mean two completely
            different things.
          </p>
        </Bridge>
      </div>
    </div>
  );
}
