import { describe, expect, it } from "vitest";
import type { ScoreHarmonyEvent } from "../src/utils/music/analysis/models/ScoreSnapshot";
import { summarizeAppliedHarmonicVocabulary } from "./audit-applied-harmonic-vocabulary";

function harmony(harmonySymbol: string, index: number): ScoreHarmonyEvent {
  return {
    measure: index + 1,
    beat: 1,
    harmony: harmonySymbol,
    tickStart: index * 480,
    tickEnd: index * 480
  };
}

function progression(chords: string[]): ScoreHarmonyEvent[] {
  return chords.map(harmony);
}

describe("Applied harmonic vocabulary audit", () => {
  it("counts applied dominants, ii-V cells and tonic sixth colors", () => {
    const formulas = summarizeAppliedHarmonicVocabulary(
      progression(["C6/9", "A7", "Dm7", "G7", "C6"]),
      "C",
      "major"
    );

    expect(formulas.iiVCells).toBe(1);
    expect(formulas.appliedDominants).toBe(1);
    expect(formulas.primaryDominants).toBe(1);
    expect(formulas.tonicMajorSixths).toBe(2);
  });

  it("counts resolved diminished and minor plagal colors without requiring genre labels", () => {
    const formulas = summarizeAppliedHarmonicVocabulary(
      progression(["C", "C#dim7", "Dm7", "Fm", "C"]),
      "C",
      "major"
    );

    expect(formulas.diminishedChords).toBe(1);
    expect(formulas.resolvedDiminished).toBe(1);
    expect(formulas.minorPlagalCadences).toBe(1);
  });

  it("keeps bVI7 out of plain modal borrowing while counting SubV motion", () => {
    const formulas = summarizeAppliedHarmonicVocabulary(
      progression(["C", "Ab7", "G7", "Db7", "C"]),
      "C",
      "major"
    );

    expect(formulas.modalBorrowingColors).toBe(0);
    expect(formulas.tritoneSubstitutions).toBe(2);
  });
});
