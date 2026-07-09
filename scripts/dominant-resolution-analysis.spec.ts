import { describe, expect, it } from "vitest";
import {
  analyzeDominantResolution,
  isDominantResolutionSupported
} from "../src/utils/music/analysis/strategies/DominantResolutionAnalysis";

describe("Dominant resolution analysis", () => {
  it("recognizes immediate dominant and SubV resolutions", () => {
    expect(analyzeDominantResolution(["G7alt", "Cmaj7"], 0)).toMatchObject({
      kind: "immediate",
      targetRoot: "C",
      resolvedAtOffset: 1
    });

    expect(analyzeDominantResolution(["Db7(b9)", "Cmaj7"], 0)).toMatchObject({
      kind: "subv-immediate",
      targetRoot: "C",
      resolvedAtOffset: 1
    });
  });

  it("recognizes delayed and prolonged dominant resolutions", () => {
    expect(analyzeDominantResolution(["G7alt", "Dm7", "Cmaj7"], 0)).toMatchObject({
      kind: "delayed",
      targetRoot: "C",
      resolvedAtOffset: 2
    });

    expect(analyzeDominantResolution(["G7alt", "G13", "Cmaj7"], 0)).toMatchObject({
      kind: "prolonged",
      targetRoot: "C",
      resolvedAtOffset: 2
    });
  });

  it("recognizes deceptive dominant motion without treating it as unresolved", () => {
    const majorDeceptive = analyzeDominantResolution(["G7(b9)", "Am7"], 0);
    const minorDeceptive = analyzeDominantResolution(["G7(b9)", "Abmaj7"], 0);
    const mediantDeceptive = analyzeDominantResolution(["D7(b9)", "Bm7"], 0);
    const flatMediantDeceptive = analyzeDominantResolution(["G7(b9)", "Ebmaj7"], 0);

    expect(majorDeceptive.kind).toBe("deceptive");
    expect(minorDeceptive.kind).toBe("deceptive");
    expect(mediantDeceptive.kind).toBe("deceptive");
    expect(flatMediantDeceptive.kind).toBe("deceptive");
    expect(isDominantResolutionSupported(majorDeceptive.kind)).toBe(true);
  });

  it("recognizes same-root color release as contextual support", () => {
    expect(analyzeDominantResolution(["A7alt", "A13"], 0)).toMatchObject({
      kind: "same-root-color-release",
      targetRoot: "D",
      resolvedAtOffset: 1
    });

    expect(analyzeDominantResolution(["C7(b9)", "C"], 0)).toMatchObject({
      kind: "same-root-color-release",
      targetRoot: "F",
      resolvedAtOffset: 1
    });
  });

  it("recognizes same-root dominant reentry as contextual support", () => {
    expect(analyzeDominantResolution(["Bb7(b9,b13)", "Fm7", "Bb7(9)", "Bbm6"], 0)).toMatchObject({
      kind: "dominant-reentry",
      targetRoot: "Eb",
      resolvedAtOffset: 2
    });

    expect(analyzeDominantResolution(["E7(#9)", "Dm", "E7(#9)", "F"], 0)).toMatchObject({
      kind: "dominant-reentry",
      targetRoot: "A",
      resolvedAtOffset: 2
    });
  });

  it("recognizes terminal dominants as formal boundary support", () => {
    expect(analyzeDominantResolution(["A7alt"], 0)).toMatchObject({
      kind: "terminal-dominant",
      targetRoot: "D",
      resolvedAtOffset: null
    });

    expect(isDominantResolutionSupported(analyzeDominantResolution(["A7alt"], 0).kind)).toBe(true);
  });

  it("keeps altered dominants without local target marked as unresolved", () => {
    expect(analyzeDominantResolution(["G7alt", "Bmaj7", "Fmaj7"], 0)).toMatchObject({
      kind: "unresolved",
      targetRoot: "C",
      resolvedAtOffset: null
    });
  });
});
