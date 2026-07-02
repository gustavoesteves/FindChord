import { describe, expect, it } from "vitest";
import { analyzeStructuralBassGrammar } from "../src/utils/music/analysis/strategies/StructuralBassGrammar";
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

describe("F26.9 Structural Bass and Slash-Chord Analysis", () => {
  it("detects independent bass relationships without reducing them to inversions", () => {
    const report = analyzeStructuralBassGrammar(harmonies(["Gmaj7", "Bb/A", "D9", "D/C", "Bbmaj7", "G/A", "G/B", "D"]));

    expect(report.properties).toEqual(expect.arrayContaining([
      "STRUCTURAL_BASS_GRAMMAR",
      "UPPER_STRUCTURE_OVER_BASS",
      "BASS_MOTION_CONTINUITY",
      "CHROMATIC_BASS_MOTION",
      "STRUCTURAL_BASS_LEAP",
      "PLANAR_CHORD_MOTION"
    ]));
    expect(report.bassMotionProfile).toEqual(expect.arrayContaining([
      "STEP_ASC",
      "CHROMATIC_DESC",
      "STEP_DESC",
      "STRUCTURAL_LEAP"
    ]));
    expect(report.harmonicPlaneSegments).toEqual([
      expect.objectContaining({
        startMeasure: 1,
        endMeasure: 8,
        bassLine: ["G", "A", "D", "C", "Bb", "A", "B", "D"],
        independentBassCount: 3
      })
    ]);
    expect(report.relations).toEqual(expect.arrayContaining([
      expect.objectContaining({ chord: "Bb/A", relation: "INDEPENDENT_BASS" }),
      expect.objectContaining({ chord: "D/C", relation: "INDEPENDENT_BASS" }),
      expect.objectContaining({ chord: "G/A", relation: "INDEPENDENT_BASS" }),
      expect.objectContaining({ chord: "G/B", relation: "TRIVIAL_INVERSION" })
    ]));
  });

  it("does not label ordinary inversion chains as structural bass grammar", () => {
    const report = analyzeStructuralBassGrammar(harmonies(["D", "D/F#", "G", "A7/E", "D"]));

    expect(report.properties).not.toContain("STRUCTURAL_BASS_GRAMMAR");
    expect(report.properties).not.toContain("PLANAR_CHORD_MOTION");
    expect(report.independentBassCount).toBe(0);
    expect(report.relations).toEqual(expect.arrayContaining([
      expect.objectContaining({ chord: "D/F#", relation: "TRIVIAL_INVERSION" }),
      expect.objectContaining({ chord: "A7/E", relation: "TRIVIAL_INVERSION" })
    ]));
  });

  it("uses the chord symbol resolver when deciding slash chord inversions", () => {
    const report = analyzeStructuralBassGrammar(harmonies(["C7M/E", "Cø/Eb", "F/G"]));

    expect(report.relations).toEqual(expect.arrayContaining([
      expect.objectContaining({ chord: "C7M/E", relation: "TRIVIAL_INVERSION" }),
      expect.objectContaining({ chord: "Cø/Eb", relation: "TRIVIAL_INVERSION" }),
      expect.objectContaining({ chord: "F/G", relation: "INDEPENDENT_BASS" })
    ]));
  });
});
