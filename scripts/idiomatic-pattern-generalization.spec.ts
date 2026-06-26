import { describe, expect, it } from "vitest";
import { PhraseAnalysisEngine } from "../src/utils/music/analysis/engines/PhraseAnalysisEngine";
import type { MelodicAnchor } from "../src/utils/music/analysis/models/ProjectionSet";
import { StrategyGuidedHarmonizer } from "../src/utils/music/analysis/strategies/StrategyGuidedHarmonizer";

function anchorsByMeasure(measures: string[][]): MelodicAnchor[] {
  return measures.flatMap((notes, measureIndex) => notes.map((pitch, noteIndex) => ({
    measureIndex: measureIndex + 1,
    pitch,
    duration: noteIndex === notes.length - 1 ? 960 : 480
  })));
}

function basicAttemptFor(measures: string[][]) {
  const anchors = anchorsByMeasure(measures);
  const phraseContext = PhraseAnalysisEngine.analyzePhrase(anchors, "C");
  return StrategyGuidedHarmonizer.tryStrategy("I_IV_V", anchors, phraseContext);
}

function basicChordsFor(measures: string[][]): string[] {
  const attempt = basicAttemptFor(measures);
  expect(attempt.validation.accepted).toBe(true);
  return attempt.candidate.measures.map(measure => measure.chords[0]);
}

describe("F26.7 Idiomatic Functional Pattern Generalization", () => {
  it("prepares a structurally requested subdominant without knowing the source melody", () => {
    const chords = basicChordsFor([
      ["C"],
      ["C", "D", "E"],
      ["G"],
      ["C"],
      ["F", "A"],
      ["C", "D", "E"],
      ["G"],
      ["C"]
    ]);

    expect(chords.some((chord, index) => chord === "C7" && chords[index + 1] === "F")).toBe(true);
  });

  it("does not inject tonic-dominant preparation when the phrase remains in tonic territory", () => {
    const attempt = basicAttemptFor([
      ["C"],
      ["E", "G"],
      ["G"],
      ["E", "C"],
      ["C"],
      ["E", "G"],
      ["G"],
      ["C"]
    ]);
    const chords = attempt.candidate.measures.map(measure => measure.chords[0]);

    expect(chords.some((chord, index) => chord === "C7" && chords[index + 1] === "F")).toBe(false);
  });

  it("uses guided bass in cadential dominant-to-tonic motion without replacing every cadence", () => {
    const chords = basicChordsFor([
      ["C"],
      ["C", "D", "E"],
      ["G"],
      ["C"],
      ["F"],
      ["C", "D", "E"],
      ["G"],
      ["C"],
      ["C"],
      ["E", "G"],
      ["G"],
      ["C"]
    ]);

    const guidedCadences = chords.filter(chord => chord === "G7/B").length;
    expect(guidedCadences).toBeGreaterThan(0);
    expect(guidedCadences).toBeLessThan(chords.filter(chord => chord.startsWith("G")).length);
  });
});
