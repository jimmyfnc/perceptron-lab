import { describe, expect, it } from "vitest";
import { alphaBars, betaSchedule, gaussianField, noisyMix, snr } from "./diffusion";

describe("schedule", () => {
  it("betas rise linearly from 1e-4 to 0.02", () => {
    const b = betaSchedule(1000);
    expect(b[0]).toBeCloseTo(1e-4, 10);
    expect(b[999]).toBeCloseTo(0.02, 10);
    expect(b[500]).toBeGreaterThan(b[100]);
  });

  it("ᾱ decays monotonically from ~1 toward 0", () => {
    const a = alphaBars(1000);
    expect(a[0]).toBeCloseTo(1 - 1e-4, 6);
    for (let t = 1; t < 1000; t++) expect(a[t]).toBeLessThan(a[t - 1]);
    expect(a[999]).toBeLessThan(0.001); // nearly pure noise at the end
  });

  it("snr is signal over noise", () => {
    expect(snr(0.5)).toBeCloseTo(1, 10);
    expect(snr(0.9)).toBeGreaterThan(snr(0.1));
  });
});

describe("forward process", () => {
  it("ᾱ=1 returns the image, ᾱ=0 returns the noise", () => {
    expect(noisyMix(0.7, -1.3, 1)).toBeCloseTo(0.7, 10);
    expect(noisyMix(0.7, -1.3, 0)).toBeCloseTo(-1.3, 10);
  });

  it("variance is preserved for unit-variance signal and noise", () => {
    // var = ᾱ·var(x0) + (1−ᾱ)·var(ε) = 1 when both are 1
    const abar = 0.37;
    const x = gaussianField(4096, 1);
    const e = gaussianField(4096, 2);
    let v = 0;
    for (let i = 0; i < x.length; i++) v += noisyMix(x[i], e[i], abar) ** 2;
    expect(v / x.length).toBeGreaterThan(0.85);
    expect(v / x.length).toBeLessThan(1.15);
  });
});

describe("gaussianField", () => {
  it("is deterministic per seed with ~standard moments", () => {
    const a = gaussianField(8192, 9);
    const b = gaussianField(8192, 9);
    expect(a[0]).toBe(b[0]);
    const mean = a.reduce((s, v) => s + v, 0) / a.length;
    const varc = a.reduce((s, v) => s + (v - mean) ** 2, 0) / a.length;
    expect(Math.abs(mean)).toBeLessThan(0.05);
    expect(varc).toBeGreaterThan(0.9);
    expect(varc).toBeLessThan(1.1);
  });
});
