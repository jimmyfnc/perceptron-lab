import { describe, expect, it } from "vitest";
import { mulberry32, runBatch, runTrial, summarize, type SimParams } from "./loopsim";

const BASE: SimParams = {
  gain: 0.35,
  reviseNoise: 0.05,
  evalNoise: 0.25,
  threshold: 0.9,
  maxSteps: 12,
};

describe("mulberry32", () => {
  it("is deterministic and in [0,1)", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 100; i++) {
      const x = a();
      expect(x).toBe(b());
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });
});

describe("runTrial", () => {
  it("one-shot is a single draft, never revised", () => {
    const t = runTrial("oneshot", BASE, mulberry32(1));
    expect(t.steps).toHaveLength(1);
    expect(t.stop).toBe("oneshot");
    expect(t.final).toBeGreaterThanOrEqual(0.3);
    expect(t.final).toBeLessThanOrEqual(0.6);
  });

  it("external feedback with no noise climbs monotonically and converges", () => {
    const t = runTrial("external", { ...BASE, reviseNoise: 0 }, mulberry32(7));
    expect(t.stop).toBe("converged");
    for (let i = 1; i < t.steps.length; i++) {
      expect(t.steps[i].q).toBeGreaterThanOrEqual(t.steps[i - 1].q);
    }
    expect(t.final).toBeGreaterThanOrEqual(BASE.threshold);
  });

  it("external mode can never stop early — the judge sees the truth", () => {
    for (const t of runBatch("external", BASE, 200, 3)) {
      expect(t.stop).not.toBe("early");
    }
  });

  it("self mode with zero eval noise behaves exactly like external", () => {
    // identical rng draw sequences: evalNoise 0 means the extra rng() calls
    // in self mode still happen — compare outcomes statistically instead
    const self = summarize(runBatch("self", { ...BASE, evalNoise: 0 }, 300, 5), BASE.maxSteps);
    const ext = summarize(runBatch("external", { ...BASE, evalNoise: 0 }, 300, 5), BASE.maxSteps);
    expect(self.earlyRate).toBe(0);
    expect(Math.abs(self.meanFinal - ext.meanFinal)).toBeLessThan(0.02);
  });

  it("noisier self-evaluation stops early more often and lands lower", () => {
    const mild = summarize(runBatch("self", { ...BASE, evalNoise: 0.1 }, 400, 11), BASE.maxSteps);
    const wild = summarize(runBatch("self", { ...BASE, evalNoise: 0.4 }, 400, 11), BASE.maxSteps);
    expect(wild.earlyRate).toBeGreaterThan(mild.earlyRate);
    expect(wild.meanFinal).toBeLessThan(mild.meanFinal);
  });
});

describe("summarize", () => {
  it("meanCurve spans maxSteps+1 entries and holds finals flat", () => {
    const s = summarize(runBatch("external", BASE, 50, 9), BASE.maxSteps);
    expect(s.meanCurve).toHaveLength(BASE.maxSteps + 1);
    expect(s.meanCurve.at(-1)!).toBeCloseTo(s.meanFinal, 1);
    expect(s.meanCurve[0]).toBeLessThan(s.meanCurve.at(-1)!);
  });
});
