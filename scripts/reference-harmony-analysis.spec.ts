import { describe, expect, it } from "vitest";
import { analyzeReferenceHarmony } from "../src/utils/music/analysis/strategies/ReferenceHarmonyAnalysis";
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

describe("F26.9 Reference Harmony Analysis Contract", () => {
  it("summarizes existing harmony as analysis material instead of a generated proposal", () => {
    const analysis = analyzeReferenceHarmony(harmonies(["Gmaj7", "Bb/A", "D9", "D/C", "Bbmaj7", "G/A", "G/B", "D"]));

    expect(analysis.hasExistingHarmony).toBe(true);
    expect(analysis.bassTrajectory).toEqual(["G", "A", "D", "C", "Bb", "A", "B", "D"]);
    expect(analysis.directCadentialDependency).toBe("low");
    expect(analysis.properties).toEqual(expect.arrayContaining([
      "STRUCTURAL_BASS_GRAMMAR",
      "PLANAR_CHORD_MOTION",
      "LOW_DIRECT_CADENTIAL_DEPENDENCE"
    ]));
    expect(analysis.slashChordProfile.independentBassRelations).toEqual(expect.arrayContaining([
      "Bb/A",
      "D/C",
      "G/A"
    ]));
    expect(analysis.slashChordProfile.functionalInversions).toContain("G/B");
    expect(analysis.explanation).toEqual(expect.arrayContaining([
      "O baixo atua como linha estrutural, não apenas como consequência da cifra",
      "Ponto de comparação para as alternativas de rearmonização"
    ]));
  });

  it("keeps ordinary functional inversions separate from structural bass grammar", () => {
    const analysis = analyzeReferenceHarmony(harmonies(["D", "D/F#", "G", "A7/E", "D"]));

    expect(analysis.hasExistingHarmony).toBe(true);
    expect(analysis.properties).not.toContain("STRUCTURAL_BASS_GRAMMAR");
    expect(analysis.properties).not.toContain("PLANAR_CHORD_MOTION");
    expect(analysis.slashChordProfile.independentBassRelations).toHaveLength(0);
    expect(analysis.slashChordProfile.functionalInversions).toEqual(expect.arrayContaining(["D/F#", "A7/E"]));
  });

  it("returns an empty reference contract when the score has no harmony layer", () => {
    const analysis = analyzeReferenceHarmony([]);

    expect(analysis.hasExistingHarmony).toBe(false);
    expect(analysis.bassTrajectory).toHaveLength(0);
    expect(analysis.explanation).toHaveLength(0);
  });
});
