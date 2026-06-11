import { createFileRoute } from "@tanstack/react-router";
import { stationByPath, stationStyle } from "@/lib/journey";
import { pageHead } from "@/lib/site";
import { Section } from "@/components/site/Section";
import { Bridge } from "@/components/site/Bridge";
import { AttentionLens } from "@/components/interactives/AttentionLens";
import { QKVSandbox } from "@/components/interactives/QKVSandbox";

export const Route = createFileRoute("/transformers")({
  head: () =>
    pageHead(
      "/transformers",
      "Transformers — The Attention Lens | Perceptron Lab",
      "Explore real GPT-2 attention heads over curated sentences — hover-token arcs, a head switcher, and a draggable Q·K·V sandbox that makes softmax attention tangible.",
    ),
  component: TransformersPage,
});

const station = stationByPath("/transformers")!;

function TransformersPage() {
  return (
    <div style={stationStyle(station.hue)}>
      {/* hero */}
      <section className="grid-paper">
        <div className="mx-auto w-full max-w-6xl px-6 pb-10 pt-16 md:pt-24">
          <p className="label-tech animate-rise">Station {station.num} · transformers</p>
          <h1 className="animate-rise mt-4 max-w-3xl font-display text-4xl font-bold tracking-tight [animation-delay:80ms] md:text-6xl">
            The Attention <span className="text-station">Lens</span>
          </h1>
          <p className="prose-lab animate-rise mt-6 max-w-2xl text-lg [animation-delay:160ms]">
            A convolution gathers context a neighborhood at a time. Attention skips the wait: every
            token gets to ask one question of every token before it, and decide for itself what
            matters. The weights below aren&rsquo;t a diagram of that idea — they&rsquo;re pulled
            from a real GPT-2, head by head.
          </p>
          <p className="label-tech animate-rise mt-8 [animation-delay:240ms]">
            <span className="led led-pulse mr-2 inline-block align-middle" />
            instrument live — hover the tokens · switch heads · try the finders
          </p>
        </div>
      </section>

      {/* signature interactive */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-20">
        <AttentionLens />
        <p className="label-tech mt-4 text-center">
          fig. 01 — 144 real attention heads (12 layers × 12), extracted from gpt-2 small
        </p>
      </section>

      <div className="flex flex-col gap-20 pb-24">
        <Section
          index="§1"
          title="One formula runs the whole show"
          figure={<QKVSandbox />}
          figureLabel="fig. 02 — softmax(q·k / √d) · v, with your hands on all three"
        >
          <p>
            Every head you flipped through above is the same five symbols:{" "}
            <code>softmax(QKᵀ/√d)·V</code>. Each token publishes three small vectors —{" "}
            <strong>
              a query (&ldquo;what am I looking for?&rdquo;), a key (&ldquo;what do I
              advertise?&rdquo;), and a value (&ldquo;what do I hand over if you pick me&rdquo;)
            </strong>
            . A token&rsquo;s query is dotted against every key; softmax turns the scores into
            weights that sum to one; the output is the weighted mix of values. That mix — not the
            original token — is what the next layer reads.
          </p>
          <p>
            The sandbox strips it to three tokens in two dimensions. Rotate the query toward a key
            and watch its weight eat the others; then play with the scale dial.{" "}
            <strong>The √d divisor is a thermostat</strong>: without it, dot products grow with
            dimension, softmax saturates to one-hot, and gradients die — the same vanishing story as
            station 02&rsquo;s sigmoid, solved by a constant.
          </p>
        </Section>

        <Section index="§2" title="Heads are specialists, and you just met three">
          <p>
            Why twelve heads per layer instead of one? Because one softmax is one spotlight — it
            can&rsquo;t look two places with full strength at once.{" "}
            <strong>
              Multiple heads let the model run many small, different queries in parallel
            </strong>
            , and trained networks turn them into specialists. The finder buttons in the lens locate
            three famous ones in this very model: a <em>previous-token head</em> that always reads
            one step back, an <em>attention sink</em> that parks its budget on the first token when
            it has nothing better to do, and whichever head answers most decisively.
          </p>
          <p>
            These aren&rsquo;t curiosities — they&rsquo;re the units interpretability researchers
            actually study. Try the <em>wizard</em> sentence: somewhere in the middle layers a head
            attends from the second &ldquo;wizard&rdquo; back toward the first occurrence&rsquo;s
            neighborhood. That&rsquo;s the shadow of an{" "}
            <strong>
              induction head — the circuit that lets a model repeat and extend patterns it has only
              just seen
            </strong>
            , widely credited as a seed of in-context learning.
          </p>
        </Section>

        <Section index="§3" title="Reading the lens like an engineer">
          <p>
            Two artifacts in the instrument are load-bearing. The empty upper triangle in the matrix
            is the{" "}
            <strong>
              causal mask: a GPT predicting the next token is forbidden to peek at the future
            </strong>
            , so every query may only dot against keys at or before its own position. Models like
            BERT drop the mask and let every token see both directions — better for understanding,
            useless for generation.
          </p>
          <p>
            And the dashed chips: GPT-2 never sees words. <strong>It sees BPE subwords</strong> —
            &ldquo;didn&rsquo;t&rdquo; arrives as <code>didn</code> + <code>&rsquo;t</code>,
            &ldquo;Diffusion&rdquo; as two pieces. The attention machinery is also how those
            fragments reassemble into meaning: the second half of a split word reliably attends hard
            to its first half.
          </p>
        </Section>

        <Section index="§4" title="From one head to a transformer">
          <p>
            The rest of the architecture is plumbing around the lens. Each block runs its heads,
            mixes their outputs, then hands every token to a small MLP — station 02&rsquo;s
            machinery, applied position-by-position. A <em>residual connection</em> adds each
            block&rsquo;s output back onto its input, so{" "}
            <strong>information flows down a highway that attention and MLPs only edit</strong>,
            never replace — that&rsquo;s what lets gradients survive 96 layers where eight sigmoids
            starved. Stack the blocks, add a positional signal so &ldquo;order&rdquo; exists at all,
            and you have GPT.
          </p>
          <p>
            This same lens is already in your image pipeline. The prompt you type into ComfyUI goes
            through CLIP&rsquo;s text transformer — these exact mechanics — before it steers a
            single pixel, and{" "}
            <strong>
              cross-attention is where a diffusion model&rsquo;s denoiser looks at your words
            </strong>{" "}
            while deciding what the noise should become. Which is exactly where this journey ends
            next.
          </p>
        </Section>

        <Bridge from="/transformers">
          <p>
            You now hold both halves: networks that learn features from pixels, and attention that
            binds meaning across a sequence. The last station puts them together backwards — start
            from pure noise, and remove it one step at a time, with a transformer-guided U-Net
            deciding at every step what your prompt implies the image should be.
          </p>
        </Bridge>
      </div>
    </div>
  );
}
