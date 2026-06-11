import { describe, expect, it } from "vitest";
import { STATIONS, nextStation, stationByPath, stationStyle } from "./journey";

describe("journey registry", () => {
  it("has six stations with unique paths", () => {
    expect(STATIONS).toHaveLength(6);
    expect(new Set(STATIONS.map((s) => s.path)).size).toBe(6);
  });

  it("orders the journey classical ML → diffusion", () => {
    expect(STATIONS[0].path).toBe("/foundations");
    expect(STATIONS.at(-1)!.path).toBe("/diffusion");
  });

  it("stationByPath resolves every nav path", () => {
    for (const s of STATIONS) expect(stationByPath(s.path)).toBe(s);
    expect(stationByPath("/nope")).toBeUndefined();
  });

  it("nextStation walks the journey and ends after diffusion", () => {
    expect(nextStation("/computer-vision")?.path).toBe("/transformers");
    expect(nextStation("/diffusion")).toBeUndefined();
    expect(nextStation("/nope")).toBeUndefined();
  });

  it("stationStyle emits the --station-hue custom property", () => {
    expect(stationStyle(305)).toEqual({ "--station-hue": "305" });
  });

  it("every station has the fields the UI renders", () => {
    for (const s of STATIONS) {
      expect(s.title).toBeTruthy();
      expect(s.codename).toBeTruthy();
      expect(s.tagline).toBeTruthy();
      expect(s.num).toBeTruthy();
      expect(s.hue).toBeGreaterThanOrEqual(0);
      expect(["live", "soon"]).toContain(s.status);
    }
  });
});
