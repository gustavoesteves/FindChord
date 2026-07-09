import { describe, expect, it } from "vitest";
import type { ScoreHarmonyEvent } from "../src/utils/music/analysis/models/ScoreSnapshot";
import { collectUnresolvedDominantTensionCasesFromHarmonies } from "./audit-unresolved-dominant-tension";

function harmony(harmonySymbol: string, index: number): ScoreHarmonyEvent {
  return {
    measure: index + 1,
    beat: 1,
    harmony: harmonySymbol,
    tickStart: index * 480,
    tickEnd: (index + 1) * 480,
    durationTicks: 480
  };
}

function collect(chords: string[]) {
  return collectUnresolvedDominantTensionCasesFromHarmonies(chords.map(harmony), {
    file: "fixture.musicxml",
    title: "Fixture",
    referenceCenter: "C major",
    referenceIdiom: "major-functional"
  });
}

describe("Unresolved dominant tension audit", () => {
  it("collects only altered dominants that remain unresolved after contextual analysis", () => {
    const cases = collect(["Cmaj7", "G7alt", "Cmaj7", "A7(b9)", "Em7", "Bmaj7"]);

    expect(cases).toHaveLength(1);
    expect(cases[0]).toMatchObject({
      chord: "A7(b9)",
      expectedTarget: "D",
      reviewClass: "unresolved-review"
    });
  });

  it("does not collect terminal dominants as unresolved cases", () => {
    const terminal = collect(["Cmaj7", "G7alt"]);
    const unresolved = collect(["Cmaj7", "G7alt", "Bmaj7", "Fmaj7"]);

    expect(terminal).toHaveLength(0);
    expect(unresolved[0].reviewClass).toBe("unresolved-review");
  });
});
