import { createFileRoute, Link } from "@tanstack/react-router";
import { stationByPath, stationStyle } from "@/lib/journey";
import { pageHead } from "@/lib/site";
import { StationHero } from "@/components/site/StationHero";
import { Section } from "@/components/site/Section";
import { DenoisingDeck } from "@/components/interactives/DenoisingDeck";
import { NoiseSchedule } from "@/components/interactives/NoiseSchedule";
import { CFGStrip } from "@/components/interactives/CFGStrip";
import { LatentWalk } from "@/components/interactives/LatentWalk";
import { LoraRankLab } from "@/components/interactives/LoraRankLab";

export const Route = createFileRoute("/diffusion")({
  head: () =>
    pageHead(
      "/diffusion",
      "Diffusion — The Denoising Deck | Perceptron Lab",
      "Scrub a real Stable Diffusion run state by state — noise schedules, CFG, latent walks, and LoRA's low-rank trick, all hands-on.",
    ),
  component: DiffusionPage,
});

const station = stationByPath("/diffusion")!;

function DiffusionPage() {
  return (
    <div style={stationStyle(station.hue)}>
      <StationHero
        station={station}
        kicker="diffusion"
        title={
          <>
            The Denoising <span className="text-station">Deck</span>
          </>
        }
        lede="Every image a diffusion model has ever made started as pure static. The deck below is a real Stable Diffusion 1.5 run — sampled on this site's own GPU, every intermediate state kept — so you can scrub the moment an image condenses out of noise, and catch the model guessing the ending long before it gets there."
        status="instrument live — scrub the run · switch views · compare seeds"
      />

      {/* signature interactive */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-20">
        <DenoisingDeck />
        <p className="label-tech mt-4 text-center">
          fig. 01 — one ddim run, 21 states, three ways to look at each
        </p>
      </section>

      <div className="flex flex-col gap-20 pb-24">
        <Section
          index="§1"
          title="Noise is the curriculum"
          figure={<NoiseSchedule />}
          figureLabel="fig. 02 — the forward process, computed live on a 48×48 scene"
        >
          <p>
            Diffusion training never shows the model how to paint — it shows it ruined paintings.
            Take an image, mix in gaussian noise at a randomly chosen severity t, and ask one
            question: <strong>&ldquo;what noise was added?&rdquo;</strong> The schedule ᾱ controls
            severity: near t=0 the image is barely touched, near t=1000 nothing of it survives. One
            network learns the whole range — denoising a nearly-clean image teaches texture,
            denoising near-static teaches composition.
          </p>
          <p>
            The figure runs the real corruption formula on a toy scene. Notice the curve:{" "}
            <strong>destruction is scheduled, not linear</strong> — ᾱ falls slowly at first, then
            dives. And because the closed form jumps straight to any t, training never has to walk
            there step by step. That convenience is the whole reason the math works at scale.
          </p>
        </Section>

        <Section index="§2" title="Sampling runs the film backwards">
          <p>
            Generation is the inverse loop: start from pure noise, and twenty-odd times in a row,
            predict the noise and remove a scheduled slice of it. That&rsquo;s the loop your ComfyUI
            KSampler runs, and it&rsquo;s what the deck&rsquo;s <em>canvas</em> view shows: the
            actual state, still snowy until surprisingly late.
          </p>
          <p>
            The deck&rsquo;s <em>guess</em> view is the revealing one. Because the model predicts
            the noise, you can algebraically peek at what it currently believes the finished image
            is —{" "}
            <strong>
              by state 5 of 20 it has already committed to a lighthouse, a cliff, and a dusk sky
            </strong>
            , and the remaining steps only sharpen the verdict. Composition is decided early at high
            noise; detail is negotiated late at low noise. That&rsquo;s also why so many ComfyUI
            tricks — refiners, hi-res passes, prompt scheduling — split the run into an early
            &ldquo;layout&rdquo; phase and a late &ldquo;rendering&rdquo; phase.
          </p>
        </Section>

        <Section
          index="§3"
          title="The prompt's volume knob"
          figure={<CFGStrip />}
          figureLabel="fig. 03 — same starting noise, four guidance scales"
        >
          <p>
            Station 04 showed where the prompt enters: cross-attention, the denoiser reading your
            words through CLIP. Classifier-free guidance decides how loudly. Each step the model
            predicts twice — once with your prompt, once with an empty one — and{" "}
            <strong>
              CFG extrapolates past the unconditioned guess in the direction your prompt pulls
            </strong>
            : output = uncond + cfg·(cond − uncond).
          </p>
          <p>
            The strip is the same starting noise at four volumes. At 1 the prompt is a whisper and
            the model paints whatever the noise suggested. At 12 every step is yanked so hard toward
            &ldquo;lighthouse, dramatic, golden&rdquo; that contrast clips and sameness sets in.{" "}
            <strong>The 7&ndash;8 default is a truce, not a law</strong> — knowing what the knob
            actually does is what lets you break it on purpose.
          </p>
        </Section>

        <Section
          index="§4"
          title="Latent space is a place"
          figure={<LatentWalk />}
          figureLabel="fig. 04 — nine full runs, starting noises slerped between two seeds"
        >
          <p>
            None of this happens on pixels. A VAE compresses each 512×512 image into the 64×64×4
            tensor you saw in the deck&rsquo;s <em>raw latent</em> view — 48× smaller — and the
            U-Net denoises there; only the final latent gets decoded back to pixels.{" "}
            <strong>That compression is why this runs on a desktop GPU at all</strong>, and
            it&rsquo;s the &ldquo;latent&rdquo; in latent diffusion.
          </p>
          <p>
            The walk shows the deeper property: interpolate between two seeds&rsquo; starting noise
            and sample each point fully, and{" "}
            <strong>every stop along the path is a coherent scene</strong> — the lighthouse
            relocates, the clouds renegotiate, nothing ever tears. Generative latent spaces
            aren&rsquo;t lookup tables of memorized images; they&rsquo;re smooth maps where
            neighborhoods mean something. Station 01&rsquo;s nearest-neighbor lab had no such
            geometry — this is what eighty pages of gradient descent buys.
          </p>
        </Section>

        <Section
          index="§5"
          title="LoRA: fine-tuning on a budget"
          figure={<LoraRankLab />}
          figureLabel="fig. 05 — a weight update rebuilt from its top-r singular directions"
        >
          <p>
            Teaching a checkpoint a new style shouldn&rsquo;t require rewriting all 860 million
            weights, and LoRA&rsquo;s bet is that it doesn&rsquo;t:{" "}
            <strong>the change a fine-tune needs is low-rank</strong> — a coordinated nudge along a
            few directions, not 860M independent edits. So instead of learning ΔW directly, a LoRA
            learns two skinny matrices A and B whose product <em>is</em> the update, at a tiny
            fraction of the parameters.
          </p>
          <p>
            The lab makes that bet visceral with a 16×16 &ldquo;update&rdquo;: slide the rank and
            watch the bolt survive at r=3 — 96 numbers doing the work of 256. Scale the same ratio
            to a U-Net&rsquo;s attention layers and you get the 10&ndash;200&nbsp;MB LoRA files in
            your ComfyUI folder standing in for multi-gigabyte checkpoints. Every slider
            you&rsquo;ve dragged on this site — k, learning rate, heads, rank — has been the same
            lesson: <strong>capacity is a dial, and knowing where it lives is the skill</strong>.
          </p>
        </Section>

        {/* end of the journey — no bridge, the rack is complete */}
        <section className="mx-auto w-full max-w-3xl px-6">
          <div className="panel panel-ticks px-6 py-8 text-center">
            <p className="label-tech">
              <span className="led mr-2 inline-block align-middle" />
              all five instruments live
            </p>
            <p className="prose-lab mx-auto mt-4 max-w-xl">
              That&rsquo;s the journey: a line through a cloud of points, bent by activations,
              composed into vision, bound by attention, and finally run in reverse until static
              becomes a lighthouse. The best next instrument is a real one — open ComfyUI and watch
              these ideas operate at full scale.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Link to="/" className="btn-tech">
                back to the journey map
              </Link>
              <Link to="/foundations" className="btn-tech">
                start over at station 01
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
