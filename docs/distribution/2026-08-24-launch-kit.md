# Distribution launch kit — 2026-08-24

Why this exists: first GSC data (2026-08-24) showed the site is invisible to
search — 40 impressions in 10 days, all brand collisions, zero clicks. A new
domain with no backlinks cannot rank on content alone. Distribution is both the
fast path to readers _and_ the source of the backlinks that make SEO work later.
Sites like CNN Explainer earned their rankings from a launch (paper + HN), not
keywords.

## Pre-flight checklist (in order)

- [x] Query-first titles deployed (commit 43fdde4)
- [ ] Lovable published the new build (check dashboard; watch for Lovable-authored revert commits)
- [ ] GSC: Request Indexing on `/`, `/computer-vision`, `/transformers`, `/diffusion`, `/interlude`
- [ ] **Analytics installed** — do this BEFORE posting anywhere, or the launch
      traffic is invisible (GSC only shows search). GA4 (needs a GA property +
      measurement ID) or Cloudflare Web Analytics (lighter, no cookies).
- [ ] OG card sanity check: paste `https://perceptronlab.com` into a Slack/Discord
      message and confirm the og.png renders
- [ ] Spread posts across days (one channel per day) so analytics can attribute
      which channel actually sends traffic

Timing: HN does best Tue–Thu, 8–10am ET. Reddit similar. Never post the same
link to multiple subreddits the same day.

---

## Show HN

Title (pick one, ≤80 chars, no hype words — HN mod-edits them away):

1. `Show HN: Perceptron Lab – interactive ML, from a perceptron to Stable Diffusion`
2. `Show HN: I rebuilt my ML learning journey as hand-built interactive instruments`
3. `Show HN: Learn ML by touching it – every concept is a hand-built interactive`

URL: `https://perceptronlab.com`

First comment (post it immediately after submitting — this is where the story
goes, not the title):

> Hi HN — I built this over the last few months while working through an MIT
> AI certificate, and it exists because of one confusing afternoon: a pixel-art
> workflow said "nearest-neighbor" and my ML course said "nearest neighbors,"
> and they turned out to be completely different ideas wearing the same name.
> Untangling that collision became the site's interlude, and then the rest of
> the journey grew around it: classical ML → neural nets → CNNs → transformers
> → diffusion, plus a second track on operating LLMs (prompting, loops, agents).
>
> Some implementation notes:
>
> - Every visualization is hand-rolled Canvas 2D or SVG — no chart libraries.
> - The transformers page explores 144 real attention heads extracted from
>   GPT-2 small, not a diagram of attention — you can find the induction heads.
> - The diffusion page scrubs a real Stable Diffusion 1.5 run (21 intermediate
>   states, generated on my own GPU), and the LoRA section runs an actual
>   Jacobi SVD in your browser.
> - The Track II transcripts are real runs on a local qwen3.6:27b — including
>   the honest result that my router and my generalist both scored 6/6 and the
>   only difference was the token bill.
>
> It's free, no signup, no ads. I'd love feedback on where the explanations
> lose you — every page is supposed to teach, not demo.

Engage every comment for the first 3–4 hours. Don't ask anyone to upvote
(HN detects and penalizes it). If it flops, that's allowed — Show HN permits
one repost after a week or two.

---

## Reddit — r/learnmachinelearning (primary)

Title:

> I built a free interactive site that teaches ML from KNN to Stable Diffusion —
> every concept is something you drag, not a video

Body:

> While working through an MIT AI certificate I kept hitting concepts that only
> clicked when I could poke them — so I built the thing I wanted: an
> "interactive field manual" that walks the same road I took, from classical ML
> to diffusion models.
>
> - **Bias–variance**: drag points and sweep k on a live KNN decision boundary
> - **Optimizers**: SGD, momentum, and Adam race down a 3D loss surface
> - **CNNs**: paint pixels and watch feature maps build cell by cell
> - **Transformers**: 144 real GPT-2 attention heads — find the induction head
> - **Diffusion**: scrub a real Stable Diffusion run from noise to image
>
> Free, no signup, no ads: https://perceptronlab.com
>
> Would genuinely love to know which explanations don't land — I'm one person
> and I've lost the ability to see it with fresh eyes.

Secondary (different week): r/MachineLearning with `[P]` flair, drier tone,
lead with the real-weights angle (GPT-2 head explorer + real SD1.5 scrubber).
Also viable later: r/artificial, r/compsci, r/dataisbeautiful (visual-first
framing).

---

## X / Twitter thread

1. I spent the last few months rebuilding my ML learning journey as a set of
   hand-built interactive instruments. From a perceptron to Stable Diffusion,
   every concept is something you operate, not watch. 🧵 perceptronlab.com
2. Station 01: the bias–variance tradeoff as a feeling, not an equation. Drag
   the points, sweep k, watch the test-error U-curve move. [clip of Boundary Lab]
3. Station 02: SGD, momentum, and Adam racing down the same 3D loss surface,
   same learning rate. You can see _why_ everyone uses Adam. [clip of Descent]
4. Station 04 is my favorite: 144 real attention heads from GPT-2 small. Hover
   tokens, switch heads, find the induction head that makes in-context learning
   work. [clip of Attention Lens]
5. Station 05: a real Stable Diffusion run, every intermediate state kept, so
   you can scrub the moment an image condenses out of noise — and catch the
   model guessing the ending early. [clip of Denoising Deck]
6. No chart libraries, no framework demos — hand-rolled Canvas/SVG, real model
   weights, free, no signup. Built because one confusing afternoon taught me
   that nearest-neighbor ≠ nearest neighbors. perceptronlab.com

Short screen recordings (5–10s each) massively outperform static screenshots.

---

## LinkedIn (the portfolio audience lives here)

> "Nearest-neighbor interpolation" and "K-nearest neighbors" are completely
> different ideas wearing the same name. Discovering that the hard way — mid
> MIT AI certificate, mid pixel-art project — turned into a few months of
> building Perceptron Lab: an interactive field manual for machine learning,
> from classical ML to Stable Diffusion.
>
> Everything is hand-built Canvas/SVG (no chart libraries), and the flagship
> pages run on real model internals: 144 attention heads extracted from GPT-2,
> a Stable Diffusion run scrubbed state by state, LoRA's low-rank math computed
> live in the browser.
>
> It's free and open to anyone learning ML: https://perceptronlab.com

---

## Newsletters & aggregators (submit once, low effort)

- TLDR AI — tldr.tech (submission form)
- Ben's Bites — bensbites.co
- Data Elixir — dataelixir.com/submit
- The Batch (deeplearning.ai) — long shot, but exactly the audience
- Hacker Newsletter picks up HN front-page automatically
- futurepedia / aggregator-style tool directories: skip — wrong audience, low-quality links

## After each post

Watch analytics + `bun scripts/gsc-report.ts --days 7` the following weeks:
backlinks from a good HN/Reddit thread typically show up in GSC as rising
impressions on _learning-intent_ queries within 2–6 weeks. That's the signal
the SEO flywheel has started.
