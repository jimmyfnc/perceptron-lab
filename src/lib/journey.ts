/**
 * The journey — single source of truth for the site's stations.
 * Order mirrors the learning path: classical ML → diffusion.
 * Hues progress cool → warm across the journey.
 */
import type { CSSProperties } from "react";

export interface Station {
  /** Display index on the journey ("01".."05", interlude is unnumbered) */
  num: string;
  path: string;
  title: string;
  /** The signature interactive's name */
  codename: string;
  tagline: string;
  /** oklch hue for this station's accent */
  hue: number;
  status: "live" | "soon";
  interlude?: boolean;
  /** Short label for the header rail when `title` would risk clipping it */
  navLabel?: string;
}

export const STATIONS: Station[] = [
  {
    num: "01",
    path: "/foundations",
    title: "Classical ML",
    codename: "The Boundary Lab",
    tagline: "Bias, variance, and why k changes everything.",
    hue: 195,
    status: "live",
  },
  {
    num: "02",
    path: "/neural-networks",
    title: "Neural Networks",
    codename: "The Descent",
    tagline: "Watch optimizers race down a loss surface.",
    hue: 240,
    status: "live",
  },
  {
    num: "··",
    path: "/interlude",
    title: "Two Kinds of Nearest",
    codename: "Interlude",
    tagline: "Nearest-neighbor scaling is not K-nearest-neighbors.",
    hue: 160,
    status: "live",
    interlude: true,
    navLabel: "Interlude",
  },
  {
    num: "03",
    path: "/computer-vision",
    title: "CNNs & Vision",
    codename: "The Convolution Bench",
    tagline: "Paint pixels, slide kernels, watch features emerge.",
    hue: 305,
    status: "live",
  },
  {
    num: "04",
    path: "/transformers",
    title: "Transformers",
    codename: "The Attention Lens",
    tagline: "Every token looks at every other token.",
    hue: 340,
    status: "live",
  },
  {
    num: "05",
    path: "/diffusion",
    title: "Diffusion",
    codename: "The Denoising Deck",
    tagline: "From pure noise to an image, one step at a time.",
    hue: 75,
    status: "live",
  },
];

/**
 * Track II — the operator's manual. A parallel track teaching how to
 * *operate* models (prompting, sampling, loops, agency) rather than how
 * they work inside. Its own numbering ("O1"…) and its own hue family
 * (instrument green) so the two arcs read as mechanics vs. practice.
 */
export const OPERATOR_STATIONS: Station[] = [
  {
    num: "O1",
    path: "/feedback-bench",
    title: "Prompt · Loop · Agent",
    codename: "The Feedback Bench",
    tagline: "One question separates them: who closes the loop?",
    hue: 145,
    status: "live",
    // one word — "Feedback Bench" re-clipped the xl rail (the recurring bug)
    navLabel: "Bench",
  },
  {
    num: "O2",
    path: "/wiring-loom",
    title: "Graph Engineering",
    codename: "The Wiring Loom",
    tagline: "Loops compose into systems — topology is the new hyperparameter.",
    hue: 115,
    status: "live",
    navLabel: "Loom",
  },
];

/** Walks Track II in order; undefined after the last operator station. */
export function nextOperatorStation(path: string): Station | undefined {
  const i = OPERATOR_STATIONS.findIndex((s) => s.path === path);
  return i >= 0 ? OPERATOR_STATIONS[i + 1] : undefined;
}

export function stationByPath(path: string): Station | undefined {
  return STATIONS.find((s) => s.path === path) ?? OPERATOR_STATIONS.find((s) => s.path === path);
}

/** Walks the mechanics journey only — Track II ends stations by hand. */
export function nextStation(path: string): Station | undefined {
  const i = STATIONS.findIndex((s) => s.path === path);
  return i >= 0 ? STATIONS[i + 1] : undefined;
}

/** Inline style that re-tints all --station-* tokens for a page */
export function stationStyle(hue: number): CSSProperties {
  return { "--station-hue": String(hue) } as CSSProperties;
}
