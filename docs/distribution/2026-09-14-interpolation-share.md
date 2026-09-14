# Interpolation page: sharing and follow-up

Prepared September 14, 2026. The content changes are local until published.

## Publish checklist

- Publish the updated build through the site's existing deployment workflow.
- Open https://perceptronlab.com/interlude and confirm the heading begins
  "Nearest-neighbor interpolation vs." and the comparison table appears.
- Switch between "pixel art" and "smooth gradient" to check the experiment.
- Request indexing for that URL once after publishing.

## A post to adapt

Title: Why does resizing pixel art make it blurry? I built a visual comparison.

I built a small browser experiment that enlarges the same image with nearest
neighbor, bilinear, and bicubic interpolation, side by side.

Start with the pixel-art mushroom and look at its outline. Then switch to the
smooth gradient and compare the color transitions. It makes the tradeoff much
easier to see than a dropdown of filter names.

The page also explains when each method is useful and why image interpolation
is different from K-nearest neighbors in machine learning.

Free, no signup: https://perceptronlab.com/interlude

I'd like to hear which explanation is still confusing, or what image would make
the comparison more useful.

## Your next steps

1. After publishing, adapt the post for one community you participate in whose
   current rules allow sharing your own educational projects.
2. Attach a short screen recording switching between the two sample images.
3. Reply to feedback and note repeated questions for the next content update.
4. Choose visitor analytics. If using GA4, provide its public measurement ID
   (G-...) so installation can be completed. Search Console does not measure
   visits from shared links.

## Baseline and review

Search Console API, Web search, August 16–September 12, 2026:

- Site: 0 clicks, 258 impressions, average position 63.6.
- `/interlude`: 0 clicks, 96 impressions, average position 61.0.
- Example reported queries: nearest rendering; bilinear vs nearest neighbor;
  nearest neighbor vs bilinear vs bicubic.
- All nine sitemap URLs were submitted and indexed at the September 14 check.

Review again around September 28–October 12. Compare equal periods and record
clicks, impressions, and positions for relevant queries on `/interlude`.
Search Console hides some queries for privacy, so query rows do not represent
all impressions. Small samples can swing sharply; this is a checkpoint, not a
promise that rankings will improve by then.

The current `scripts/gsc-report.ts --days 28` includes both date endpoints and
uses today's date. For exact comparisons, use a custom 28-day range ending on
the latest complete day in Search Console.
