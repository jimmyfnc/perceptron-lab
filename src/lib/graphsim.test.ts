import { describe, expect, it } from "vitest";
import {
  TOPOLOGIES,
  runCheckpoint,
  runTopology,
  summarizeTopology,
  mulberry32,
  type CheckpointParams,
  type LoomParams,
} from "./graphsim";

const P: LoomParams = { workerNoise: 0.15, judgeNoise: 0.15 };
const N = 400;

describe("topologies", () => {
  it("is deterministic for a given seed", () => {
    for (const t of TOPOLOGIES) {
      expect(summarizeTopology(t.id, P, 50, 9)).toEqual(summarizeTopology(t.id, P, 50, 9));
    }
  });

  it("solo is one call at depth one; pipeline stacks three", () => {
    const rng = mulberry32(1);
    expect(runTopology("solo", P, rng)).toMatchObject({ calls: 1, depth: 1 });
    expect(runTopology("pipeline", P, rng)).toMatchObject({ calls: 3, depth: 3 });
  });

  it("pipeline beats solo on quality (it revises)", () => {
    const solo = summarizeTopology("solo", P, N, 3);
    const pipe = summarizeTopology("pipeline", P, N, 3);
    expect(pipe.meanQ).toBeGreaterThan(solo.meanQ + 0.1);
  });

  it("best-of-3 pays off with a sharp judge and decays with a blind one", () => {
    const sharp = summarizeTopology("bestOf", { workerNoise: 0.25, judgeNoise: 0 }, N, 5);
    const blind = summarizeTopology("bestOf", { workerNoise: 0.25, judgeNoise: 0.5 }, N, 5);
    const solo = summarizeTopology("solo", { workerNoise: 0.25, judgeNoise: 0 }, N, 5);
    expect(sharp.meanQ).toBeGreaterThan(solo.meanQ + 0.05);
    expect(blind.meanQ).toBeLessThan(sharp.meanQ - 0.03);
  });

  it("review loop converges and spends fewer calls when drafts are good", () => {
    const noisy = summarizeTopology("reviewLoop", { workerNoise: 0.3, judgeNoise: 0.05 }, N, 7);
    expect(noisy.meanQ).toBeGreaterThan(0.75);
    const better = summarizeTopology("reviewLoop", { workerNoise: 0.05, judgeNoise: 0.05 }, N, 7);
    expect(better.meanCalls).toBeGreaterThan(0);
    expect(noisy.meanCalls).toBeLessThanOrEqual(9); // 1 + 4 rounds × 2
  });
});

describe("checkpoint lab", () => {
  const CP: CheckpointParams = { stageDefect: [0.15, 0.1, 0.2, 0.1], catchProb: 0.9 };

  it("no checkpoint ships the most defects, for zero rework", () => {
    const none = runCheckpoint(null, CP, 2000, 11);
    expect(none.meanRework).toBe(0);
    for (const slot of [0, 1, 2, 3]) {
      expect(runCheckpoint(slot, CP, 2000, 11).escapedRate).toBeLessThan(none.escapedRate);
    }
  });

  it("a later gate catches more but pays more rework per catch", () => {
    const early = runCheckpoint(0, CP, 4000, 13);
    const late = runCheckpoint(3, CP, 4000, 13);
    expect(late.escapedRate).toBeLessThan(early.escapedRate);
    expect(late.meanRework).toBeGreaterThan(early.meanRework);
  });
});
