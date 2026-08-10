import { createFileRoute, Link } from "@tanstack/react-router";
import { stationByPath, stationStyle } from "@/lib/journey";
import { pageHead } from "@/lib/site";
import { StationHero } from "@/components/site/StationHero";
import { Section } from "@/components/site/Section";
import { Term } from "@/components/site/Term";
import { LoopPlayer } from "@/components/interactives/LoopPlayer";
import { PromptAnatomyGrid } from "@/components/interactives/PromptAnatomyGrid";
import { TokenSampler } from "@/components/interactives/TokenSampler";
import { LoopSimulator } from "@/components/interactives/LoopSimulator";

export const Route = createFileRoute("/feedback-bench")({
  head: () =>
    pageHead(
      "/feedback-bench",
      "Prompt · Loop · Agent — The Feedback Bench | Perceptron Lab",
      "Prompt, loop, and agentic engineering are one question: who closes the loop? Scrub real local-LLM transcripts of the same task solved three ways.",
    ),
  component: FeedbackBenchPage,
});

const station = stationByPath("/feedback-bench")!;
const descent = stationByPath("/neural-networks")!;

function FeedbackBenchPage() {
  return (
    <div style={stationStyle(station.hue)}>
      <StationHero
        station={station}
        kicker="Track II · the operator's manual"
        title={
          <>
            The Feedback <span className="text-station">Bench</span>
          </>
        }
        lede="Prompt engineering, loop engineering, agentic engineering — the terms churn, but they name rungs of one ladder, and the ladder is a single question: who closes the loop? Nobody, you, or the model itself. Below, one real task runs all three ways on a local model — same weights, same temperature — and you can scrub through what actually happened."
        status="instrument live — scrub the transcripts · flip the toggles · sample a token"
      />

      {/* signature interactive */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-20">
        <LoopPlayer />
        <p className="label-tech mt-4 text-center">
          fig. 01 — one task, three rungs: real qwen3.6-27b transcripts, generated on my own GPU
        </p>
      </section>

      <div className="flex flex-col gap-20 pb-24">
        <Section
          index="§1"
          title="The prompt is the whole program"
          figure={<PromptAnatomyGrid />}
          figureLabel="fig. 02 — role, context, constraints, example: 16 real outputs, one question"
        >
          <p>
            On the first rung nobody closes the loop: you get one shot, so{" "}
            <strong>every bit of intelligence you can offer has to ride in with the input</strong>.
            That&rsquo;s all &ldquo;prompt engineering&rdquo; is — not incantations, just the four
            honest levers: who the <Term k="model">model</Term> should be (a{" "}
            <Term k="system prompt">system prompt</Term>), who it&rsquo;s talking to, what shape the
            answer must take, and an example worth imitating.
          </p>
          <p>
            The grid above holds everything else fixed — same model, same <Term k="seed">seed</Term>{" "}
            — so each toggle shows a causal delta, not luck. Watch the bare question come back as a
            jargon lecture, then watch <em>constraints</em> snap it to two clean sentences.{" "}
            <strong>
              The output was always in the model; the prompt decides which output you meet.
            </strong>
          </p>
        </Section>

        <Section
          index="§2"
          title="Where the words come from"
          figure={<TokenSampler />}
          figureLabel="fig. 03 — real GPT-2 logits; temperature, top-k, and top-p computed live"
        >
          <p>
            Before going near loops you should see the dice. A language model doesn&rsquo;t emit
            words — it emits <Term k="logits">logits</Term>, one score for every{" "}
            <Term k="token">token</Term> it knows, squashed by <Term k="softmax">softmax</Term> into
            a probability list. <strong>Your reply is one draw from that list</strong>, and the
            sampler&rsquo;s knobs — <Term k="temperature">temperature</Term>, top-k,{" "}
            <Term k="top-p">top-p</Term> — reshape it before the draw.
          </p>
          <p>
            The distributions above are real GPT-2. Try <em>arithmetic</em>: even &ldquo;two plus
            two equals&rdquo; isn&rsquo;t a sure thing to a small model — its favorite next word is{" "}
            <em>one</em>.{" "}
            <strong>
              Variance isn&rsquo;t a bug you prompt away; it&rsquo;s the raw material every loop is
              built to tame.
            </strong>{" "}
            Cold sampling gives you repeatable mediocrity; hot sampling gives you occasional
            brilliance you&rsquo;ll need feedback to catch.
          </p>
        </Section>

        <Section
          index="§3"
          title="A loop is descent — and you are the loss function"
          figure={<LoopSimulator />}
          figureLabel="fig. 04 — same revisions, different stop signal: truth vs the worker's own estimate"
        >
          <p>
            The second rung: you close the loop. Draft, judge, feed the judgment back, revise — run
            it in the player above and the resemblance to station 02 is not a metaphor.{" "}
            <strong>
              A feedback loop with a model inside is <Term k="gradient">gradient</Term> descent
              where you are the loss function
            </strong>
            : your critique is the gradient, each revision is a step, and the whole machine
            converges only if the signal you feed it actually points downhill.
          </p>
          <p>
            The simulator strips that to the studs — no LLM, just drafts that improve when revised
            and a rule for when to stop. Give the stop signal to an external judge who sees true
            quality and the curves converge every time. Give it to the worker&rsquo;s own noisy
            self-estimate and drag the noise up:{" "}
            <strong>
              trials start quitting below the bar while sincerely believing they cleared it
            </strong>
            . Keep that picture — it&rsquo;s the whole next section.
          </p>
        </Section>

        <Section index="§4" title="When the model closes the loop">
          <p>
            The third rung hands the model the loop itself: a goal, a tool, and the right to decide
            its own next step. That&rsquo;s all an <Term k="agent">agent</Term> is.{" "}
            <strong>Agentic engineering is loss-function design</strong> — the model is now
            estimating its own gradient, and everything that makes agents powerful or fragile falls
            out of how good that estimate is.
          </p>
          <p>
            Scrub the player&rsquo;s transcripts again and watch the middle rung carefully: the
            critique loop <em>found</em> the spec&rsquo;s ambiguity — should a bare{" "}
            <span className="readout text-sm">&lsquo;45&rsquo;</span> parse as seconds or raise an
            error? — reasoned about it honestly, and chose wrong, because{" "}
            <strong>
              reflection can tell you where the spec is silent, but it cannot tell you which
              reasonable answer reality picked
            </strong>
            . The agent didn&rsquo;t out-think it. It ran the tests, read{" "}
            <em>expected 45, got ValueError</em>, and stopped guessing. Ground truth beat
            introspection in two moves — that&rsquo;s why the operator&rsquo;s craft is mostly
            building loops whose feedback carries real signal: tests, compilers, rubrics, users.
            (This site is itself the exhibit: every station was built with an agent in exactly this
            kind of loop, with me and a build server as the loss function.)
          </p>
        </Section>

        {/* Track II closes by pointing back at the mechanics that explain it */}
        <section className="mx-auto w-full max-w-3xl px-6">
          <div className="border-t border-border pt-10">
            <p className="label-tech">Return</p>
            <div className="prose-lab mt-4">
              <p>
                Every idea on this bench leaned on one from the mechanics track: the loop is
                descent, the critique is a gradient, the agent&rsquo;s self-estimate is a loss
                function of unknown quality. If those words are still abstract, walk the machine
                room where they&rsquo;re played by real optimizers on a real surface.
              </p>
            </div>
            <Link
              to={descent.path}
              style={stationStyle(descent.hue)}
              className="panel panel-ticks group mt-8 flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:border-station-dim"
            >
              <div>
                <p className="label-tech">Back on the journey · {descent.num}</p>
                <p className="mt-1 font-display text-lg font-semibold">
                  {descent.title} — <span className="text-station">{descent.codename}</span>
                </p>
                <p className="mt-1 font-body text-sm text-muted-foreground">{descent.tagline}</p>
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
      </div>
    </div>
  );
}
