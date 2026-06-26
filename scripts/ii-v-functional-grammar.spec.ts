import { describe, expect, it } from "vitest";
import { detectIiVFunctionalCells } from "../src/utils/music/analysis/strategies/IiVFunctionalGrammar";
import type { ScoreHarmonyEvent } from "../src/utils/music/analysis/models/ScoreSnapshot";

function harmonies(chords: string[]): ScoreHarmonyEvent[] {
  return chords.map((harmony, index) => ({
    measure: index + 1,
    beat: 1,
    harmony,
    tickStart: index * 1920,
    tickEnd: (index + 1) * 1920,
    durationTicks: 1920
  }));
}

describe("F26.8a ii-V Functional Grammar Detection", () => {
  it("detects a major ii-V-I as a local major region", () => {
    const cells = detectIiVFunctionalCells(harmonies(["Dm7", "G7", "Cmaj7"]));

    expect(cells).toEqual([
      expect.objectContaining({
        kind: "MAJOR_II_V_I",
        region: { tonic: "C", mode: "major", scope: "cadential-cell" },
        chords: ["Dm7", "G7", "Cmaj7"]
      })
    ]);
  });

  it("detects a minor iiø-V-i as a local minor region", () => {
    const cells = detectIiVFunctionalCells(harmonies(["Bm7(b5)", "E7(b13)", "Am6"]));

    expect(cells).toEqual([
      expect.objectContaining({
        kind: "MINOR_IIØ_V_I",
        region: { tonic: "A", mode: "minor", scope: "cadential-cell" },
        chords: ["Bm7(b5)", "E7(b13)", "Am6"]
      })
    ]);
  });

  it("does not label unresolved ii-V motion as a complete local region", () => {
    const cells = detectIiVFunctionalCells(harmonies(["Dm7", "G7", "Am7"]));

    expect(cells).toHaveLength(0);
  });
});
