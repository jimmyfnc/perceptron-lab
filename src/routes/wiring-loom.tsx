import { createFileRoute, Link } from "@tanstack/react-router";
import { stationByPath, stationStyle } from "@/lib/journey";
import { pageHead } from "@/lib/site";
import { StationHero } from "@/components/site/StationHero";
import { Section } from "@/components/site/Section";
import { Term } from "@/components/site/Term";
import { GraphTrace } from "@/components/interactives/GraphTrace";
import { WiringLoom } from "@/components/interactives/WiringLoom";
import { CheckpointLab } from "@/components/interactives/CheckpointLab";

export const Route = createFileRoute("/wiring-loom")({
  head: () =>
    pageHead(
      "/wiring-loom",
      "Graph Engineering — The Wiring Loom | Perceptron Lab",
      "Agent systems as graphs: state, nodes, edges, and topology as a hyperparameter. Real router-vs-generalist runs on a local model, plus toy wiring labs.",
    ),
  component: WiringLoomPage,
});

const station = stationByPath("/wiring-loom")!;
const bench = stationByPath("/feedback-bench")!;

function WiringLoomPage() {
  return (
    <div style={stationStyle(station.hue)}>
      <StationHero
        station={station}
        kicker="Track II · the operator's manual"
        title={
          <>
            The Wiring <span className="text-station">Loom</span>
          </>
        }
        lede="This year the practice is called graph engineering; last year it was multi-agent orchestration, and next year it will be called something else. Ignore the label and keep the structure: when one loop stops being enough, you wire loops into a system — and the wiring itself becomes the thing you engineer. Below, the same tasks and the same model run through two different org charts, and only one of them is a graph."
        status="instrument live — trace the orgs · rewire the loom · place the gate"
      />

      {/* signature interactive */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-20">
        <GraphTrace />
        <p className="label-tech mt-4 text-center">
          fig. 01 — six checkable tasks, two real orgs, one local model: both score 6/6 — the bill
          is where they differ
        </p>
      </section>

      <div className="flex flex-col gap-20 pb-24">
        <Section index="§1" title="State, nodes, edges">
          <p>
            Strip the vocabulary and a graph-engineered system is three parts. A{" "}
            <Term k="node">node</Term> does one job — call a model, run a tool, fetch a document,
            ask a person. An <Term k="edge">edge</Term> decides who works next, and the decision can
            depend on what&rsquo;s happened so far. And <Term k="shared state">shared state</Term>{" "}
            is the record everyone reads and writes — the task, the drafts, the verdicts.{" "}
            <strong>The engineering is in the edges</strong>: a plain agent hides &ldquo;what
            happens next&rdquo; inside a model&rsquo;s judgment; a graph makes it an explicit,
            inspectable decision.
          </p>
          <p>
            That explicitness is the whole sales pitch. You can route conditionally, fan out in
            parallel, pause for approval, resume after a crash, and — the part that matters at 2
            a.m. — <em>see</em> which node did what to the state, in order.{" "}
            <strong>A loop you can&rsquo;t observe is a story; a graph is a record.</strong> The
            trace above is exactly that record for two tiny orgs, kept honestly.
          </p>
        </Section>

        <Section
          index="§2"
          title="Topology is a hyperparameter"
          figure={<WiringLoom />}
          figureLabel="fig. 02 — identical workers and judges; only the wiring changes"
        >
          <p>
            Once work is a graph, the shape of the graph is a knob — as real a knob as{" "}
            <Term k="temperature">temperature</Term> or learning rate, with the same kind of
            trade-off surface. The loom above holds every part constant: same noisy workers, same
            imperfect judge.{" "}
            <strong>Only the wiring changes, and quality, cost, and latency all move.</strong> A
            pipeline buys quality with depth; best-of-3 buys it with parallel cost; the review loop
            spends calls only when the reviewer is unhappy.
          </p>
          <p>
            And every wiring has a failure condition you can find with the sliders: crank the
            judge&rsquo;s noise and best-of-3 collapses back to a coin flip — three good drafts are
            worthless if the picker can&rsquo;t tell.{" "}
            <strong>
              No topology is best; each buys a different thing with a different budget.
            </strong>{" "}
            That&rsquo;s why it&rsquo;s a hyperparameter and not a doctrine.
          </p>
          <p>
            The real trace up top already cashed this out. Both orgs went six for six — a strong
            model doesn&rsquo;t need an org chart to solve small tasks — but the generalist paid{" "}
            <span className="readout text-sm">1448</span> tokens against the graph&rsquo;s{" "}
            <span className="readout text-sm">953</span>, most of it spent rambling through the IPv4
            regex that the specialist, boxed in by a tight output contract, dispatched in 92.{" "}
            <strong>Equal quality is not equal engineering</strong>: the wiring showed up on the
            bill, not the scoreboard.
          </p>
        </Section>

        <Section index="§3" title="Every edge closes somebody's loop">
          <p>
            Station O1 ended on one question — <em>who closes the loop?</em> A graph answers it{" "}
            <em>per edge</em>. The reviewer node closes the worker&rsquo;s loop. The{" "}
            <Term k="router">router</Term> closes a loop nobody talks about:{" "}
            <em>should this task even go to that worker?</em> In the trace above you can watch those
            edges decide — and if the router ever picks the wrong lane, you can watch a specialist
            confidently solve the wrong kind of problem.{" "}
            <strong>Edges are decisions, and decisions can be wrong</strong> — which is precisely
            why you want them out of the hidden prose of a mega-prompt and into wires you can test.
          </p>
          <p>
            The Feedback Bench&rsquo;s warning scales with the org: a node with a noisy
            self-estimate doesn&rsquo;t just fail locally,{" "}
            <strong>it exports its bad gradient to everyone downstream</strong>. Wiring a judge node
            into the graph is loss-function design at the org level — the same craft, one floor up.
          </p>
        </Section>

        <Section
          index="§4"
          title="The human is a node now"
          figure={<CheckpointLab />}
          figureLabel="fig. 03 — one human, four gates: placement beats intention"
        >
          <p>
            The ladder in O1 ended with the model closing its own loop. Graphs put you back in — not
            holding the loop, but wired into it as a <Term k="checkpoint">checkpoint</Term>: a node
            with a defined job, a defined position, and a budget.{" "}
            <strong>&ldquo;Human in the loop&rdquo; is a placement problem, not a vibe</strong> —
            the lab above has exactly one human to spend, and where you stand them changes what
            ships broken and what a catch costs to redo.
          </p>
          <p>
            The late gate ships the least and pays the most per catch; the early gate is cheap and
            blind to everything after it. There is no slot that wins both columns —{" "}
            <strong>
              governance is engineered under the same trade-offs as everything else in the graph
            </strong>
            . Which is the quiet promise of this whole discipline: when the word &ldquo;graph
            engineering&rdquo; is replaced next year, the placement problem, the noisy-judge
            problem, and the observable-record problem will still be here, wearing the new name.
          </p>
        </Section>

        {/* Track II bridge back to O1's foundations, then the map */}
        <section className="mx-auto w-full max-w-3xl px-6">
          <div className="border-t border-border pt-10">
            <p className="label-tech">Return</p>
            <div className="prose-lab mt-4">
              <p>
                Everything on this loom is O1&rsquo;s one question, asked once per edge. If you
                skipped the Feedback Bench, walk it first — the loom will read twice as clearly once
                you&rsquo;ve watched a single loop close by hand.
              </p>
            </div>
            <Link
              to={bench.path}
              style={stationStyle(bench.hue)}
              className="panel panel-ticks group mt-8 flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:border-station-dim"
            >
              <div>
                <p className="label-tech">Track II · {bench.num}</p>
                <p className="mt-1 font-display text-lg font-semibold">
                  {bench.title} — <span className="text-station">{bench.codename}</span>
                </p>
                <p className="mt-1 font-body text-sm text-muted-foreground">{bench.tagline}</p>
              </div>
              <span
                aria-hidden
                className="readout text-xl text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-station"
              >
                &lt;-
              </span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
